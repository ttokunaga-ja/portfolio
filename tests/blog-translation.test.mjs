import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  contentHash,
  createTranslationInput,
  PILOT_SLUGS,
  PROMPT_VERSION,
  restoreAndValidate,
  TRANSLATION_MODEL,
  translationAbstractDiagnostics,
  translationRequest
} from "../scripts/blog-translation-core.mjs";
import { splitTranslationBody } from "../scripts/blog-translation-segments.mjs";
import { createGeminiTranslator, parseArguments, runTranslations } from "../scripts/translate-blog.mjs";

const consent = { BLOG_TRANSLATION_ALLOW_API: "1", BLOG_TRANSLATION_FREE_TIER_CONFIRMED: "1" };
const sampleBody =
  "## Overview\n\nUse **GitHub** and `main`. [Docs](https://example.com/docs)\n\n```js\nconsole.log('日本語');\n```\n\n| Name | Count |\n| --- | --- |\n| Item | 2 |\n\n:::message alert\nKeep the original.\n:::\n";
const fakeTranslation = (input) => ({ title: "English title", abstract: "English summary.", body: input.body });

async function fixture(t, slugs = PILOT_SLUGS) {
  const root = await mkdtemp(join(tmpdir(), "blog-translation-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "content/ja/blog"), { recursive: true });
  for (const slug of slugs) {
    await writeFile(
      join(root, `content/ja/blog/${slug}.md`),
      `---\ntitle: "日本語タイトル"\nabstract: "日本語の概要"\npublishedAt: "2025-12-25"\ncanonicalUrl: "https://zenn.dev/t_tokunaga/articles/${slug}"\ntags:\n  - "Git"\n---\n\n${sampleBody}`
    );
  }
  return root;
}

test("translation protects code, URLs, names, and Markdown structure", () => {
  const input = createTranslationInput({ title: "タイトル", abstract: "概要", body: sampleBody });
  assert.ok(!input.body.includes("console.log"));
  assert.ok(
    input.replacements.some((item) => item.value === "https://example.com/docs" && input.body.includes(item.marker)),
    "the source link is represented by its exact protected marker"
  );
  assert.ok(!input.body.includes("GitHub"));
  const valid = restoreAndValidate(input, fakeTranslation(input));
  assert.equal(valid.body, sampleBody);
  assert.throws(() =>
    restoreAndValidate(input, { ...fakeTranslation(input), body: input.body.replace(/ZXQLOCK\d{5}QXZ/, "gone") })
  );
  const htmlInput = createTranslationInput({ title: "Title", abstract: "Summary", body: "Plain paragraph." });
  assert.throws(
    () => restoreAndValidate(htmlInput, { ...fakeTranslation(htmlInput), body: "<b>Raw markup</b>" }),
    /contains raw HTML/
  );
  assert.throws(() =>
    restoreAndValidate(input, { ...fakeTranslation(input), body: input.body.replace("## Overview", "### Overview") })
  );
  assert.throws(() =>
    restoreAndValidate(input, { ...fakeTranslation(input), body: input.body.replace("| Item | 2 |", "| Item | 3 |") })
  );
  assert.throws(() => restoreAndValidate(input, { ...fakeTranslation(input), canonicalUrl: "https://wrong.example/" }));
  assert.throws(() =>
    restoreAndValidate(input, {
      ...fakeTranslation(input),
      body: input.body.replace("Overview", "日本語の文章がそのまま残っています")
    })
  );
  const request = translationRequest(input);
  assert.equal(request.store, false);
  assert.equal(request.model, TRANSLATION_MODEL);
  assert.equal(request.tools, undefined);
  assert.equal(request.background, undefined);
});

test("plan is offline and never creates translated content or state", async (t) => {
  const root = await fixture(t);
  const summary = await runTranslations({ root, translate: () => assert.fail("No API call allowed") });
  assert.deepEqual(summary.pending, PILOT_SLUGS);
  await assert.rejects(readFile(join(root, "translations/blog-en-state.json")), { code: "ENOENT" });
  await assert.rejects(readFile(join(root, `content/en/blog/${PILOT_SLUGS[0]}.md`)), { code: "ENOENT" });
});

test("run requires explicit transmission and free-tier confirmation and rejects unreviewed models/slugs", async (t) => {
  const root = await fixture(t);
  for (const env of [{}, { BLOG_TRANSLATION_ALLOW_API: "1" }, { BLOG_TRANSLATION_FREE_TIER_CONFIRMED: "1" }]) {
    await assert.rejects(runTranslations({ root, mode: "run", env, translate: () => assert.fail("No API call") }));
  }
  await assert.rejects(runTranslations({ root, slugs: ["../escape"] }));
  await assert.rejects(runTranslations({ root, slugs: ["unreviewed-article"] }));
  await assert.rejects(runTranslations({ root, model: "paid-fallback-model" }));
  assert.throws(() => parseArguments(["run", "--unknown", "1"]));
});

test("successful translations are incremental, self-canonical-ready and preserve hand edits", async (t) => {
  const root = await fixture(t);
  let calls = 0;
  const run = (extra = {}) =>
    runTranslations({
      root,
      mode: "run",
      env: consent,
      translate: async (input) => {
        calls += 1;
        return fakeTranslation(input);
      },
      ...extra
    });
  const first = await run();
  assert.equal(calls, 2);
  assert.deepEqual(first.generated, PILOT_SLUGS);
  const outputPath = join(root, `content/en/blog/${PILOT_SLUGS[0]}.md`);
  const output = await readFile(outputPath, "utf8");
  assert.match(output, /sourceUrl: "https:\/\/zenn.dev/);
  assert.ok(!output.includes("canonicalUrl:"));
  assert.match(output, new RegExp(`translationPromptVersion: "${PROMPT_VERSION}"`));
  assert.ok(
    output.includes(
      `translationSourceHash: "${contentHash(await readFile(join(root, `content/ja/blog/${PILOT_SLUGS[0]}.md`), "utf8"))}"`
    )
  );
  assert.equal((await run()).unchanged.length, 2);
  assert.equal(calls, 2);
  await writeFile(outputPath, output + "\nManual edit.\n");
  const manual = await run();
  assert.deepEqual(manual.manual, [PILOT_SLUGS[0]]);
  assert.equal(calls, 2);
  assert.ok((await readFile(outputPath, "utf8")).includes("Manual edit."));
});

test("quota stops subsequent calls and persists a retryable queue without provider secrets", async (t) => {
  const root = await fixture(t);
  let calls = 0;
  const summary = await runTranslations({
    root,
    mode: "run",
    env: consent,
    translate: async () => {
      calls += 1;
      throw Object.assign(new Error("secret-key-and-provider-body"), { status: 429 });
    }
  });
  assert.equal(calls, 1);
  assert.equal(summary.waiting.length, 2);
  assert.ok(summary.waiting.every((item) => item.reason === "quota"));
  const state = await readFile(join(root, "translations/blog-en-state.json"), "utf8");
  assert.ok(!state.includes("secret-key"));
  const retry = await runTranslations({
    now: () => new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    root,
    mode: "run",
    env: consent,
    translate: async (input) => fakeTranslation(input)
  });
  assert.equal(retry.generated.length, 2);
});

test("an invalid result keeps old output while later valid articles can succeed", async (t) => {
  const root = await fixture(t);
  let calls = 0;
  const summary = await runTranslations({
    root,
    mode: "run",
    env: consent,
    translate: async (input) => {
      calls += 1;
      return calls === 1
        ? { title: "Wrong", abstract: "Wrong", body: "Missing article content." }
        : fakeTranslation(input);
    }
  });
  assert.equal(summary.failed.length, 1);
  assert.deepEqual(summary.generated, [PILOT_SLUGS[1]]);
  await assert.rejects(readFile(join(root, `content/en/blog/${PILOT_SLUGS[0]}.md`)), { code: "ENOENT" });
});

test("run caps are bounded and missing sources clean only unchanged machine output", async (t) => {
  const root = await fixture(t);
  const limited = await runTranslations({
    root,
    mode: "run",
    env: consent,
    maxArticles: 1,
    translate: async (input) => fakeTranslation(input)
  });
  assert.equal(limited.generated.length, 1);
  assert.equal(limited.waiting[0].reason, "run_limit");
  await rm(join(root, `content/ja/blog/${PILOT_SLUGS[0]}.md`));
  const next = await runTranslations({
    root,
    mode: "run",
    env: consent,
    translate: async (input) => fakeTranslation(input)
  });
  assert.deepEqual(next.deleted, [PILOT_SLUGS[0]]);
  await assert.rejects(readFile(join(root, `content/en/blog/${PILOT_SLUGS[0]}.md`)), { code: "ENOENT" });
});

test("a failed update preserves last generated bytes and records the new pending source", async (t) => {
  const root = await fixture(t, [PILOT_SLUGS[0]]);
  const options = { root, mode: "run", slugs: [PILOT_SLUGS[0]], env: consent };
  await runTranslations({ ...options, translate: async (input) => fakeTranslation(input) });
  const sourcePath = join(root, `content/ja/blog/${PILOT_SLUGS[0]}.md`);
  const outputPath = join(root, `content/en/blog/${PILOT_SLUGS[0]}.md`);
  const original = await readFile(outputPath, "utf8");
  const updated = (await readFile(sourcePath, "utf8")) + "\nNew paragraph.\n";
  await writeFile(sourcePath, updated);
  const result = await runTranslations({
    ...options,
    translate: async () => ({ title: "Bad", abstract: "Bad", body: "Missing structure" })
  });
  assert.equal(result.failed[0].reason, "output_validation");
  assert.equal(await readFile(outputPath, "utf8"), original);
  const state = JSON.parse(await readFile(join(root, "translations/blog-en-state.json"), "utf8"));
  assert.equal(state.entries[PILOT_SLUGS[0]].pendingSourceHash, contentHash(updated));
  assert.equal(state.entries[PILOT_SLUGS[0]].outputHash, contentHash(original));
});

test("existing English without generated state is never adopted or overwritten", async (t) => {
  const root = await fixture(t, [PILOT_SLUGS[0]]);
  await mkdir(join(root, "content/en/blog"), { recursive: true });
  const path = join(root, `content/en/blog/${PILOT_SLUGS[0]}.md`);
  await writeFile(path, "Hand-written English");
  const result = await runTranslations({
    root,
    mode: "run",
    slugs: [PILOT_SLUGS[0]],
    env: consent,
    translate: () => assert.fail("Do not translate hand-written English")
  });
  assert.deepEqual(result.manual, [PILOT_SLUGS[0]]);
  assert.equal(await readFile(path, "utf8"), "Hand-written English");
});

test("concurrent source or output changes are not overwritten", async (t) => {
  const root = await fixture(t, [PILOT_SLUGS[0]]);
  const summary = await runTranslations({
    root,
    mode: "run",
    slugs: [PILOT_SLUGS[0]],
    env: consent,
    translate: async (input) => {
      await mkdir(join(root, "content/en/blog"), { recursive: true });
      await writeFile(join(root, `content/en/blog/${PILOT_SLUGS[0]}.md`), "Human content");
      return fakeTranslation(input);
    }
  });
  assert.equal(summary.waiting[0].reason, "concurrent_change");
  assert.equal(await readFile(join(root, `content/en/blog/${PILOT_SLUGS[0]}.md`), "utf8"), "Human content");
});

test("official REST adapter makes one fixed-endpoint request with stateless structured output", async () => {
  const input = createTranslationInput({ title: "Title", abstract: "Summary", body: sampleBody });
  let calls = 0;
  const translate = createGeminiTranslator({
    apiKey: "unit-test-not-a-real-key",
    fetchImpl: async (url, options) => {
      calls += 1;
      assert.equal(url, "https://generativelanguage.googleapis.com/v1beta/interactions");
      assert.equal(options.redirect, "error");
      assert.equal(options.headers["x-goog-api-key"], "unit-test-not-a-real-key");
      const request = JSON.parse(options.body);
      assert.equal(request.store, false);
      assert.equal(request.response_format.mime_type, "application/json");
      assert.ok(!request.input.includes("console.log"));
      const payload = JSON.parse(request.input);
      assert.equal(payload.bodyContext, input.body);
      assert.ok(payload.segments.every(({ text }) => !/ZXQLOCK\d+QXZ/.test(text)));
      assert.equal(request.response_format.schema.properties.bodySegments.minItems, payload.segments.length);
      assert.equal(request.response_format.schema.properties.bodySegments.maxItems, payload.segments.length);
      return new Response(
        JSON.stringify({
          status: "completed",
          steps: [
            {
              type: "model_output",
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    titleSegments: ["English title"],
                    abstractSegments: ["English summary."],
                    bodySegments: splitTranslationBody(input.body).segments
                  })
                }
              ]
            }
          ]
        })
      );
    }
  });
  assert.equal(restoreAndValidate(input, await translate(input, TRANSLATION_MODEL)).title, "English title");
  assert.equal(calls, 1);
  const quota = createGeminiTranslator({
    apiKey: "unit-test-not-a-real-key",
    fetchImpl: async () => new Response("provider-secret", { status: 429 })
  });
  await assert.rejects(
    quota(input, TRANSLATION_MODEL),
    (error) => error.status === 429 && !error.message.includes("provider-secret")
  );
});

test("transient failures retry only the failed article after cooldown and stop at five attempts", async (t) => {
  const root = await fixture(t);
  let ms = Date.parse("2026-10-02T12:00:00Z");
  let calls = 0;
  const run = () =>
    runTranslations({
      root,
      mode: "run",
      env: consent,
      now: () => new Date(ms).toISOString(),
      random: () => 0,
      translate: async (input) => {
        calls++;
        if (input.title === "日本語タイトル" && calls !== 2) throw Object.assign(new Error("private"), { status: 503 });
        return fakeTranslation(input);
      }
    });
  const first = await run();
  assert.equal(first.waiting.length, 1);
  assert.equal(first.generated.length, 1);
  assert.equal(calls, 2);
  await run();
  assert.equal(calls, 2, "unchanged success and cooling-down failure do not spend quota");
  for (let i = 0; i < 4; i++) {
    ms += 24 * 60 * 60 * 1000;
    await run();
  }
  assert.equal(calls, 6, "five total calls for failed article plus one success");
  ms += 30 * 24 * 60 * 60 * 1000;
  const exhausted = await run();
  assert.equal(calls, 6, "elapsed days and repeated schedules cannot reset the allowance");
  assert.equal(exhausted.failed[0].attemptCount, 5);
  const source = join(root, `content/ja/blog/${PILOT_SLUGS[0]}.md`);
  await writeFile(source, (await readFile(source, "utf8")) + "\nNew public paragraph.\n");
  await run();
  assert.equal(calls, 7, "only a new source/model/prompt input resets the allowance");
});

for (const status of [400, 401, 402, 403]) {
  test(`client error ${status} is terminal and never retried hourly`, async (t) => {
    const root = await fixture(t, [PILOT_SLUGS[0]]);
    let calls = 0;
    const options = {
      root,
      mode: "run",
      env: consent,
      slugs: [PILOT_SLUGS[0]],
      translate: async () => {
        calls++;
        throw Object.assign(new Error("redacted"), { status });
      }
    };
    assert.equal((await runTranslations(options)).failed.length, 1);
    await runTranslations({ ...options, now: () => "2030-01-01T00:00:00Z" });
    assert.equal(calls, 1);
  });
}

test("durable reservations consume attempts even when a runner is cancelled before result publication", async (t) => {
  const root = await fixture(t, [PILOT_SLUGS[0]]);
  let ms = Date.parse("2026-10-02T12:00:00Z");
  const options = { root, env: consent, slugs: [PILOT_SLUGS[0]], now: () => new Date(ms).toISOString() };
  for (let attempt = 1; attempt <= 5; attempt++) {
    const summary = await runTranslations({
      ...options,
      mode: "reserve",
      reservationId: `123-${attempt}`,
      translate: () => assert.fail("reservation must not access API")
    });
    assert.equal(summary.reserved.length, 1);
    const state = JSON.parse(await readFile(join(root, "translations/blog-en-state.json"), "utf8"));
    assert.equal(state.entries[PILOT_SLUGS[0]].attemptCount, attempt);
    // Simulate runner cancellation after GitHub has persisted its reservation.
    ms += 24 * 60 * 60 * 1000;
  }
  const stopped = await runTranslations({ ...options, mode: "reserve", reservationId: "123-6" });
  assert.equal(stopped.reserved.length, 0);
  assert.equal(stopped.failed[0].attemptCount, 5);
  await runTranslations({
    ...options,
    mode: "run",
    reservationId: "123-6",
    translate: () => assert.fail("no sixth request")
  });
});

test("a reserved final attempt can succeed, and repeated runs are idempotent", async (t) => {
  const root = await fixture(t, [PILOT_SLUGS[0]]);
  let ms = Date.parse("2026-10-02T12:00:00Z");
  const options = { root, env: consent, slugs: [PILOT_SLUGS[0]], now: () => new Date(ms).toISOString() };
  for (let i = 1; i <= 5; i++) {
    await runTranslations({ ...options, mode: "reserve", reservationId: `123-${i}` });
    ms += 24 * 60 * 60 * 1000;
  }
  let calls = 0;
  const translated = await runTranslations({
    ...options,
    mode: "run",
    reservationId: "123-5",
    translate: async (input) => {
      calls++;
      return fakeTranslation(input);
    }
  });
  assert.equal(translated.generated.length, 1);
  await runTranslations({
    ...options,
    mode: "run",
    reservationId: "123-5",
    translate: () => assert.fail("success must not repeat")
  });
  assert.equal(calls, 1);
});

test("placeholder credentials are rejected before a network request", () => {
  for (const apiKey of ["REPLACE_WITH_YOUR_FREE_TIER_KEY", "YOUR_GEMINI_KEY", "PLACEHOLDER", ""]) {
    assert.throws(() => createGeminiTranslator({ apiKey, fetchImpl: () => assert.fail("no network") }));
  }
});

const { errorHints, nextPacificMidnight, retryDecision } = await import("../scripts/blog-translation-retry.mjs");
test("retry hints honor Retry-After and RetryInfo without keeping provider bodies", () => {
  const ms = Date.parse("2026-10-02T12:00:00Z");
  const hints = errorHints(
    new Response("", { status: 429, headers: { "retry-after": "7200" } }),
    {
      error: {
        message: "private",
        details: [
          { "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "10800s" },
          {
            "@type": "type.googleapis.com/google.rpc.QuotaFailure",
            violations: [{ quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier" }]
          }
        ]
      }
    },
    ms
  );
  assert.deepEqual(hints, { retryAfterMs: 10800000, dailyQuota: true });
  assert.equal(retryDecision({ status: 429, ...hints }, 1, ms, () => 0).nextAttemptAt, "2026-10-03T07:05:00.000Z");
  const dated = errorHints(new Response("", { headers: { "retry-after": "Fri, 02 Oct 2026 16:00:00 GMT" } }), {}, ms);
  assert.equal(retryDecision({ status: 503, ...dated }, 1, ms, () => 1).nextAttemptAt, "2026-10-02T16:00:00.000Z");
  assert.equal(retryDecision({ status: 503 }, 1, ms, () => 1).nextAttemptAt, "2026-10-02T13:05:00.000Z");
});

test("Pacific daily quota reset calculation follows daylight saving time", () => {
  assert.equal(
    new Date(nextPacificMidnight(Date.parse("2026-03-08T09:59:00Z"))).toISOString(),
    "2026-03-09T07:00:00.000Z"
  );
  assert.equal(
    new Date(nextPacificMidnight(Date.parse("2026-11-01T08:59:00Z"))).toISOString(),
    "2026-11-02T08:00:00.000Z"
  );
});

test("timeout and cancellation errors count once and get a bounded cooldown", async (t) => {
  const root = await fixture(t, [PILOT_SLUGS[0]]);
  const summary = await runTranslations({
    root,
    mode: "run",
    env: consent,
    slugs: [PILOT_SLUGS[0]],
    now: () => "2026-10-02T12:00:00Z",
    random: () => 0,
    translate: async () => {
      throw new DOMException("cancelled", "AbortError");
    }
  });
  assert.deepEqual(summary.waiting[0], {
    slug: PILOT_SLUGS[0],
    reason: "temporarily_unavailable",
    attemptCount: 1,
    nextAttemptAt: "2026-10-02T13:00:00.000Z"
  });
});

test("invalid-output diagnostics contain fixed codes without response data", async (t) => {
  const { translationValidationCode } = await import("../scripts/blog-translation-core.mjs");
  assert.equal(translationValidationCode(new Error("private provider content")), "markdown_or_unknown");
  const root = await fixture(t, [PILOT_SLUGS[0]]);
  const result = await runTranslations({
    root,
    mode: "run",
    slugs: [PILOT_SLUGS[0]],
    env: consent,
    translate: async (input) => ({ ...fakeTranslation(input), title: "English title 999" })
  });
  assert.equal(result.failed[0].validationCode, "numbers_title");
  assert.equal(result.failed[0].attemptCount, 1);
  const state = await readFile(join(root, "translations/blog-en-state.json"), "utf8");
  assert.ok(!state.includes("999"));
  assert.equal(JSON.parse(state).entries[PILOT_SLUGS[0]].validationCode, "numbers_title");
});

test("abstract format diagnostics distinguish length, line breaks and angle brackets without changing rejection", async () => {
  const { translationValidationCode } = await import("../scripts/blog-translation-core.mjs");
  const input = createTranslationInput({ title: "題名", abstract: "概要", body: "Plain paragraph." });
  const base = { title: "English title", abstract: "English summary.", body: input.body };
  for (const [abstract, expected] of [
    ["x".repeat(1601), { characterCount: 1601, exceedsLength: true, hasLineBreak: false, hasAngleBracket: false }],
    ["English\nsummary", { characterCount: 15, exceedsLength: false, hasLineBreak: true, hasAngleBracket: false }],
    ["English <summary>", { characterCount: 17, exceedsLength: false, hasLineBreak: false, hasAngleBracket: true }]
  ]) {
    let error;
    try {
      restoreAndValidate(input, { ...base, abstract });
    } catch (caught) {
      error = caught;
    }
    assert.equal(translationValidationCode(error), "abstract_format");
    assert.deepEqual(translationAbstractDiagnostics(input, { ...base, abstract }), expected);
  }
  assert.equal(translationAbstractDiagnostics(input, { ...base, abstract: 123 }), null);
  assert.equal(translationAbstractDiagnostics(input, null), null);
});

test("abstract diagnostics inspect trusted segment reassembly and persist only fixed facts", async (t) => {
  const input = createTranslationInput({ title: "Title", abstract: "6 ステップ", body: "Plain paragraph." });
  const payload = JSON.parse(translationRequest(input).input);
  const candidate = {
    titleSegments: payload.titleSegments.map(({ text }) => text),
    abstractSegments: payload.abstractSegments.map(({ text }) => text.replace("ステップ", "Steps\nhere")),
    bodySegments: payload.segments.map(({ text }) => text)
  };
  const diagnostics = translationAbstractDiagnostics(input, candidate);
  assert.equal(diagnostics.hasLineBreak, true);
  assert.equal(diagnostics.hasAngleBracket, false);
  assert.throws(() => restoreAndValidate(input, candidate), /Invalid translated abstract/);

  const root = await fixture(t, [PILOT_SLUGS[0]]);
  const result = await runTranslations({
    root,
    mode: "run",
    slugs: [PILOT_SLUGS[0]],
    env: consent,
    translate: async (source) => ({ ...fakeTranslation(source), abstract: "English\nprivate summary" })
  });
  assert.equal(result.failed[0].validationCode, "abstract_format");
  assert.deepEqual(result.failed[0].abstractDiagnostics, {
    characterCount: 23,
    exceedsLength: false,
    hasLineBreak: true,
    hasAngleBracket: false
  });
  const state = await readFile(join(root, "translations/blog-en-state.json"), "utf8");
  assert.deepEqual(JSON.parse(state).entries[PILOT_SLUGS[0]].abstractDiagnostics, result.failed[0].abstractDiagnostics);
  assert.ok(!state.includes("private summary"));
});

test("manual rejected-output recovery keeps counts and cannot permit a sixth request", async (t) => {
  const root = await fixture(t, [PILOT_SLUGS[0]]);
  const options = { root, slugs: [PILOT_SLUGS[0]], env: consent };
  let calls = 0;
  const invalid = async (input) => {
    calls++;
    return { ...fakeTranslation(input), title: "Wrong 999" };
  };
  await runTranslations({ ...options, mode: "run", translate: invalid });
  const recoveryEnv = { ...consent, BLOG_TRANSLATION_RETRY_VALIDATION: "true", GITHUB_EVENT_NAME: "workflow_dispatch" };
  const scheduled = await runTranslations({
    ...options,
    mode: "reserve",
    reservationId: "123-1",
    env: { ...recoveryEnv, GITHUB_EVENT_NAME: "schedule" }
  });
  assert.equal(scheduled.reserved.length, 0);
  for (let attempt = 2; attempt <= 5; attempt++) {
    const reservationId = `123-${attempt}`;
    const reservation = await runTranslations({ ...options, mode: "reserve", reservationId, env: recoveryEnv });
    assert.equal(reservation.reserved.length, 1);
    const result = await runTranslations({ ...options, mode: "run", reservationId, translate: invalid });
    assert.equal(result.failed[0].attemptCount, attempt);
  }
  const stopped = await runTranslations({ ...options, mode: "reserve", reservationId: "123-6", env: recoveryEnv });
  assert.equal(stopped.reserved.length, 0);
  assert.equal(calls, 5);
});

test("manual rejected-output recovery never reopens terminal credential errors", async (t) => {
  const root = await fixture(t, [PILOT_SLUGS[0]]);
  const options = { root, slugs: [PILOT_SLUGS[0]], env: consent };
  await runTranslations({
    ...options,
    mode: "run",
    translate: async () => {
      throw Object.assign(new Error("private"), { status: 401 });
    }
  });
  const result = await runTranslations({
    ...options,
    mode: "reserve",
    reservationId: "123-2",
    env: { ...consent, BLOG_TRANSLATION_RETRY_VALIDATION: "true", GITHUB_EVENT_NAME: "workflow_dispatch" }
  });
  assert.equal(result.reserved.length, 0);
});

test("generated title and abstract reject leaked protected markers", () => {
  const input = createTranslationInput({ title: "Title", abstract: "Summary", body: "Article with `code`." });
  for (const key of ["title", "abstract"]) {
    assert.throws(
      () => restoreAndValidate(input, { ...fakeTranslation(input), [key]: "Leaked ZXQLOCK00016QXZ text" }),
      /Unresolved marker in translation metadata/
    );
  }
});

test("segment reconstruction retains all downstream validation checks", () => {
  const input = createTranslationInput({ title: "Title", abstract: "Summary", body: sampleBody });
  const segments = splitTranslationBody(input.body).segments;
  const candidate = { title: "English title", abstract: "English summary.", bodySegments: segments };
  assert.equal(restoreAndValidate(input, candidate).body, sampleBody);
  assert.throws(
    () =>
      restoreAndValidate(input, {
        ...candidate,
        bodySegments: segments.map((x) => x.replace("## Overview", "Overview"))
      }),
    /Markdown structure/
  );
  assert.throws(
    () =>
      restoreAndValidate(input, {
        ...candidate,
        bodySegments: segments.map((x) => x.replace("Item", "Item 999"))
      }),
    /Numeric literals/
  );
  assert.throws(() => restoreAndValidate(input, { ...candidate, bodySegments: segments.slice(1) }), /segment count/);
  assert.throws(() => restoreAndValidate(input, { ...candidate, abstract: "ZXQLOCK00001QXZ" }), /metadata/);
});

test("protocol repair keeps the existing attempt allowance and cached successful article", async (t) => {
  const root = await fixture(t);
  const opts = { root, env: consent };
  const invalid = async (input) =>
    input.title === "日本語タイトル" ? { title: "Wrong", abstract: "Wrong", body: "missing" } : fakeTranslation(input);
  await runTranslations({
    ...opts,
    mode: "run",
    slugs: [PILOT_SLUGS[1]],
    translate: async (input) => fakeTranslation(input)
  });
  await runTranslations({ ...opts, mode: "run", slugs: [PILOT_SLUGS[0]], translate: invalid });
  const env = { ...consent, GITHUB_EVENT_NAME: "workflow_dispatch", BLOG_TRANSLATION_RETRY_VALIDATION: "true" };
  await runTranslations({ ...opts, mode: "reserve", slugs: [PILOT_SLUGS[0]], reservationId: "123-2", env });
  await runTranslations({ ...opts, mode: "run", slugs: [PILOT_SLUGS[0]], reservationId: "123-2", translate: invalid });
  const before = JSON.parse(await readFile(join(root, "translations/blog-en-state.json"), "utf8"));
  await runTranslations({ ...opts, mode: "reserve", reservationId: "123-3", env });
  let calls = 0;
  const result = await runTranslations({
    ...opts,
    mode: "run",
    reservationId: "123-3",
    translate: async (input) => {
      calls++;
      return {
        title: "English title",
        abstract: "English summary.",
        bodySegments: splitTranslationBody(input.body).segments
      };
    }
  });
  assert.equal(calls, 1);
  assert.deepEqual(result.generated, [PILOT_SLUGS[0]]);
  assert.deepEqual(result.unchanged, [PILOT_SLUGS[1]]);
  const after = JSON.parse(await readFile(join(root, "translations/blog-en-state.json"), "utf8"));
  assert.equal(after.entries[PILOT_SLUGS[0]].attemptCount, 3);
  assert.equal(after.entries[PILOT_SLUGS[0]].inputHash, before.entries[PILOT_SLUGS[0]].inputHash);
  assert.deepEqual(after.entries[PILOT_SLUGS[1]], before.entries[PILOT_SLUGS[1]]);
  assert.equal(after.entries[PILOT_SLUGS[0]].protocolVersion, "locked-segments-v3");
});
