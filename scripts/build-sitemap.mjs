import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
const siteOrigin = (process.env.PORTFOLIO_SITE_ORIGIN ?? "https://takumi-tokunaga.com").replace(/\/+$/, "");

function escapeXml(value) {
  return value // nosemgrep: javascript.audit.detect-replaceall-sanitization.detect-replaceall-sanitization
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

function routeForLocale(baseRoute, locale) {
  return locale === "ja" ? baseRoute : baseRoute === "/" ? "/en/" : `/en${baseRoute}`;
}

async function isLocallyCanonical(file, route) {
  const html = await readFile(file, "utf8");
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/i)?.[1];
  return canonical === `${siteOrigin}${route}`;
}

const indexFiles = await collectIndexFiles(dist);
const allRoutes = new Set(
  (
    await Promise.all(
      indexFiles.map(async (file) => {
        const route = routeForIndexFile(file);
        return (await isLocallyCanonical(file, route)) ? route : null;
      })
    )
  ).filter(Boolean)
);
const baseRoutes = [...allRoutes]
  .map((route) => (route === "/en/" ? "/" : route.startsWith("/en/") ? route.slice(3) : route))
  .filter((route, index, routes) => routes.indexOf(route) === index)
  .sort((a, b) => {
    if (a === "/") return -1;
    if (b === "/") return 1;
    return a.localeCompare(b);
  });

function urlEntry(route, baseRoute) {
  const locales = ["ja", "en"].filter((locale) => allRoutes.has(routeForLocale(baseRoute, locale)));
  const alternates = locales.map((locale) => {
    const href = `${siteOrigin}${routeForLocale(baseRoute, locale)}`;
    return `    <xhtml:link rel="alternate" hreflang="${locale}" href="${escapeXml(href)}" />`;
  });
  if (locales.includes("ja")) {
    alternates.push(
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${siteOrigin}${baseRoute}`)}" />`
    );
  }
  return ["  <url>", `    <loc>${escapeXml(`${siteOrigin}${route}`)}</loc>`, ...alternates, "  </url>"].join("\n");
}

const urls = baseRoutes.flatMap((baseRoute) =>
  ["ja", "en"]
    .map((locale) => routeForLocale(baseRoute, locale))
    .filter((route) => allRoutes.has(route))
    .map((route) => urlEntry(route, baseRoute))
);

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...urls,
  "</urlset>",
  ""
].join("\n");

await writeFile(join(dist, "sitemap.xml"), xml, "utf8");

console.log(`[sitemap] dist/sitemap.xml (${urls.length} urls)`);
