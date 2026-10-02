import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import react from "@vitejs/plugin-react";
import { build } from "vite";
import {
  getBlogTranslationEligibility,
  hashTranslationSource,
  isManagedBlogTranslation,
  isPublicBlogTranslationSource
} from "../scripts/blog-translation-eligibility.mjs";

const repo = fileURLToPath(new URL("..", import.meta.url));
const origin = "https://portfolio.example";
const run = promisify(execFile);
const originalUrl = "https://zenn.dev/t_tokunaga/articles/valid";

function article(data, body = "## Abstract\n\nArticle body.") {
  const fields = { title: "Article", abstract: "Article abstract.", ...data };
  return `---\n${Object.entries(fields)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n")}\n---\n\n${body}\n`;
}

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "portfolio-translation-publication-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const contentDir = join(root, "content");
  await mkdir(join(contentDir, "ja/blog"), { recursive: true });
  await mkdir(join(contentDir, "en/blog"), { recursive: true });
  await mkdir(join(root, "dist"), { recursive: true });
  return { root, contentDir };
}

test("translation marker is explicit and source hashes use exact UTF-8 bytes", async (t) => {
  const { contentDir } = await fixture(t);
  const source = `\uFEFF${article({ canonicalUrl: "https://zenn.dev/t_tokunaga/articles/exact" }, "日本語").replaceAll("\n", "\r\n")}`;
  await writeFile(join(contentDir, "ja/blog/exact.md"), source);
  const context = { contentDir, locale: "en", collection: "blog", slug: "exact" };
  const data = { translationSourceHash: hashTranslationSource(source) };
  assert.equal(isManagedBlogTranslation({ ...context, data }), true);
  assert.equal(isManagedBlogTranslation({ ...context, data: { sourceUrl: originalUrl } }), false);
  assert.equal(isManagedBlogTranslation({ ...context, locale: "ja", data }), false);
  assert.equal(isManagedBlogTranslation({ ...context, collection: "research", data }), false);
  assert.equal((await getBlogTranslationEligibility({ ...context, data })).eligible, true);
  assert.equal(
    (
      await getBlogTranslationEligibility({
        ...context,
        data: { translationSourceHash: hashTranslationSource(source.replace(/^\uFEFF/, "").replaceAll("\r\n", "\n")) }
      })
    ).reason,
    "source-hash-mismatch"
  );
  assert.equal(
    (await getBlogTranslationEligibility({ ...context, data: { translationSourceHash: "" } })).reason,
    "source-hash-invalid"
  );
  await rm(join(contentDir, "ja/blog/exact.md"));
  assert.equal((await getBlogTranslationEligibility({ ...context, data })).reason, "source-missing");
  assert.equal((await getBlogTranslationEligibility({ ...context, data: { sourceUrl: originalUrl } })).eligible, true);
});

test("matching source hashes cannot publish draft, unpublished, or unapproved sources", async (t) => {
  const { root, contentDir } = await fixture(t);
  const canonicalUrl = "https://zenn.dev/t_tokunaga/articles/current";
  assert.equal(isPublicBlogTranslationSource({ canonicalUrl }, "current"), true);
  assert.equal(isPublicBlogTranslationSource({ canonicalUrl, published: true, draft: false }, "current"), true);
  for (const [slug, metadata] of [
    ["draft", { draft: true }],
    ["unpublished", { published: false }],
    ["wrong-canonical", { canonicalUrl: "https://zenn.dev/another-author/articles/wrong-canonical" }],
    ["wrong-slug", { canonicalUrl }],
    ["missing-canonical", { canonicalUrl: "" }]
  ]) {
    const sourceData = { canonicalUrl: `https://zenn.dev/t_tokunaga/articles/${slug}`, ...metadata };
    assert.equal(isPublicBlogTranslationSource(sourceData, slug), false);
    const source = article(sourceData);
    const data = { translationSourceHash: hashTranslationSource(source) };
    await writeFile(join(contentDir, `ja/blog/${slug}.md`), source);
    await writeFile(join(contentDir, `en/blog/${slug}.md`), article(data, "<div>Must not be processed</div>"));
    assert.deepEqual(
      await getBlogTranslationEligibility({ contentDir, locale: "en", collection: "blog", slug, data }),
      { managed: true, eligible: false, reason: "source-not-public" }
    );
  }
  for (const script of ["build-content.mjs", "build-ai-search.mjs"]) {
    const result = await run(process.execPath, [join(repo, "scripts", script)], { cwd: root });
    assert.match(result.stderr, /source-not-public/);
  }
  const generated = await readFile(join(root, "src/generated/content.generated.ts"), "utf8");
  const llms = await readFile(join(root, "dist/llms.txt"), "utf8");
  for (const slug of ["draft", "unpublished", "wrong-canonical", "wrong-slug", "missing-canonical"]) {
    assert.ok(!generated.includes(`"en/blog/${slug}":`));
    assert.ok(!llms.includes(`/en/blog/${slug}.md`));
    await assert.rejects(readFile(join(root, `dist/en/blog/${slug}.md`)), { code: "ENOENT" });
  }
});

test("an entirely excluded translation set still produces an empty build", async (t) => {
  const { root, contentDir } = await fixture(t);
  await writeFile(
    join(contentDir, "en/blog/orphan.md"),
    article({ translationSourceHash: hashTranslationSource("Removed original") }, "![removed](removed.png)")
  );
  for (const script of ["build-content.mjs", "build-ai-search.mjs"]) {
    await run(process.execPath, [join(repo, "scripts", script)], { cwd: root });
  }
  const generated = await readFile(join(root, "src/generated/content.generated.ts"), "utf8");
  assert.ok(generated.includes("export const entries: PortfolioEntry[] = [];"));
  assert.ok(!(await readFile(join(root, "dist/llms.txt"), "utf8")).includes("/en/blog/orphan.md"));
});

test("HTML and AI-search share source-aware eligibility, provenance, and canonical policy", async (t) => {
  const { root, contentDir } = await fixture(t);
  const source = article({ title: "Japanese original", canonicalUrl: originalUrl });
  const staleSource = article({
    title: "Updated original",
    canonicalUrl: "https://zenn.dev/t_tokunaga/articles/stale"
  });
  const imageSource = article({
    title: "Image source",
    canonicalUrl: "https://zenn.dev/t_tokunaga/articles/missing-image"
  });
  await writeFile(join(contentDir, "ja/blog/valid.md"), source);
  await writeFile(join(contentDir, "ja/blog/stale.md"), staleSource);
  await writeFile(join(contentDir, "ja/blog/missing-image.md"), imageSource);
  const managed = {
    sourceUrl: originalUrl,
    translationSourceHash: hashTranslationSource(source),
    translationModel: "test-model",
    translationPromptVersion: "test-v1",
    translationGeneratedAt: "2026-10-02T00:00:00.000Z"
  };
  await writeFile(
    join(contentDir, "en/blog/valid.md"),
    article({ ...managed, title: "Valid translation", canonicalUrl: originalUrl })
  );
  // Invalid bodies and unavailable assets must never be inspected for excluded
  // translations, since source deletion is itself enough to unpublish them.
  await writeFile(
    join(contentDir, "en/blog/orphan.md"),
    article({ ...managed, title: "Removed information" }, "<div>Removed</div>\n\n![deleted](deleted.png)")
  );
  await writeFile(
    join(contentDir, "en/blog/stale.md"),
    article({ ...managed, title: "Stale information" }, "<div>Stale</div>\n\n![deleted](deleted.png)")
  );
  await writeFile(
    join(contentDir, "en/blog/missing-image.md"),
    article(
      { ...managed, title: "Missing image translation", translationSourceHash: hashTranslationSource(imageSource) },
      "| Figure |\n| --- |\n| ![removed](removed.png) |"
    )
  );
  await writeFile(
    join(contentDir, "en/blog/manual.md"),
    article({ title: "Manual English article", sourceUrl: originalUrl, translationModel: "metadata-without-marker" })
  );

  await cp(join(repo, "src"), join(root, "src"), {
    recursive: true,
    filter: (path) => !path.startsWith(join(repo, "src/generated"))
  });
  await symlink(join(repo, "node_modules"), join(root, "node_modules"), "dir");
  const buildContent = () => run(process.execPath, [join(repo, "scripts/build-content.mjs")], { cwd: root });
  const buildAi = () =>
    run(process.execPath, [join(repo, "scripts/build-ai-search.mjs")], {
      cwd: root,
      env: { ...process.env, PORTFOLIO_SITE_ORIGIN: origin }
    });
  const contentResult = await buildContent();
  const aiResult = await buildAi();
  for (const reason of ["source-missing", "source-hash-mismatch", "image-missing"]) {
    assert.match(contentResult.stderr, new RegExp(reason));
    assert.match(aiResult.stderr, new RegExp(reason));
  }
  const generated = await readFile(join(root, "src/generated/content.generated.ts"), "utf8");
  const llms = await readFile(join(root, "dist/llms.txt"), "utf8");
  for (const slug of ["orphan", "stale", "missing-image"]) {
    assert.ok(!generated.includes(`"en/blog/${slug}":`));
    assert.ok(!llms.includes(`/en/blog/${slug}.md`));
    await assert.rejects(readFile(join(root, `dist/en/blog/${slug}.md`)), { code: "ENOENT" });
  }
  assert.ok(generated.includes('"en/blog/valid":'));
  assert.ok(generated.includes('"en/blog/manual":'));
  const markdown = await readFile(join(root, "dist/en/blog/valid.md"), "utf8");
  assert.ok(markdown.includes(`- Canonical: ${origin}/en/blog/valid/`));
  assert.ok(markdown.includes(`- Original source: ${originalUrl}`));
  assert.ok(markdown.includes("AI-generated English translation"));
  assert.ok(markdown.includes(`Translation source SHA-256: ${managed.translationSourceHash}`));
  const headers = await readFile(join(root, "dist/_headers"), "utf8");
  assert.ok(headers.includes(`Link: <${origin}/en/blog/valid/>; rel="canonical"`));
  assert.ok(headers.includes(`Link: <${originalUrl}>; rel="canonical"`));

  await writeFile(join(root, "package.json"), '{"type":"module"}\n');
  await build({
    root,
    configFile: false,
    plugins: [react()],
    logLevel: "error",
    cacheDir: join(root, ".vite"),
    ssr: { noExternal: ["@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled"] },
    build: {
      ssr: join(root, "src/entry-server.tsx"),
      outDir: join(root, "dist/server"),
      emptyOutDir: true,
      rollupOptions: { output: { format: "es" } }
    }
  });
  const { render, getAlternateLocales, getStaticPathsForPrerender, getJsonLd } = await import(
    pathToFileURL(join(root, "dist/server/entry-server.js"))
  );
  const english = await render("/en/blog/valid/");
  const japanese = await render("/blog/valid/");
  assert.equal(english.seo.canonicalUrl, undefined, "prerender uses the English page's own URL");
  assert.equal(japanese.seo.canonicalUrl, originalUrl);
  assert.ok(english.html.includes("This English translation was generated with AI"));
  assert.ok(english.html.includes(`href="${originalUrl}"`));
  assert.ok(english.html.includes("Read the Japanese original"));
  assert.ok(!japanese.html.includes("This English translation was generated with AI"));
  assert.deepEqual(getAlternateLocales(english.route, "en"), []);
  assert.deepEqual(getAlternateLocales(japanese.route, "ja"), []);
  const creativeWork = getJsonLd(english.route, "en", origin)["@graph"].find(
    (node) => node["@type"] === "CreativeWork"
  );
  assert.equal(creativeWork.url, `${origin}/en/blog/valid/`);
  assert.equal(creativeWork.translationOfWork.url, originalUrl);
  const paths = getStaticPathsForPrerender().map(({ path }) => path);
  assert.ok(paths.includes("/en/blog/valid/"));
  assert.ok(!paths.includes("/en/blog/orphan/"));
  const listing = await render("/en/blog/");
  assert.ok(listing.html.includes("AI translation"));
  assert.ok(listing.html.includes("temporarily unavailable"));
  assert.ok(listing.html.includes("Manual English article"));
  assert.ok(!listing.html.includes("Removed information"));
  assert.equal((await render("/en/blog/stale/")).route.kind, "notFound");
  for (const section of ["", "about", "research", "projects", "experience", "blog", "skills", "contact", "privacy"]) {
    await mkdir(join(root, "dist", section), { recursive: true });
    await writeFile(
      join(root, "dist", section, "index.html"),
      '<!doctype html><html lang="ja"><head>\n<title>Portfolio</title>\n</head><body><div id="root"></div></body></html>'
    );
  }
  await run(process.execPath, [join(repo, "scripts/prerender.mjs")], {
    cwd: root,
    env: { ...process.env, PORTFOLIO_SITE_ORIGIN: origin }
  });
  const englishHtml = await readFile(join(root, "dist/en/blog/valid/index.html"), "utf8");
  assert.ok(englishHtml.includes(`<link rel="canonical" href="${origin}/en/blog/valid/"`));
  assert.ok(englishHtml.includes("This English translation was generated with AI"));
  assert.ok(!englishHtml.includes("hreflang="));
  const japaneseHtml = await readFile(join(root, "dist/blog/valid/index.html"), "utf8");
  assert.ok(japaneseHtml.includes(`<link rel="canonical" href="${originalUrl}"`));
  assert.ok(!japaneseHtml.includes("hreflang="));
  await assert.rejects(readFile(join(root, "dist/en/blog/orphan/index.html")), { code: "ENOENT" });

  // Repeated standalone builds must also remove a previously published output.
  await writeFile(join(contentDir, "ja/blog/valid.md"), `${source}\nSource correction.\n`);
  await buildContent();
  await buildAi();
  await assert.rejects(readFile(join(root, "dist/en/blog/valid.md")), { code: "ENOENT" });
  await assert.rejects(readFile(join(root, "src/generated/content-details/en/blog/valid.ts")), { code: "ENOENT" });
  assert.ok(!(await readFile(join(root, "dist/llms.txt"), "utf8")).includes("/en/blog/valid.md"));
});
