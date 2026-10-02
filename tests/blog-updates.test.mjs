import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const checkScript = fileURLToPath(new URL("../scripts/check-blog-updates.mjs", import.meta.url));

test("blog smoke check rejects missing listing links and wrong pages even with HTTP 200", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "blog-smoke-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "content/ja/blog"), { recursive: true });
  await writeFile(
    join(root, "content/ja/blog/2026-09-30-example.md"),
    '---\ncanonicalUrl: "https://zenn.dev/user/articles/example?first=1&second=\\\"quoted\\\""\n---\nBody'
  );
  let listing = '<a href="/blog/2026-09-30-example/">Article</a>';
  let detail =
    '<link rel="canonical" href="https://zenn.dev/user/articles/example?first=1&amp;second=&quot;quoted&quot;">';
  const server = createServer((req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.end(req.url === "/blog/" ? listing : detail);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const run = () => promisify(execFile)(process.execPath, [checkScript, "--origin", origin], { cwd: root });
  assert.match((await run()).stdout, /1 articles verified/);
  detail = '<link rel="canonical" href="https://zenn.dev/user/articles/example?first=1&second="quoted"">';
  await assert.rejects(run(), (error) => error.code === 1 && /Wrong blog page/.test(error.stderr));
  detail = '<link rel="canonical" href="https://zenn.dev/user/articles/example?first=1&amp;second=&quot;quoted&quot;">';
  listing = "<p>Old blog listing</p>";
  await assert.rejects(run(), (error) => error.code === 1 && /listing is missing/.test(error.stderr));
  listing = '<a href="/blog/2026-09-30-example/">Article</a>';
  detail = '<title>404</title><link rel="canonical" href="https://example.com/404/">';
  await assert.rejects(run(), (error) => error.code === 1 && /Wrong blog page/.test(error.stderr));
});
