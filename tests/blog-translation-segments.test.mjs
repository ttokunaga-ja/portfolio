import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { parseFrontmatter } from "../scripts/frontmatter.mjs";
import { createTranslationInput, PILOT_SLUGS } from "../scripts/blog-translation-core.mjs";
import { splitTranslationBody, assembleTranslationBody } from "../scripts/blog-translation-segments.mjs";

test("real pilot code, links and repeated names are assembled byte-exactly without model markers", () => {
  for (const slug of PILOT_SLUGS) {
    const { data, content } = parseFrontmatter(
      fs.readFileSync(new URL(`../content/ja/blog/${slug}.md`, import.meta.url), "utf8")
    );
    const input = createTranslationInput({ ...data, body: content });
    const { segments } = splitTranslationBody(input.body);
    assert.ok(segments.every((segment) => !/ZXQLOCK\d+QXZ/.test(segment)));
    assert.equal(assembleTranslationBody(input.body, segments), input.body);
    const translated = segments.map((segment) =>
      segment.replace(/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/gu, "x")
    );
    const result = assembleTranslationBody(input.body, translated);
    for (const item of input.replacements) assert.equal(result.split(item.marker).length - 1, item.count);
  }
});

test("segment protocol rejects missing, extra, invalid or injected segments", () => {
  const body = "A ZXQLOCK00000QXZ B ZXQLOCK00000QXZ C";
  for (const candidate of [
    null,
    [],
    ["A ", " B "],
    ["A ", " B ", " C", "extra"],
    ["A ", 7, " C"],
    ["A ", "ZXQLOCK00000QXZ", " C"]
  ]) {
    assert.throws(() => assembleTranslationBody(body, candidate));
  }
  assert.equal(
    assembleTranslationBody(body, ["English ", " middle ", " end"]),
    "English ZXQLOCK00000QXZ middle ZXQLOCK00000QXZ end"
  );
  assert.throws(() => assembleTranslationBody("ZXQLOCK00000QXZ", ["added", ""]));
});

test("actual pilot title, abstract and body contracts round-trip without modifying numbers or names", async () => {
  const { translationRequest, reassembleTranslationSegments } = await import("../scripts/blog-translation-core.mjs");
  for (const slug of PILOT_SLUGS) {
    const { data, content } = parseFrontmatter(
      fs.readFileSync(new URL(`../content/ja/blog/${slug}.md`, import.meta.url), "utf8")
    );
    const input = createTranslationInput({ ...data, body: content });
    const before = JSON.stringify(input);
    const request = translationRequest(input);
    const payload = JSON.parse(request.input);
    const candidate = {
      titleSegments: payload.titleSegments.map((x) => x.text),
      abstractSegments: payload.abstractSegments.map((x) => x.text),
      bodySegments: payload.segments.map((x) => x.text)
    };
    assert.deepEqual(reassembleTranslationSegments(input, candidate), {
      title: input.title,
      abstract: input.abstract,
      body: input.body
    });
    for (const [field, segments] of Object.entries(candidate)) {
      assert.ok(
        segments.every((x) => !/[0-9]/.test(x)),
        `${field} exposes numeric literals to model rewriting`
      );
      assert.equal(request.response_format.schema.properties[field].minItems, segments.length);
      assert.equal(request.response_format.schema.properties[field].maxItems, segments.length);
    }
    const numeric = (text) => (text.replace(/ZXQLOCK\d{5}QXZ/g, "").match(/[+-]?\d+(?:[.,]\d+)*%?/g) ?? []).sort();
    const standin = Object.fromEntries(
      Object.entries(candidate).map(([key, parts]) => [
        key,
        parts.map((x) => x.replace(/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/gu, "x"))
      ])
    );
    const assembled = reassembleTranslationSegments(input, standin);
    for (const field of ["title", "abstract", "body"])
      assert.deepEqual(numeric(assembled[field]), numeric(input[field]));
    for (const name of ["VS Code", "Debezium"])
      for (const field of ["title", "abstract"])
        assert.equal(assembled[field].split(name).length, input[field].split(name).length);
    assert.equal(JSON.stringify(input), before);
  }
});

test("metadata protocol preserves exact 6 rather than requiring the model to rewrite a number word", async () => {
  const { translationRequest, restoreAndValidate } = await import("../scripts/blog-translation-core.mjs");
  const input = createTranslationInput({ title: "VS Code guide", abstract: "VS Code: 6 steps", body: "Use 6 steps." });
  const payload = JSON.parse(translationRequest(input).input);
  const candidate = {
    titleSegments: payload.titleSegments.map((x) => x.text),
    abstractSegments: payload.abstractSegments.map((x) => x.text),
    bodySegments: payload.segments.map((x) => x.text)
  };
  assert.equal(restoreAndValidate(input, candidate).abstract, "VS Code: 6 steps");
  const altered = {
    ...candidate,
    abstractSegments: candidate.abstractSegments.map((x) => x.replace("steps", "99 steps"))
  };
  assert.throws(() => restoreAndValidate(input, altered), /Numeric literals/);
});
