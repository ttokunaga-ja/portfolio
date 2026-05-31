import { readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
const siteOrigin = (process.env.PORTFOLIO_SITE_ORIGIN ?? "https://takumi-tokunaga.com").replace(/\/+$/, "");

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
  // Keep the trailing slash so sitemap URLs match the canonical links exactly.
  return routeDir ? `/${routeDir}/` : "/";
}

function enCounterpart(jaRoute) {
  return jaRoute === "/" ? "/en/" : `/en${jaRoute}`;
}

const allRoutes = (await collectIndexFiles(dist)).map(routeForIndexFile);
// Each prerendered page exists in both locales; build the sitemap from the
// Japanese (default) routes and attach the English alternate to each pair.
const baseRoutes = allRoutes
  .filter((route) => route !== "/en" && !route.startsWith("/en/"))
  .sort((a, b) => {
    if (a === "/") return -1;
    if (b === "/") return 1;
    return a.localeCompare(b);
  });

function urlEntry(loc, jaRoute) {
  const jaUrl = `${siteOrigin}${jaRoute}`;
  const enUrl = `${siteOrigin}${enCounterpart(jaRoute)}`;
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <xhtml:link rel="alternate" hreflang="ja" href="${escapeXml(jaUrl)}" />`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(enUrl)}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(jaUrl)}" />`,
    "  </url>"
  ].join("\n");
}

const urls = baseRoutes.flatMap((jaRoute) => [
  urlEntry(`${siteOrigin}${jaRoute}`, jaRoute),
  urlEntry(`${siteOrigin}${enCounterpart(jaRoute)}`, jaRoute)
]);

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...urls,
  "</urlset>",
  ""
].join("\n");

await writeFile(join(dist, "sitemap.xml"), xml, "utf8");

console.log(`[sitemap] dist/sitemap.xml (${urls.length} urls)`);
