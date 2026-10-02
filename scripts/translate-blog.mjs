import assert from "node:assert/strict";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseFrontmatter } from "./frontmatter.mjs";
import { isPublicBlogTranslationSource } from "./blog-translation-eligibility.mjs";
import {
  assertSlug,
  contentHash,
  createTranslationInput,
  PILOT_SLUGS,
  PROMPT_VERSION,
  restoreAndValidate,
  serializeTranslation,
  TRANSLATION_MODEL,
  translationRequest
} from "./blog-translation-core.mjs";

import { errorHints, MAX_ATTEMPTS, retryDecision } from "./blog-translation-retry.mjs";

const apiEndpoint = "https://generativelanguage.googleapis.com/v1beta/interactions";
const stateRelativePath = "translations/blog-en-state.json";

async function optionalRead(path) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function atomicWrite(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}`;
  try {
    await writeFile(temporary, value, "utf8");
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

async function readState(root) {
  const raw = await optionalRead(join(root, stateRelativePath));
  if (raw === null) return { schemaVersion: 1, entries: {} };
  const state = JSON.parse(raw);
  assert.equal(state.schemaVersion, 1, "Unsupported translation state version");
  assert.ok(
    state.entries && typeof state.entries === "object" && !Array.isArray(state.entries),
    "Invalid translation state"
  );
  if (state.cooldownUntil != null)
    assert.ok(Number.isFinite(Date.parse(state.cooldownUntil)), "Invalid quota cooldown");
  for (const [slug, entry] of Object.entries(state.entries)) {
    assertSlug(slug);
    assert.ok(entry && typeof entry === "object" && !Array.isArray(entry), "Invalid translation state entry");
    for (const key of ["sourceHash", "outputHash", "pendingSourceHash", "inputHash"]) {
      if (entry[key] !== undefined) assert.match(entry[key], /^[a-f0-9]{64}$/, "Invalid recorded hash");
    }
    if (entry.attemptCount !== undefined)
      assert.ok(
        Number.isInteger(entry.attemptCount) && entry.attemptCount >= 0 && entry.attemptCount <= MAX_ATTEMPTS,
        "Invalid attempt count"
      );
    if (entry.nextAttemptAt != null)
      assert.ok(Number.isFinite(Date.parse(entry.nextAttemptAt)), "Invalid retry timestamp");
  }
  return state;
}

async function responseText(response) {
  const reader = response.body?.getReader();
  assert.ok(reader, "Empty API response");
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      assert.ok(size <= 1_000_000, "API response exceeded limit");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function createGeminiTranslator({ apiKey, fetchImpl = fetch }) {
  assert.ok(
    typeof apiKey === "string" && apiKey.trim() && !/REPLACE_WITH|YOUR_.*KEY|PLACEHOLDER/i.test(apiKey),
    "GEMINI_API_KEY is required"
  );
  return async (input, model) => {
    const response = await fetchImpl(apiEndpoint, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(90_000),
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(translationRequest(input, model))
    });
    if (!response.ok) {
      let payload;
      try {
        payload = JSON.parse(await responseText(response));
      } catch {
        /* bounded, sanitized failure */
      }
      const error = new Error("Gemini request failed");
      const hints = errorHints(response, payload);
      error.status = response.status;
      error.retryAfterMs = hints.retryAfterMs;
      error.dailyQuota = hints.dailyQuota;
      throw error;
    }
    const payload = JSON.parse(await responseText(response));
    assert.equal(payload.status, "completed", "Gemini response is incomplete or blocked");
    const lastOutput = payload.steps?.findLast((step) => step.type === "model_output");
    assert.ok(lastOutput && Array.isArray(lastOutput.content), "Gemini response has no model output");
    assert.ok(
      lastOutput.content.every((part) => part.type === "text"),
      "Unexpected non-text model output"
    );
    const text = lastOutput.content.map((part) => part.text).join("");
    return JSON.parse(text);
  };
}

export async function runTranslations({
  root = process.cwd(),
  mode = "plan",
  slugs = PILOT_SLUGS,
  maxArticles = 2,
  model = TRANSLATION_MODEL,
  translate,
  env = process.env,
  now = () => new Date().toISOString(),
  random = Math.random,
  reservationId = env.BLOG_TRANSLATION_RESERVATION_ID
} = {}) {
  assert.ok(["plan", "reserve", "run"].includes(mode), "Mode must be plan, reserve or run");
  assert.equal(model, TRANSLATION_MODEL, "Only the reviewed translation model is enabled");
  assert.ok(Number.isInteger(maxArticles) && maxArticles >= 1 && maxArticles <= 3, "max-articles must be 1 to 3");
  assert.ok(slugs.length > 0 && slugs.length <= 3, "Select 1 to 3 reviewed pilot articles");
  const selected = [...new Set(slugs)].map(assertSlug);
  assert.ok(
    selected.every((slug) => PILOT_SLUGS.includes(slug)),
    "Only the reviewed pilot article allowlist is enabled"
  );
  if (mode === "run") {
    assert.equal(env.BLOG_TRANSLATION_ALLOW_API, "1", "API transmission is disabled until explicitly enabled");
    assert.equal(
      env.BLOG_TRANSLATION_FREE_TIER_CONFIRMED,
      "1",
      "Confirm an unbilled free-tier project before enabling API calls"
    );
    // A key does not prove its billing tier. The explicit operator confirmation
    // is required; this script never enables billing or falls back to a paid route.
    translate ??= createGeminiTranslator({ apiKey: env.GEMINI_API_KEY });
  }
  if (mode === "reserve")
    assert.match(reservationId ?? "", /^[0-9]+-[0-9]+$/, "A workflow run-attempt reservation ID is required");
  const state = await readState(root);
  const checkpoint = () => atomicWrite(join(root, stateRelativePath), `${JSON.stringify(state, null, 2)}\n`);
  const writing = mode !== "plan";
  const nowMs = Date.parse(now());
  assert.ok(Number.isFinite(nowMs), "Invalid current time");
  const summary = {
    mode,
    model,
    promptVersion: PROMPT_VERSION,
    generated: [],
    unchanged: [],
    manual: [],
    waiting: [],
    failed: [],
    deleted: [],
    pending: [],
    reserved: []
  };
  const sourcesDir = join(root, "content/ja/blog");
  const sourceFiles = new Set((await readdir(sourcesDir)).filter((file) => file.endsWith(".md")));
  let attempts = 0;
  let suspendedReason = state.cooldownUntil && Date.parse(state.cooldownUntil) > nowMs ? "quota_cooldown" : null;
  if (state.cooldownUntil && !suspendedReason && writing) delete state.cooldownUntil;

  // Cleanup only exact machine-owned output bytes. Hand edits are retained for
  // review; build-time source eligibility still prevents orphaned publication.
  for (const [slug, previous] of Object.entries(state.entries)) {
    if (sourceFiles.has(`${slug}.md`)) continue;
    const outputPath = join(root, "content/en/blog", `${slug}.md`);
    const output = await optionalRead(outputPath);
    if (output === null) {
      if (writing) delete state.entries[slug];
      continue;
    }
    if (previous.outputHash && contentHash(output) === previous.outputHash) {
      summary.deleted.push(slug);
      if (writing) {
        await rm(outputPath);
        delete state.entries[slug];
      }
    } else {
      summary.manual.push(slug);
    }
  }

  for (const slug of selected) {
    const sourcePath = join(sourcesDir, `${slug}.md`);
    const sourceRaw = await optionalRead(sourcePath);
    if (sourceRaw === null) {
      summary.waiting.push({ slug, reason: "source_missing" });
      continue;
    }
    const { data: source, content: body } = parseFrontmatter(sourceRaw);
    const sourceHash = contentHash(sourceRaw);
    if (!isPublicBlogTranslationSource(source, slug)) {
      summary.waiting.push({ slug, reason: "source_not_public" });
      continue;
    }
    assert.ok(typeof source.title === "string" && typeof source.abstract === "string", "Source metadata missing");
    const previous = Object.hasOwn(state.entries, slug) ? state.entries[slug] : {};
    const outputPath = join(root, "content/en/blog", `${slug}.md`);
    const output = await optionalRead(outputPath);
    if (
      previous.status === "manual" ||
      (output !== null && (!previous.outputHash || contentHash(output) !== previous.outputHash))
    ) {
      summary.manual.push(slug);
      if (writing) state.entries[slug] = { ...previous, status: "manual", pendingSourceHash: sourceHash };
      continue;
    }
    if (
      output !== null &&
      previous.sourceHash === sourceHash &&
      previous.model === model &&
      previous.promptVersion === PROMPT_VERSION
    ) {
      summary.unchanged.push(slug);
      continue;
    }
    summary.pending.push(slug);
    const inputHash = contentHash(JSON.stringify({ sourceHash, model, promptVersion: PROMPT_VERSION }));
    const sameInput = previous.inputHash === inputHash;
    const attemptCount = sameInput ? (previous.attemptCount ?? 0) : 0;
    const reserved =
      mode === "run" &&
      reservationId &&
      sameInput &&
      previous.status === "reserved" &&
      previous.reservationId === reservationId;
    if (sameInput && (previous.status === "exhausted" || attemptCount >= MAX_ATTEMPTS) && !reserved) {
      summary.failed.push({ slug, reason: previous.reason ?? "attempts_exhausted", attemptCount });
      continue;
    }
    if (mode === "run" && reservationId && !reserved) {
      summary.waiting.push({ slug, reason: "not_reserved" });
      continue;
    }
    if (!reserved && sameInput && previous.nextAttemptAt && Date.parse(previous.nextAttemptAt) > nowMs) {
      summary.waiting.push({ slug, reason: "cooldown", nextAttemptAt: previous.nextAttemptAt, attemptCount });
      continue;
    }
    if (mode === "plan") continue;
    if (suspendedReason || attempts >= maxArticles) {
      summary.waiting.push({ slug, reason: suspendedReason ?? "run_limit" });
      continue;
    }
    let input;
    try {
      input = createTranslationInput({ title: source.title, abstract: source.abstract, body });
    } catch {
      summary.failed.push({ slug, reason: "source_validation" });
      state.entries[slug] = {
        ...previous,
        status: "error",
        pendingSourceHash: sourceHash,
        reason: "source_validation",
        inputHash,
        attemptCount
      };
      continue;
    }
    const counted = reserved ? attemptCount : attemptCount + 1;
    state.entries[slug] = {
      ...previous,
      inputHash,
      attemptCount: counted,
      pendingSourceHash: sourceHash,
      status: "reserved",
      reservationId: reservationId ?? null,
      reason: "request_reserved",
      nextAttemptAt: new Date(nowMs + 60 * 60 * 1000 * 2 ** (counted - 1)).toISOString()
    };
    attempts += 1;
    // Actions publishes this reservation BEFORE the key-bearing job starts. A
    // cancelled runner or a failed result upload still consumes the attempt.
    await checkpoint();
    if (mode === "reserve") {
      summary.reserved.push(slug);
      continue;
    }
    let candidate;
    try {
      candidate = await translate(input, model);
    } catch (error) {
      const decision = retryDecision(error, counted, nowMs, random);
      state.entries[slug] = { ...state.entries[slug], ...decision, reservationId: null };
      const report = { slug, reason: decision.reason, attemptCount: counted, nextAttemptAt: decision.nextAttemptAt };
      (decision.status === "exhausted" ? summary.failed : summary.waiting).push(report);
      if (Number(error?.status) === 429) {
        suspendedReason = "quota";
        // Shared project quota: don't spend another article's allowance on it.
        state.cooldownUntil = decision.nextAttemptAt ?? new Date(nowMs + 24 * 60 * 60 * 1000).toISOString();
      }
      if ([400, 401, 402, 403].includes(Number(error?.status))) suspendedReason = "credentials_or_request";
      await checkpoint();
      // Never persist the exception, prompt, response, API key or request URL.
      continue;
    }
    let translated;
    try {
      translated = restoreAndValidate(input, candidate);
    } catch {
      summary.failed.push({ slug, reason: "output_validation" });
      state.entries[slug] = {
        ...state.entries[slug],
        status: "exhausted",
        reason: "output_validation",
        nextAttemptAt: null,
        reservationId: null
      };
      continue;
    }
    const generatedAt = now();
    const serialized = serializeTranslation({ source, translated, sourceHash, model, generatedAt });
    // Recheck both sides immediately before publishing locally. A concurrent
    // source update or manual edit must never be overwritten by a delayed API response.
    if ((await optionalRead(sourcePath)) !== sourceRaw || (await optionalRead(outputPath)) !== output) {
      summary.waiting.push({ slug, reason: "concurrent_change" });
      continue;
    }
    await atomicWrite(outputPath, serialized);
    state.entries[slug] = {
      status: "ready",
      inputHash,
      attemptCount: counted,
      sourceHash,
      outputHash: contentHash(serialized),
      model,
      promptVersion: PROMPT_VERSION,
      generatedAt
    };
    // Checkpoint after each successful article. An interruption may leave an
    // untracked generated file, which is treated as manual rather than overwritten.
    await atomicWrite(join(root, stateRelativePath), `${JSON.stringify(state, null, 2)}\n`);
    summary.generated.push(slug);
  }
  if (writing) await checkpoint();
  await atomicWrite(join(root, "reports/blog-translation-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

export function parseArguments(args) {
  const [mode = "plan", ...rest] = args;
  const options = { mode };
  for (let index = 0; index < rest.length; index += 2) {
    const value = rest[index + 1];
    assert.ok(value, "CLI option requires a value");
    if (rest[index] === "--slugs") options.slugs = value.split(",").map((slug) => slug.trim());
    else if (rest[index] === "--max-articles") options.maxArticles = Number(value);
    else throw new Error("Unknown translation option");
  }
  return options;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const summary = await runTranslations({
      ...parseArguments(process.argv.slice(2)),
      model: process.env.GEMINI_TRANSLATION_MODEL || TRANSLATION_MODEL
    });
    if (process.env.GITHUB_STEP_SUMMARY) {
      await writeFile(
        process.env.GITHUB_STEP_SUMMARY,
        `## Blog translation\n\nGenerated: ${summary.generated.length}; unchanged: ${summary.unchanged.length}; reserved: ${summary.reserved.length}; waiting: ${summary.waiting.length}; stopped: ${summary.failed.length}.\n\n` +
          [...summary.waiting, ...summary.failed]
            .map(
              (item) =>
                `- ${item.slug}: ${item.reason}${item.attemptCount ? ` (${item.attemptCount}/${MAX_ATTEMPTS} attempts)` : ""}${item.nextAttemptAt ? `; next eligible ${item.nextAttemptAt}` : ""}`
            )
            .join("\n") +
          "\n",
        { flag: "a" }
      );
    }
    for (const item of summary.failed)
      console.log(
        `::warning::Translation stopped for ${item.slug}: ${item.reason}. Review the saved state before retrying.`
      );
    console.log(
      `Blog translation ${summary.mode}: ${summary.generated.length} generated, ${summary.unchanged.length} unchanged, ${summary.manual.length} manual, ${summary.waiting.length} waiting, ${summary.failed.length} rejected.`
    );
  } catch {
    console.error(
      "Blog translation stopped: check reviewed options, explicit API/free-tier configuration, and local file state. No provider error bodies are logged."
    );
    process.exitCode = 1;
  }
}
