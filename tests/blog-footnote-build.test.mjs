import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import sharp from "sharp";

const build = fileURLToPath(new URL("../scripts/build-content.mjs", import.meta.url));

test("content build finds images inside footnotes and renders their dimensions", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "portfolio-footnote-build-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "content/ja/blog"), { recursive: true });
  await mkdir(join(root, "public/images/blog/footnote"), { recursive: true });
  await sharp({ create: { width: 12, height: 8, channels: 3, background: "white" } })
    .png()
    .toFile(join(root, "public/images/blog/footnote/evidence.png"));
  await writeFile(
    join(root, "content/ja/blog/footnote.md"),
    '---\ntitle: "Footnote"\n---\n\nMain prose[^proof].\n\n[^proof]: ![Evidence](evidence.png)\n'
  );
  await promisify(execFile)(process.execPath, [build], { cwd: root });
  const html = await readFile(join(root, "src/generated/content-details/ja/blog/footnote.ts"), "utf8");
  assert.match(html, /width=\\"12\\" height=\\"8\\"/);
  assert.match(html, /data-footnote-backref/);
});
