import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { createMarkdownParser } from "../scripts/markdown-parser.mjs";
import { assertSafeMarkdownTokens, isAllowedMarkdownHref } from "../scripts/markdown-security.mjs";
import { parseFrontmatter } from "../scripts/frontmatter.mjs";

const context = { normalized: "test.md" };
const lexer = (markdown) => createMarkdownParser().lexer(markdown);

async function listMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? listMarkdownFiles(path) : entry.name.endsWith(".md") ? [path] : [];
    })
  );
  return files.flat();
}

test("allows only safe Markdown href forms", () => {
  for (const href of ["https://example.com/path", "HTTP://example.com/", "#section", "#実装リポジトリ"]) {
    assert.equal(isAllowedMarkdownHref(href), true, href);
  }

  for (const href of [
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,unsafe",
    "DaTa:text/html,unsafe",
    " data:text/html,unsafe",
    "\u0000javascript:alert(1)",
    "\u0008https://example.com/",
    "vbscript:msgbox(1)",
    "//example.com/path",
    "https://user:password@example.com/",
    "/relative/path"
  ]) {
    assert.equal(isAllowedMarkdownHref(href), false, href);
  }
});

test("rejects raw HTML and unsafe links while retaining code spans and autolinks", () => {
  for (const markdown of ["[bad](javascript:alert(1))", "inline <span>unsafe</span>", "<div>unsafe</div>"]) {
    assert.throws(() => assertSafeMarkdownTokens(lexer(markdown), context), /unsafe|raw HTML/);
  }

  for (const markdown of ["`<span>literal</span>`", "<https://example.com>", "[fragment](#section)"]) {
    assert.doesNotThrow(() => assertSafeMarkdownTokens(lexer(markdown), context));
  }
});

test("checks links nested in table cells and block/list tokens", () => {
  for (const markdown of [
    "| Link |\n| --- |\n| [bad](javascript:alert(1)) |",
    "> - nested [bad](data:text/html,unsafe)"
  ]) {
    assert.throws(() => assertSafeMarkdownTokens(lexer(markdown), context), /unsafe Markdown link/);
  }

  assert.doesNotThrow(() =>
    assertSafeMarkdownTokens(
      lexer("> - nested [safe](https://example.com/)\n\n| Link |\n| --- |\n| [fragment](#section) |"),
      context
    )
  );
});

test("accepts referenced Zenn footnotes with prose definitions and renders backlinks", async () => {
  const path = join(process.cwd(), "content/ja/blog/2026-10-20-ai-support-accountability.md");
  const { content } = parseFrontmatter(await readFile(path, "utf8"));
  assert.doesNotThrow(() => assertSafeMarkdownTokens(createMarkdownParser("ja").lexer(content), { normalized: path }));
  const html = createMarkdownParser("ja").parse(content);
  assert.match(html, /id="footnote-ref-call"/);
  assert.match(html, /id="footnote-call"/);
  assert.match(html, /data-footnote-backref/);
  assert.match(html, /本文の参照に戻る/);
});

test("footnote labels cannot inject HTML attributes through the return link", () => {
  const label = 'x" onmouseover="alert(1)';
  const markdown = `Reference[^${label}].\n\n[^${label}]: Note`;
  assert.doesNotThrow(() => assertSafeMarkdownTokens(lexer(markdown), context));
  const html = createMarkdownParser().parse(markdown);
  assert.match(html, /data-footnote-backref/);
  assert.doesNotMatch(html, /onmouseover=/);
  assert.match(html, /aria-label="Back to reference"/);
});

test("rejects unsafe links and raw HTML inside footnote definitions", () => {
  for (const body of ["[bad](javascript:alert(1))", "<img src=x onerror=alert(1)>"]) {
    const markdown = `Reference[^note].\n\n[^note]: ${body}`;
    assert.throws(() => assertSafeMarkdownTokens(lexer(markdown), context), /unsafe|raw HTML/);
  }
});

test("all current Markdown content passes the same security policy", async () => {
  for (const file of await listMarkdownFiles(join(process.cwd(), "content"))) {
    const markdown = await readFile(file, "utf8");
    assert.doesNotThrow(() => assertSafeMarkdownTokens(lexer(markdown), { normalized: file }));
  }
});
