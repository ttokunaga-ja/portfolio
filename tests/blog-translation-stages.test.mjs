import assert from "node:assert/strict";
import test from "node:test";
import { readFile, mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseFrontmatter } from "../scripts/frontmatter.mjs";
import {
  createTranslationInput,
  PILOT_SLUGS,
  TRANSLATION_MODEL,
  translationStageRequest,
  assembleBodyStage,
  restoreAndValidate,
  translationValidationCode
} from "../scripts/blog-translation-core.mjs";
import { createGeminiTranslator, runTranslations } from "../scripts/translate-blog.mjs";

const consent = { BLOG_TRANSLATION_ALLOW_API: "1", BLOG_TRANSLATION_FREE_TIER_CONFIRMED: "1" };
const english = (text) => text.replace(/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/gu, "x");
const response = (candidate) =>
  new Response(
    JSON.stringify({
      status: "completed",
      steps: [{ type: "model_output", content: [{ type: "text", text: JSON.stringify(candidate) }] }]
    })
  );
const mirror = (options) => {
  const payload = JSON.parse(JSON.parse(options.body).input);
  const field = Object.keys(payload).find((key) => key.endsWith("Segments"));
  return { [field]: payload[field].map(({ text }) => english(text)) };
};

test("real pilot translations retain source-owned Markdown skeleton, hard breaks and code", async () => {
  for (const slug of PILOT_SLUGS) {
    const { data, content } = parseFrontmatter(
      await readFile(new URL(`../content/ja/blog/${slug}.md`, import.meta.url), "utf8")
    );
    const input = createTranslationInput({ ...data, body: content });
    let calls = 0;
    const translator = createGeminiTranslator({
      apiKey: "test-stages",
      fetchImpl: async (_, options) => {
        calls++;
        const request = JSON.parse(options.body);
        assert.ok(!Object.keys(JSON.parse(request.input)).some((key) => /abstract|tags/i.test(key)));
        return response(mirror(options));
      }
    });
    const result = await translator(input, TRANSLATION_MODEL);
    assert.equal(calls, 2);
    assert.deepEqual(result.body.match(/  \r?\n/g), content.match(/  \r?\n/g));
    assert.deepEqual(result.body.match(/^\s*\d+[.)] /gm), content.match(/^\s*\d+[.)] /gm));
    for (const item of input.replacements)
      assert.equal(result.body.split(item.value).length, content.split(item.value).length);
    assert.ok(result.abstract.length <= 180);
  }
});

test("source syntax cannot be supplied by a body slot; sanitized structure diagnostics identify a token path", () => {
  const input = createTranslationInput({
    title: "Title",
    abstract: "Summary",
    body: "## 題名\n\n1. 本文  \n   続き\n\n![画像](https://example.com/a.png)\n"
  });
  const payload = JSON.parse(translationStageRequest(input, "body").input);
  const slots = payload.bodySegments.map(({ text }) => english(text));
  for (const injected of ["# Heading", "https://evil.example", "[link]", "line\nnext", "ZXQLOCK00000QXZ", "99"]) {
    assert.throws(() =>
      assembleBodyStage(input, { bodySegments: slots.map((text, index) => (index === 0 ? injected : text)) })
    );
  }
  const malformed = { title: "Title", abstract: "Summary", body: input.body.replace("## ", "") };
  assert.throws(
    () => restoreAndValidate(input, malformed),
    (error) => {
      assert.equal(translationValidationCode(error), "markdown_structure");
      assert.match(error.structureDiagnostics.path, /^tokens\./);
      assert.equal(error.structureDiagnostics.tokenKind, "heading");
      assert.ok(!JSON.stringify(error.structureDiagnostics).includes("Changed"));
      return true;
    }
  );
});

test("invalid title stops before body; API failure and timeout have no inline retry", async () => {
  const input = createTranslationInput({ title: "題名", abstract: "概要", body: "本文。" });
  for (const kind of ["title", "failure", "timeout"]) {
    let calls = 0;
    const translator = createGeminiTranslator({
      apiKey: "test-stages",
      fetchImpl: async () => {
        calls++;
        if (kind === "failure") return new Response("private provider output", { status: 503 });
        if (kind === "timeout") throw new DOMException("private timeout", "TimeoutError");
        return response({ titleSegments: ["題名"] });
      }
    });
    await assert.rejects(translator(input, TRANSLATION_MODEL));
    assert.equal(calls, 1);
  }
});

test("five logical pairs consume at most ten HTTP requests, including failed body requests", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "translation-pairs-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "content/ja/blog"), { recursive: true });
  await writeFile(
    join(root, `content/ja/blog/${PILOT_SLUGS[0]}.md`),
    `---\ntitle: "題名"\nabstract: "概要"\npublishedAt: "2025-12-25"\ncanonicalUrl: "https://zenn.dev/t_tokunaga/articles/${PILOT_SLUGS[0]}"\n---\n\n本文。\n`
  );
  let calls = 0;
  const translator = createGeminiTranslator({
    apiKey: "test-stages",
    fetchImpl: async (_, options) => {
      calls++;
      return calls % 2 ? response(mirror(options)) : new Response("private", { status: 503 });
    }
  });
  for (let attempt = 0; attempt < 6; attempt++) {
    await runTranslations({
      root,
      mode: "run",
      slugs: [PILOT_SLUGS[0]],
      maxArticles: 1,
      translate: translator,
      env: consent,
      now: () => new Date(Date.UTC(2026, 0, 1 + attempt)).toISOString(),
      random: () => 0
    });
  }
  assert.equal(calls, 10);
  const state = JSON.parse(await readFile(join(root, "translations/blog-en-state.json"), "utf8"));
  assert.equal(state.entries[PILOT_SLUGS[0]].attemptCount, 5);
  assert.equal(state.entries[PILOT_SLUGS[0]].requestAllowance, 2);
  assert.ok(!JSON.stringify(state).includes("private"));
});

test("a source without abstract translates in two requests and serializes only title and provenance", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "translation-no-abstract-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "content/ja/blog"), { recursive: true });
  const source = `---\ntitle: "題名"\ncanonicalUrl: "https://zenn.dev/t_tokunaga/articles/${PILOT_SLUGS[0]}"\n---\n\n本文。  \n`;
  await writeFile(join(root, `content/ja/blog/${PILOT_SLUGS[0]}.md`), source);
  const plan = await runTranslations({ root, mode: "plan", slugs: [PILOT_SLUGS[0]] });
  assert.deepEqual(plan.pending, [PILOT_SLUGS[0]]);
  let calls = 0;
  const translator = createGeminiTranslator({
    apiKey: "test-stages",
    fetchImpl: async (_, options) => {
      calls++;
      return response(mirror(options));
    }
  });
  const result = await runTranslations({
    root,
    mode: "run",
    slugs: [PILOT_SLUGS[0]],
    env: consent,
    translate: translator
  });
  assert.deepEqual(result.generated, [PILOT_SLUGS[0]]);
  assert.equal(calls, 2);
  const output = await readFile(join(root, `content/en/blog/${PILOT_SLUGS[0]}.md`), "utf8");
  assert.ok(!/^abstract:|^tags:/m.test(output));
  assert.ok(output.endsWith("xx。  \n"));
});
