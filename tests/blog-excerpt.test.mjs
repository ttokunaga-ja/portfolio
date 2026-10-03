import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { excerptFromMarkdown } from "../scripts/blog-excerpt.mjs";

const run = promisify(execFile);
const builder = fileURLToPath(new URL("../scripts/build-content.mjs", import.meta.url));

test("excerpt begins with prose and omits non-prose Markdown and directive markers", () => {
  const body = [
    "# Heading only",
    "",
    "![Image description](https://example.com/image.png)",
    "",
    "```js",
    'console.log("Code must not become the preview")',
    "```",
    "",
    "| Table |",
    "| --- |",
    "| Table value |",
    "",
    ":::message alert",
    "First **meaningful** paragraph with `inline code`.",
    ":::",
    "",
    "Another paragraph."
  ].join("\n");
  assert.equal(excerptFromMarkdown(body), "First meaningful paragraph with inline code. Another paragraph.");
  assert.equal(excerptFromMarkdown("# Only heading\n\n```\ncode\n```"), "");
});

test("excerpt keeps readable link labels and formatting text without URLs", () => {
  assert.equal(
    excerptFromMarkdown(
      "Read [the *guide*](https://example.com/guide) and ~~old~~ **new** docs.  \nA &amp; B, \\*literal\\*.\n\nhttps://example.com\n\n[https://example.com](https://example.com)"
    ),
    "Read the guide and old new docs. A & B, *literal*."
  );
  assert.equal(excerptFromMarkdown("Before ![ignored alt](image.png) after."), "Before after.");
});

test("excerpt skips raw HTML blocks and HTML-bearing paragraphs", () => {
  assert.equal(
    excerptFromMarkdown('<script>hostile payload</script>\n\nSafe text.\n\nInline <img onerror="bad()"> payload.'),
    "Safe text."
  );
  assert.equal(excerptFromMarkdown("<div>Untrusted HTML text</div>"), "");
});

test("excerpt follows nested prose in document order", () => {
  assert.equal(
    excerptFromMarkdown("> Quoted prose.\n\n- First item with `code`.\n- Second item."),
    "Quoted prose. First item with code. Second item."
  );
});

test("excerpt truncates by Unicode code point with an ellipsis within the limit", () => {
  assert.equal(excerptFromMarkdown("あ😀い😀う", 4), "あ😀い…");
  assert.equal(excerptFromMarkdown("あ😀い", 3), "あ😀い");
  assert.equal(excerptFromMarkdown("あ😀い", 1), "…");
  assert.equal(excerptFromMarkdown("あ😀い", 0), "");
  assert.equal(Array.from(excerptFromMarkdown("😀".repeat(181))).length, 180);
  assert.throws(() => excerptFromMarkdown("text", -1), RangeError);
});

function article(fields, body) {
  return `---\n${Object.entries(fields)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n")}\n---\n\n${body}\n`;
}

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "portfolio-blog-excerpt-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const collection of ["blog", "research", "projects", "experience"]) {
    await mkdir(join(root, "content/ja", collection), { recursive: true });
  }
  return root;
}

test("content builder derives blog previews, accepts no abstract, and leaves other collections curated", async (t) => {
  const root = await fixture(t);
  await writeFile(
    join(root, "content/ja/blog/legacy.md"),
    article({ title: "Legacy", abstract: "Obsolete summary", tags: "Legacy topic" }, "# Heading\n\nCurrent prose.")
  );
  await writeFile(join(root, "content/ja/blog/new.md"), article({ title: "New" }, "New prose."));
  await writeFile(join(root, "content/ja/blog/empty.md"), article({ title: "Title fallback" }, "# Heading only"));
  for (const collection of ["research", "projects", "experience"]) {
    await writeFile(
      join(root, `content/ja/${collection}/curated.md`),
      article({ title: collection, abstract: "Curated summary", tags: "Retained topic" }, "Body prose.")
    );
  }
  await run(process.execPath, [builder], { cwd: root });
  const generated = await readFile(join(root, "src/generated/content.generated.ts"), "utf8");
  const entries = JSON.parse(generated.match(/export const entries: PortfolioEntry\[\] = (\[[\s\S]*?\]);/)[1]);
  const blogs = entries.filter((entry) => entry.collection === "blog");
  assert.equal(blogs.find((entry) => entry.slug === "legacy").abstract, "Current prose.");
  assert.equal(blogs.find((entry) => entry.slug === "new").abstract, "New prose.");
  assert.equal(blogs.find((entry) => entry.slug === "empty").abstract, "Title fallback");
  for (const blog of blogs) assert.deepEqual(blog.tags, []);
  for (const entry of entries.filter((entry) => entry.collection !== "blog")) {
    assert.equal(entry.abstract, "Curated summary");
    assert.deepEqual(entry.tags, ["Retained topic"]);
  }
});

test("content builder still requires curated abstracts outside blog", async (t) => {
  for (const collection of ["research", "projects", "experience"]) {
    const root = await fixture(t);
    await writeFile(join(root, `content/ja/${collection}/missing.md`), article({ title: "Missing" }, "Body."));
    await assert.rejects(run(process.execPath, [builder], { cwd: root }), /missing frontmatter field: abstract/);
  }
});
