import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { parseFrontmatter } from "./frontmatter.mjs";

const root = process.cwd();
const contentDir = join(root, "content");
const dist = join(root, "dist");
const siteOrigin = validateSiteOrigin(process.env.PORTFOLIO_SITE_ORIGIN ?? "https://takumi-tokunaga.com");
const collections = new Set(["research", "projects", "experience", "blog"]);
const locales = new Set(["ja", "en"]);

const collectionLabels = {
  research: { ja: "研究", en: "Research" },
  projects: { ja: "プロジェクト", en: "Projects" },
  experience: { ja: "経歴", en: "Experience" },
  blog: { ja: "ブログ", en: "Blog" }
};

const staticPages = [
  { label: "JA Home", href: "/" },
  { label: "JA About", href: "/about/" },
  { label: "JA Research", href: "/research/" },
  { label: "JA Projects", href: "/projects/" },
  { label: "JA Experience", href: "/experience/" },
  { label: "JA Blog", href: "/blog/" },
  { label: "JA Skills", href: "/skills/" },
  { label: "JA Contact", href: "/contact/" },
  { label: "JA Privacy", href: "/privacy/" },
  { label: "EN Home", href: "/en/" },
  { label: "EN About", href: "/en/about/" },
  { label: "EN Research", href: "/en/research/" },
  { label: "EN Projects", href: "/en/projects/" },
  { label: "EN Experience", href: "/en/experience/" },
  { label: "EN Blog", href: "/en/blog/" },
  { label: "EN Skills", href: "/en/skills/" },
  { label: "EN Contact", href: "/en/contact/" },
  { label: "EN Privacy", href: "/en/privacy/" }
];

function validateSiteOrigin(value) {
  const raw = String(value ?? "")
    .trim()
    .replace(/\/+$/, "");
  let url;

  try {
    url = new URL(raw);
  } catch {
    throw new Error("PORTFOLIO_SITE_ORIGIN must be an absolute HTTPS origin.");
  }

  if (
    url.protocol !== "https:" ||
    !url.hostname ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("PORTFOLIO_SITE_ORIGIN must be a credential-free HTTPS origin without a path, query, or fragment.");
  }

  return url.origin;
}

function validateExternalCanonicalUrl(value, source) {
  const raw = compact(value);
  if (!raw) return "";

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`${source} canonicalUrl must be an absolute http(s) URL.`);
  }

  if (!/^https?:$/.test(url.protocol) || !url.hostname || url.username || url.password) {
    throw new Error(`${source} canonicalUrl must be a credential-free absolute http(s) URL.`);
  }

  return url.href;
}

function absoluteUrl(path) {
  return `${siteOrigin}${path}`;
}

function markdownPathFor(entry) {
  const prefix = entry.locale === "ja" ? "" : `/${entry.locale}`;
  return `${prefix}/${entry.collection}/${entry.slug}.md`;
}

function canonicalPathFor(entry) {
  const prefix = entry.locale === "ja" ? "" : `/${entry.locale}`;
  return `${prefix}/${entry.collection}/${entry.slug}/`;
}

function canonicalUrlFor(entry) {
  return entry.collection === "blog" && entry.canonicalUrl ? entry.canonicalUrl : absoluteUrl(canonicalPathFor(entry));
}

function contentImageBase(collection, slug) {
  return `/images/${collection}/${slug}/`;
}

function rewriteMarkdownImages(markdown, entry) {
  const imageBase = contentImageBase(entry.collection, entry.slug);
  return markdown.replace(/(!\[[^\]]*]\()([^)]+)(\))/g, (match, open, rawHref, close) => {
    const href = rawHref.trim();
    if (/^(?:https?:)?\/\//.test(href) || href.startsWith("data:")) {
      return match;
    }

    const cleanHref = href.replace(/^\.\/+/, "");
    const absolutePath = href.startsWith("/") ? href : `${imageBase}${cleanHref}`;
    return `${open}${absoluteUrl(absolutePath)}${close}`;
  });
}

async function listMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const next = join(dir, entry.name);
      if (entry.isDirectory()) {
        return listMarkdownFiles(next);
      }
      return entry.isFile() && entry.name.endsWith(".md") ? [next] : [];
    })
  );
  return files.flat();
}

function toSlug(filePath, collection) {
  const collectionRoot = `${collection}/`;
  const normalized = relative(contentDir, filePath).replaceAll("\\", "/");
  const start = normalized.indexOf(collectionRoot);
  return normalized.slice(start + collectionRoot.length).replace(/\.md$/, "");
}

function normalizeArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

function normalizeLinks(value) {
  if (!value) return [];
  const links =
    typeof value === "object" && !Array.isArray(value)
      ? Object.values(value).map((link) => (link && typeof link === "object" ? `[${link.label}](${link.url})` : link))
      : Array.isArray(value)
        ? value
        : [value];
  return links
    .map((link) => {
      if (typeof link !== "string") return null;
      const matched = link.match(/^\s*\[([^\]]+)\]\(([^)]+)\)\s*$/);
      if (matched) {
        return { label: matched[1], url: matched[2] };
      }
      if (/^https?:\/\//.test(link)) {
        return { label: link, url: link };
      }
      return null;
    })
    .filter(Boolean);
}

function compact(value) {
  return String(value ?? "").trim();
}

function createEntryMarkdown(entry) {
  const language = entry.locale === "ja" ? "ja-JP" : "en-US";
  const canonical = canonicalUrlFor(entry);
  const rewrittenBody = rewriteMarkdownImages(entry.body, entry);
  const label = collectionLabels[entry.collection]?.[entry.locale] ?? entry.collection;

  const metadata = [
    `- Canonical: ${canonical}`,
    `- Language: ${language}`,
    `- Type: ${label}`,
    entry.role ? `- Role: ${entry.role}` : "",
    entry.period ? `- Period: ${entry.period}` : "",
    entry.tags.length ? `- Tags: ${entry.tags.join(", ")}` : ""
  ].filter(Boolean);

  const links =
    entry.links.length > 0 ? ["", "## Links", "", ...entry.links.map((link) => `- [${link.label}](${link.url})`)] : [];

  return [
    `# ${entry.title}`,
    "",
    entry.subtitle ? `## ${entry.subtitle}` : "",
    entry.subtitle ? "" : "",
    entry.abstract,
    "",
    "## Metadata",
    "",
    ...metadata,
    ...links,
    "",
    "## Content",
    "",
    rewrittenBody.trim(),
    ""
  ]
    .filter((line, index, lines) => !(line === "" && lines[index - 1] === ""))
    .join("\n");
}

function createLlmsTxt(entries) {
  const japaneseEntries = entries.filter((entry) => entry.locale === "ja" && entry.collection !== "blog");
  const englishEntries = entries.filter((entry) => entry.locale === "en" && entry.collection !== "blog");
  const blogEntries = entries.filter((entry) => entry.collection === "blog");

  return [
    "# Takumi Tokunaga Portfolio",
    "",
    "Takumi Tokunaga's personal, non-commercial portfolio site for research, projects, experience, technical skills, and contact links.",
    "The site is primarily static and is intended to be readable by search engines, AI search systems, and AI agents.",
    "",
    "## Important HTML Pages",
    "",
    ...staticPages.map((page) => `- [${page.label}](${absoluteUrl(page.href)})`),
    "",
    "## AI-Readable Markdown Pages",
    "",
    ...japaneseEntries.map((entry) => `- [${entry.title}](${absoluteUrl(markdownPathFor(entry))})`),
    "",
    "## English Markdown Pages",
    "",
    ...englishEntries.map((entry) => `- [${entry.title}](${absoluteUrl(markdownPathFor(entry))})`),
    "",
    "## Blog Markdown Pages",
    "",
    "Blog entries are included regardless of their featured status. Their metadata identifies the original canonical URL when an entry is mirrored from Zenn.",
    "",
    ...blogEntries.map((entry) => `- [${entry.title}](${absoluteUrl(markdownPathFor(entry))})`),
    "",
    "## Main Technical Areas",
    "",
    "- Go",
    "- Python",
    "- React",
    "- MUI",
    "- Cloudflare Pages",
    "- Google Cloud Run",
    "- Firebase Authentication",
    "- Firestore",
    "- Neon PostgreSQL",
    "- AI / Machine Learning",
    "- Computer Vision",
    "- Reality Media / Mixed Reality",
    "- Education support systems",
    "",
    "## Crawling Notes",
    "",
    "- Canonical HTML pages are the primary indexable pages.",
    "- Markdown pages are provided for AI-readable summaries and should not be indexed as duplicate search results.",
    `- Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    ""
  ].join("\n");
}

async function readContentEntries() {
  const files = await listMarkdownFiles(contentDir);
  const entries = [];

  for (const file of files) {
    const normalized = relative(contentDir, file).replaceAll("\\", "/");
    const [locale, collection] = normalized.split("/");
    if (!locales.has(locale) || !collections.has(collection)) {
      continue;
    }

    const raw = await readFile(file, "utf8");
    const parsed = parseFrontmatter(raw);
    const data = parsed.data;
    const slug = toSlug(file, collection);

    entries.push({
      locale,
      collection,
      slug,
      source: normalized,
      title: compact(data.title),
      subtitle: compact(data.subtitle),
      abstract: compact(data.abstract),
      role: compact(data.role),
      period: [compact(data.startDate), compact(data.endDate)].filter(Boolean).join(" - "),
      featured: Boolean(data.featured),
      canonicalUrl: collection === "blog" ? validateExternalCanonicalUrl(data.canonicalUrl, normalized) : "",
      tags: normalizeArray(data.tags),
      links: normalizeLinks(data.links),
      body: parsed.content
    });
  }

  return entries.sort((a, b) => {
    if (a.locale !== b.locale) return a.locale.localeCompare(b.locale);
    if (a.collection !== b.collection) return a.collection.localeCompare(b.collection);
    return a.title.localeCompare(b.title);
  });
}

function createHeadersAppendix(entries) {
  const markdownHeaderBlocks = entries.map((entry) =>
    [
      markdownPathFor(entry),
      "  Content-Type: text/markdown; charset=utf-8",
      "  X-Robots-Tag: noindex",
      `  Link: <${canonicalUrlFor(entry)}>; rel="canonical"`,
      "  Cache-Control: public, max-age=3600, must-revalidate"
    ].join("\n")
  );

  return [
    "",
    "# AI-readable text surfaces",
    "/llms.txt",
    "  Content-Type: text/plain; charset=utf-8",
    "  Cache-Control: public, max-age=3600, must-revalidate",
    "",
    ...markdownHeaderBlocks,
    ""
  ].join("\n");
}

async function assertGeneratedOutputs(entries) {
  const staticHrefSet = new Set(staticPages.map((page) => page.href));
  if (staticHrefSet.size !== staticPages.length) {
    throw new Error("llms.txt static page hrefs must be unique.");
  }

  const expectedMarkdownPaths = entries.map((entry) => markdownPathFor(entry));
  const expectedPathSet = new Set(expectedMarkdownPaths);
  if (expectedPathSet.size !== expectedMarkdownPaths.length) {
    throw new Error("AI-search output paths must be unique for every content entry.");
  }

  await Promise.all(expectedMarkdownPaths.map((path) => access(join(dist, path.replace(/^\//, "")))));

  const headers = await readFile(join(dist, "_headers"), "utf8");
  const generatedHeaderCount = (
    headers.match(/^\/(?:en\/)?(?:research|projects|experience|blog)\/[^\n]+\.md$/gmu) ?? []
  ).length;
  if (generatedHeaderCount !== entries.length) {
    throw new Error(`AI-search header count mismatch: expected ${entries.length}, received ${generatedHeaderCount}.`);
  }

  for (const entry of entries.filter((candidate) => candidate.collection === "blog" && candidate.canonicalUrl)) {
    const block = `${markdownPathFor(entry)}\n  Content-Type: text/markdown; charset=utf-8\n  X-Robots-Tag: noindex\n  Link: <${entry.canonicalUrl}>; rel="canonical"`;
    if (!headers.includes(block)) {
      throw new Error(`${entry.source} must retain its external canonical Link header.`);
    }
  }
}

const entries = await readContentEntries();

for (const entry of entries) {
  const out = join(dist, markdownPathFor(entry).replace(/^\//, ""));
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, createEntryMarkdown(entry), "utf8");
}

await writeFile(join(dist, "llms.txt"), createLlmsTxt(entries), "utf8");

const headersPath = join(dist, "_headers");
const existingHeaders = await readFile(headersPath, "utf8").catch(() => "");
const strippedHeaders = existingHeaders.replace(/\n# AI-readable text surfaces[\s\S]*$/u, "").trimEnd();
await writeFile(headersPath, `${strippedHeaders}${createHeadersAppendix(entries)}`, "utf8");

await assertGeneratedOutputs(entries);

console.log(`[ai-search] dist/llms.txt and ${entries.length} markdown pages`);
