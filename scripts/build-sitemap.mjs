import { readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
const siteOrigin = (process.env.PORTFOLIO_SITE_ORIGIN ?? "https://portfolio.pages.dev").replace(/\/+$/, "");

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function collectIndexFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const next = join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== "assets") {
        return collectIndexFiles(next);
      }
      return entry.isFile() && entry.name === "index.html" ? [next] : [];
    })
  );
  return files.flat();
}

function routeForIndexFile(file) {
  const routeDir = relative(dist, file.replace(/index\.html$/, "")).replaceAll("\\", "/");
  return routeDir ? `/${routeDir}` : "/";
}

const routes = (await collectIndexFiles(dist)).map(routeForIndexFile).sort((a, b) => {
  if (a === "/") return -1;
  if (b === "/") return 1;
  return a.localeCompare(b);
});

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map((route) => `  <url><loc>${escapeXml(`${siteOrigin}${route}`)}</loc></url>`),
  "</urlset>",
  ""
].join("\n");

await writeFile(join(dist, "sitemap.xml"), xml, "utf8");

console.log(`[sitemap] dist/sitemap.xml (${routes.length} urls)`);
