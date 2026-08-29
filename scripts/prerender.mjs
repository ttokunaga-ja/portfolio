import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const dist = join(root, "dist");
const serverEntry = join(dist, "server/entry-server.js");
const siteOrigin = (process.env.PORTFOLIO_SITE_ORIGIN ?? "https://takumi-tokunaga.com").replace(/\/+$/, "");

const ogLocales = { ja: "ja_JP", en: "en_US" };
const metaNamePatterns = new Map([
  ["description", /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i],
  ["twitter:title", /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i],
  ["twitter:description", /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i]
]);
const metaPropertyPatterns = new Map([
  ["og:type", /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i],
  ["og:title", /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i],
  ["og:description", /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i],
  ["og:locale", /<meta\s+property="og:locale"\s+content="[^"]*"\s*\/?>/i],
  ["og:url", /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i],
  ["og:site_name", /<meta\s+property="og:site_name"\s+content="[^"]*"\s*\/?>/i]
]);

function escapeHtmlText(value) {
  return String(value) // nosemgrep: javascript.audit.detect-replaceall-sanitization.detect-replaceall-sanitization
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtmlAttr(value) {
  return escapeHtmlText(value).replaceAll('"', "&quot;"); // nosemgrep: javascript.audit.detect-replaceall-sanitization.detect-replaceall-sanitization
}

function shellPathFor(basePath) {
  const section = basePath.split("/").filter(Boolean)[0] ?? "";
  if (
    section &&
    ["about", "research", "projects", "experience", "blog", "skills", "contact", "privacy"].includes(section)
  ) {
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

function alternatesFor(basePath, locales) {
  const alternates = locales.map((locale) => ({
    hreflang: locale,
    href: canonicalFor(locale === "ja" ? basePath : `/${locale}${basePath}`)
  }));
  if (locales.includes("ja")) alternates.push({ hreflang: "x-default", href: canonicalFor(basePath) });
  return alternates;
}

function upsertMetaByName(html, name, content) {
  const tag = `<meta name="${name}" content="${escapeHtmlAttr(content)}" />`;
  const pattern = metaNamePatterns.get(name);
  if (!pattern) {
    throw new Error(`Unsupported meta name: ${name}`);
  }
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  return html.replace(/\n\s*<\/head>/i, `\n    ${tag}\n  </head>`);
}

function upsertMetaByProperty(html, property, content) {
  const tag = `<meta property="${property}" content="${escapeHtmlAttr(content)}" />`;
  const pattern = metaPropertyPatterns.get(property);
  if (!pattern) {
    throw new Error(`Unsupported meta property: ${property}`);
  }
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  return html.replace(/\n\s*<\/head>/i, `\n    ${tag}\n  </head>`);
}

function upsertCanonical(html, canonicalUrl) {
  const tag = `<link rel="canonical" href="${escapeHtmlAttr(canonicalUrl)}" />`;
  const pattern = /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i;
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  return html.replace(/\n\s*<\/head>/i, `\n    ${tag}\n  </head>`);
}

function upsertAlternates(html, basePath, locales) {
  // Drop any previously-injected alternates, then add the current set.
  let next = html.replace(/\s*<link\s+rel="alternate"\s+hreflang="[^"]*"\s+href="[^"]*"\s*\/?>/gi, "");
  const tags = alternatesFor(basePath, locales)
    .map((alt) => `<link rel="alternate" hreflang="${alt.hreflang}" href="${escapeHtmlAttr(alt.href)}" />`)
    .join("\n    ");
  return next.replace(/\n\s*<\/head>/i, `\n    ${tags}\n  </head>`);
}

function jsonLdScript(data) {
  // Escape `<` so entry titles can never break out of the script element.
  const json = JSON.stringify(data).replaceAll("<", "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
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
  const canonicalUrl = rendered.seo.canonicalUrl || canonicalFor(rendered.routePath);
  html = upsertMetaByProperty(html, "og:url", canonicalUrl);
  html = upsertMetaByProperty(html, "og:site_name", "Takumi Tokunaga");
  html = upsertCanonical(html, canonicalUrl);
  html = upsertAlternates(html, rendered.basePath, rendered.alternateLocales);
  if (rendered.seo.noIndex) {
    html = html.replace(/\n\s*<\/head>/i, `\n    <meta name="robots" content="noindex, follow" />\n  </head>`);
  }
  html = html.replace(/\n\s*<\/head>/i, `\n    ${jsonLdScript(rendered.jsonLd)}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${rendered.html}</div>`);
  return html;
}

const { render, getAlternateLocales, getJsonLd, getStaticPathsForPrerender } = await import(
  pathToFileURL(serverEntry).href
);
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
  const rendered = await render(path);
  rendered.routePath = path;
  rendered.basePath = basePath;
  rendered.alternateLocales = getAlternateLocales(rendered.route, rendered.locale);
  if (rendered.seo.canonicalUrl && rendered.alternateLocales.length > 0) {
    throw new Error(`Externally canonical content must not emit local alternates: ${path}`);
  }
  rendered.jsonLd = getJsonLd(rendered.route, rendered.locale, siteOrigin);
  const out = outputPathFor(path);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, inject(shell, rendered), "utf8");
}

await rm(join(dist, "server"), { recursive: true, force: true });
