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

test("protected names are literal strings, never executable regex patterns", () => {
  for (const name of ["A+B", "Example (Tool)", "name.*", "a[1]"]) {
    const body = `Use ${name} and 6 steps.`;
    const result = splitTranslationBody(body, [name]);
    assert.equal(assembleTranslationBody(body, result.segments, [name]), body);
    assert.ok(result.parts.includes(name));
  }
  assert.throws(() => splitTranslationBody("text", [""]), /protected names/);
});

test("actual Git metadata distinguishes duplicated digits from changed numeric boundary punctuation", async () => {
  const { translationRequest, restoreAndValidate, translationNumericDiagnostics } =
    await import("../scripts/blog-translation-core.mjs");
  const { data, content } = parseFrontmatter(
    fs.readFileSync(new URL("../content/ja/blog/2025-12-25-git-branch-splitting.md", import.meta.url), "utf8")
  );
  const input = createTranslationInput({ ...data, body: content });
  const payload = JSON.parse(translationRequest(input).input);
  const candidate = {
    titleSegments: ["", "Minimal Steps to Safely Create a Branch from main"],
    abstractSegments: [
      "",
      "provides a quick way to create branches from main, with tips for avoiding mistakes. All images show operations using",
      "status bar. Procedure (",
      "steps) Always Pull first to update. Run Git: Pull from the Source Control view or Command Palette to align local main with the remote. When main appears at the bottom left"
    ],
    bodySegments: payload.segments.map(({ text }) =>
      text.replace(/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/gu, "x")
    )
  };
  assert.equal((restoreAndValidate(input, candidate).abstract.match(/[+-]?\d+(?:[.,]\d+)*%?/g) ?? []).join(","), "6");
  const duplicate = {
    ...candidate,
    abstractSegments: candidate.abstractSegments.map((x, i) => (i === 3 ? `6 ${x}` : x))
  };
  assert.throws(() => restoreAndValidate(input, duplicate), /Numeric literals in prose segment/);
  assert.equal(translationNumericDiagnostics(input, duplicate).abstract.returnedSegmentDigitCount, 1);
  const boundary = {
    ...candidate,
    abstractSegments: candidate.abstractSegments.map((x, i) => (i === 2 ? x.replace("(", "-") : x))
  };
  assert.throws(() => restoreAndValidate(input, boundary), /Numeric literals changed in translation: abstract/);
  assert.equal(translationNumericDiagnostics(input, boundary).abstract.returnedSegmentDigitCount, 0);
  assert.equal(translationNumericDiagnostics(input, boundary).abstract.expectedTokenCount, 1);
});

test("supported tuple schemas constrain literal fragments and describe only their own source", async () => {
  const { translationRequest } = await import("../scripts/blog-translation-core.mjs");
  const input = createTranslationInput({ title: "VS Code の入門", abstract: "6 ステップ", body: "## 手順\n\n1. 項目" });
  const request = translationRequest(input);
  const payload = JSON.parse(request.input);
  for (const [field, source] of [
    ["titleSegments", payload.titleSegments],
    ["abstractSegments", payload.abstractSegments],
    ["bodySegments", payload.segments]
  ]) {
    const schema = request.response_format.schema.properties[field];
    assert.equal(schema.prefixItems.length, source.length);
    assert.ok(!Object.hasOwn(schema.items, "pattern"));
    for (let i = 0; i < source.length; i++) {
      const slot = schema.prefixItems[i];
      if (slot.enum) assert.deepEqual(slot.enum, [source[i].text]);
      else assert.ok(slot.description.includes(JSON.stringify(source[i].text)));
    }
  }
});
