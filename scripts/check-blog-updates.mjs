import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parseFrontmatter } from "./frontmatter.mjs";

const root = process.cwd();
const originIndex = process.argv.indexOf("--origin");
const origin = originIndex < 0 ? null : process.argv[originIndex + 1];
if (originIndex >= 0 && !origin) throw new Error("--origin requires a URL");
const articlesDir = join(root, "content/ja/blog");
const files = (await readdir(articlesDir))
  .filter((file) => file.endsWith(".md"))
  .sort()
  .reverse();
assert.ok(files.length > 0, "No blog articles to verify");

async function htmlFor(route) {
  if (!origin) return readFile(join(root, "dist", route, "index.html"), "utf8");
  const response = await fetch(new URL(route, origin), { signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200, `Blog route ${route} returned ${response.status}`);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/, route);
  return response.text();
}

// Production verifies the newest article; local builds verify every mirrored article.
const selectedFiles = origin ? files.slice(0, 1) : files;
const listing = await htmlFor("/blog/");
for (const file of selectedFiles) {
  const slug = file.slice(0, -3);
  const route = `/blog/${slug}/`;
  const { data } = parseFrontmatter(await readFile(join(articlesDir, file), "utf8"));
  assert.ok(listing.includes(`href="${route}"`), `Blog listing is missing ${slug}`);
  const html = await htmlFor(route);
  const canonical = renderToStaticMarkup(createElement("link", { rel: "canonical", href: String(data.canonicalUrl) }));
  // The generated page may include whitespace before the tag's closing slash.
  assert.ok(html.includes(canonical.slice(0, -2)), `Wrong blog page for ${slug}`);
}
console.log(`Blog update check: ${selectedFiles.length} articles verified (${origin ?? "local dist"}).`);
