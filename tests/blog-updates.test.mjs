import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

test("blog smoke check rejects missing listing links and wrong pages even with HTTP 200", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "blog-smoke-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "scripts"));
  await mkdir(join(root, "content/ja/blog"), { recursive: true });
  for (const file of ["check-blog-updates.mjs", "frontmatter.mjs"]) {
    await cp(new URL(`../scripts/${file}`, import.meta.url), join(root, "scripts", file));
  }
  await writeFile(
    join(root, "content/ja/blog/2026-09-30-example.md"),
    '---\ncanonicalUrl: "https://zenn.dev/user/articles/example"\n---\nBody'
  );
  let listing = '<a href="/blog/2026-09-30-example/">Article</a>';
  let detail = '<link rel="canonical" href="https://zenn.dev/user/articles/example">';
  const server = createServer((req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.end(req.url === "/blog/" ? listing : detail);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const run = () =>
    promisify(execFile)(process.execPath, ["scripts/check-blog-updates.mjs", "--origin", origin], { cwd: root });
  assert.match((await run()).stdout, /1 articles verified/);
  listing = "<p>Old blog listing</p>";
  await assert.rejects(run(), (error) => error.code === 1 && /listing is missing/.test(error.stderr));
  listing = '<a href="/blog/2026-09-30-example/">Article</a>';
  detail = '<title>404</title><link rel="canonical" href="https://example.com/404/">';
  await assert.rejects(run(), (error) => error.code === 1 && /Wrong blog page/.test(error.stderr));
});
