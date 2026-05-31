import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const dist = join(root, "dist");
const serverEntry = join(dist, "server/entry-server.js");
const siteOrigin = (process.env.PORTFOLIO_SITE_ORIGIN ?? "https://takumi-tokunaga.com").replace(/\/+$/, "");

const ogLocales = { ja: "ja_JP", en: "en_US" };

function escapeHtmlText(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeHtmlAttr(value) {
  return escapeHtmlText(value).replaceAll('"', "&quot;");
}

function shellPathFor(basePath) {
  const section = basePath.split("/").filter(Boolean)[0] ?? "";
  if (section && ["research", "projects", "experience", "skills", "contact"].includes(section)) {
    return join(dist, section, "index.html");
  }
  return join(dist, "index.html");
}

function outputPathFor(routePath) {
  if (routePath === "/") return join(dist, "index.html");
  return join(dist, routePath.replace(/^\//, ""), "index.html");
}

function canonicalFor(routePath) {
  return siteOrigin ? `${siteOrigin}${routePath}` : routePath;
}

function alternatesFor(basePath) {
  const enPath = `/en${basePath}`;
  return [
    { hreflang: "ja", href: canonicalFor(basePath) },
    { hreflang: "en", href: canonicalFor(enPath) },
    { hreflang: "x-default", href: canonicalFor(basePath) }
  ];
}

function upsertMetaByName(html, name, content) {
  const tag = `<meta name="${name}" content="${escapeHtmlAttr(content)}" />`;
  const pattern = new RegExp(`<meta\\s+name="${name}"\\s+content="[^"]*"\\s*/?>`, "i");
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  return html.replace(/\n\s*<\/head>/i, `\n    ${tag}\n  </head>`);
}

function upsertMetaByProperty(html, property, content) {
  const tag = `<meta property="${property}" content="${escapeHtmlAttr(content)}" />`;
  const pattern = new RegExp(`<meta\\s+property="${property}"\\s+content="[^"]*"\\s*/?>`, "i");
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  return html.replace(/\n\s*<\/head>/i, `\n    ${tag}\n  </head>`);
}

function upsertCanonical(html, routePath) {
  const tag = `<link rel="canonical" href="${escapeHtmlAttr(canonicalFor(routePath))}" />`;
  const pattern = /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i;
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  return html.replace(/\n\s*<\/head>/i, `\n    ${tag}\n  </head>`);
}

function upsertAlternates(html, basePath) {
  // Drop any previously-injected alternates, then add the current set.
  let next = html.replace(/\s*<link\s+rel="alternate"\s+hreflang="[^"]*"\s+href="[^"]*"\s*\/?>/gi, "");
  const tags = alternatesFor(basePath)
    .map((alt) => `<link rel="alternate" hreflang="${alt.hreflang}" href="${escapeHtmlAttr(alt.href)}" />`)
    .join("\n    ");
  return next.replace(/\n\s*<\/head>/i, `\n    ${tags}\n  </head>`);
}

function inject(shell, rendered) {
  if (!shell.includes('<div id="root"></div>')) {
    throw new Error("Prerender shell must contain an empty root placeholder");
  }

  let html = shell;
  html = html.replace(/<html lang="[^"]*">/, `<html lang="${rendered.locale}">`);
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtmlText(rendered.seo.title)}</title>`);
  html = upsertMetaByName(html, "description", rendered.seo.description);
  html = upsertMetaByName(html, "twitter:title", rendered.seo.title);
  html = upsertMetaByName(html, "twitter:description", rendered.seo.description);
  html = upsertMetaByProperty(html, "og:type", rendered.seo.ogType ?? "website");
  html = upsertMetaByProperty(html, "og:title", rendered.seo.title);
  html = upsertMetaByProperty(html, "og:description", rendered.seo.description);
  html = upsertMetaByProperty(html, "og:locale", ogLocales[rendered.locale]);
  html = upsertCanonical(html, rendered.routePath);
  html = upsertAlternates(html, rendered.basePath);
  html = html.replace('<div id="root"></div>', `<div id="root">${rendered.html}</div>`);
  return html;
}

const { render, getStaticPathsForPrerender } = await import(pathToFileURL(serverEntry).href);
const targets = getStaticPathsForPrerender();
const templates = new Map();

for (const { basePath } of targets) {
  const shellPath = shellPathFor(basePath);
  if (!templates.has(shellPath)) {
    templates.set(shellPath, await readFile(shellPath, "utf8"));
  }
}

for (const { path, basePath } of targets) {
  const shell = templates.get(shellPathFor(basePath));
  const rendered = render(path);
  rendered.routePath = path;
  rendered.basePath = basePath;
  const out = outputPathFor(path);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, inject(shell, rendered), "utf8");
}

await rm(join(dist, "server"), { recursive: true, force: true });
