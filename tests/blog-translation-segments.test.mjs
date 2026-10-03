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
