import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const buildScript = fileURLToPath(new URL("../scripts/build-sitemap.mjs", import.meta.url));
const origin = "https://portfolio.example";

async function buildFixture(t) {
  const root = await mkdtemp(join(tmpdir(), "portfolio-sitemap-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  const pages = [
    ["/", `${origin}/`],
    ["/en/", `${origin}/en/`],
    ["/research/bilingual/", `${origin}/research/bilingual/`],
    ["/en/research/bilingual/", `${origin}/en/research/bilingual/`],
    ["/research/japanese-only/", `${origin}/research/japanese-only/`],
    ["/en/projects/english-only/", `${origin}/en/projects/english-only/`],
    ["/blog/japanese-mirror/", "https://zenn.dev/example/articles/original"],
    ["/projects/old-alias/", `${origin}/projects/new-route/`],
    ["/without-canonical/", null]
  ];

  for (const [route, canonical] of pages) {
    const file = join(root, "dist", route, "index.html");
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, canonical ? `<link rel="canonical" href="${canonical}" />` : "<title>Unlisted</title>");
  }

  await promisify(execFile)(process.execPath, [buildScript], {
    cwd: root,
    env: { ...process.env, PORTFOLIO_SITE_ORIGIN: origin }
  });

  const xml = await readFile(join(root, "dist/sitemap.xml"), "utf8");
  const entries = new Map(
    [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) => [
      block.match(/<loc>([^<]+)<\/loc>/)?.[1],
      [...block.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map(([, locale, href]) => [locale, href])
    ])
  );
  return { entries, xml };
}

test("sitemap includes only existing self-canonical locale routes", async (t) => {
  const { entries } = await buildFixture(t);

  assert.deepEqual([...entries.keys()].sort(), [
    `${origin}/`,
    `${origin}/en/`,
    `${origin}/en/projects/english-only/`,
    `${origin}/en/research/bilingual/`,
    `${origin}/research/bilingual/`,
    `${origin}/research/japanese-only/`
  ]);

  for (const alternates of entries.values()) {
    for (const [, href] of alternates) {
      assert.ok(entries.has(href), `Alternate points to a missing or noncanonical route: ${href}`);
    }
  }
});

test("sitemap emits reciprocal alternates only for available translations", async (t) => {
  const { entries } = await buildFixture(t);
  const bilingualAlternates = [
    ["ja", `${origin}/research/bilingual/`],
    ["en", `${origin}/en/research/bilingual/`],
    ["x-default", `${origin}/research/bilingual/`]
  ];

  assert.deepEqual(entries.get(`${origin}/research/bilingual/`), bilingualAlternates);
  assert.deepEqual(entries.get(`${origin}/en/research/bilingual/`), bilingualAlternates);
  assert.deepEqual(entries.get(`${origin}/research/japanese-only/`), [
    ["ja", `${origin}/research/japanese-only/`],
    ["x-default", `${origin}/research/japanese-only/`]
  ]);
  assert.deepEqual(entries.get(`${origin}/en/projects/english-only/`), [["en", `${origin}/en/projects/english-only/`]]);
});

test("sitemap excludes mirrored blog posts without inventing their English URLs", async (t) => {
  const { xml } = await buildFixture(t);

  assert.ok(!xml.includes("/blog/japanese-mirror/"));
  assert.ok(!xml.includes("zenn.dev"));
  assert.ok(!xml.includes("/en/research/japanese-only/"));
  assert.ok(!xml.includes(`${origin}/projects/english-only/`));
});

test("self-canonical English blog translations are indexed without local hreflang", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "portfolio-translated-sitemap-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [route, canonical] of [
    ["/blog/translated/", "https://zenn.dev/example/articles/translated"],
    ["/en/blog/translated/", `${origin}/en/blog/translated/`],
    ["/blog/manual/", `${origin}/blog/manual/`],
    ["/en/blog/manual/", `${origin}/en/blog/manual/`]
  ]) {
    const file = join(root, "dist", route, "index.html");
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, `<link rel="canonical" href="${canonical}" />`);
  }
  await promisify(execFile)(process.execPath, [buildScript], {
    cwd: root,
    env: { ...process.env, PORTFOLIO_SITE_ORIGIN: origin }
  });
  const xml = await readFile(join(root, "dist/sitemap.xml"), "utf8");
  assert.ok(xml.includes(`<loc>${origin}/en/blog/translated/</loc>`));
  assert.ok(!xml.includes(`<loc>${origin}/blog/translated/</loc>`));
  assert.ok(xml.includes(`<loc>${origin}/blog/manual/</loc>`));
  assert.ok(xml.includes(`<loc>${origin}/en/blog/manual/</loc>`));
  assert.ok(!xml.includes("hreflang="));
});
