import { access, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, posix, relative } from "node:path";
import { marked } from "marked";
import sharp from "sharp";
import { parseFrontmatter } from "./frontmatter.mjs";
import { assertSafeMarkdownTokens } from "./markdown-security.mjs";

const root = process.cwd();
const contentDir = join(root, "content");
const outFile = join(root, "src/generated/content.generated.ts");
const detailsDir = join(root, "src/generated/content-details");
const collections = new Set(["research", "projects", "experience", "blog"]);
const locales = new Set(["ja", "en"]);
const imageDimensions = new Map();
const imageDimensionTasks = new Map();

marked.setOptions({
  gfm: true,
  breaks: false
});

function escapeHtmlAttribute(value) {
  return String(value) // nosemgrep: javascript.audit.detect-replaceall-sanitization.detect-replaceall-sanitization
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function contentImageBase(collection, slug) {
  return `/images/${collection}/${slug}/`;
}

function normalizeMarkdownImageHref(value, context) {
  const href = String(value ?? "").trim();
  const imageBase = contentImageBase(context.collection, context.slug);

  if (!href) {
    throw new Error(`${context.normalized} has an empty image path.`);
  }

  if (/^(?:https?:)?\/\//.test(href) || href.startsWith("data:")) {
    throw new Error(`${context.normalized} uses ${href}. Store content images under public${imageBase}.`);
  }

  if (href.startsWith("/")) {
    const normalizedHref = posix.normalize(href);
    if (!normalizedHref.startsWith(imageBase)) {
      throw new Error(`${context.normalized} image path must start with ${imageBase}.`);
    }
    return normalizedHref;
  }

  const relativeHref = posix.normalize(href.replace(/^\.\/+/, ""));
  if (!relativeHref || relativeHref === "." || relativeHref === ".." || relativeHref.startsWith("../")) {
    throw new Error(`${context.normalized} image path must stay inside public${imageBase}.`);
  }

  return `${imageBase}${relativeHref}`;
}

function decodeHtmlEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/&#(\d+);/g, (_, codePoint) => String.fromCodePoint(Number(codePoint)))
    .replace(/&#x([\da-f]+);/gi, (_, codePoint) => String.fromCodePoint(Number.parseInt(codePoint, 16)));
}

function headingTextFromHtml(html) {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

function createHeadingId(text, occurrences) {
  const digest = createHash("sha256").update(text.normalize("NFKC")).digest("hex").slice(0, 12);
  const baseId = `heading-${digest}`;
  const occurrence = (occurrences.get(baseId) ?? 0) + 1;
  occurrences.set(baseId, occurrence);
  return occurrence === 1 ? baseId : `${baseId}-${occurrence}`;
}

function createMarkdownRenderer(context, toc) {
  const renderer = new marked.Renderer();
  const headingOccurrences = new Map();
  const tableLabel = context.locale === "ja" ? "横にスクロール可能な表" : "Horizontally scrollable table";

  renderer.image = (token) => {
    const src = normalizeMarkdownImageHref(token.href, context);
    const dimensions = imageDimensions.get(src);
    if (!dimensions) {
      throw new Error(`${context.normalized} is missing image dimensions for public${src}.`);
    }
    const title = token.title ? ` title="${escapeHtmlAttribute(token.title)}"` : "";

    return `<img src="${escapeHtmlAttribute(src)}" alt="${escapeHtmlAttribute(token.text)}"${title} width="${dimensions.width}" height="${dimensions.height}" loading="lazy" decoding="async">`;
  };

  renderer.code = ({ text, lang }) => {
    const language = String(lang ?? "").match(/^\S+/)?.[0] ?? "";
    const className = language ? ` class="language-${escapeHtmlAttribute(language)}"` : "";
    const normalizedText = text.replace(/\n$/, "");

    return `<pre tabindex="0"><code${className}>${escapeHtmlAttribute(normalizedText)}\n</code></pre>\n`;
  };

  renderer.table = ({ header, rows }) => {
    const headerTexts = header
      .map((cell) => headingTextFromHtml(renderer.parser.parseInline(cell.tokens)))
      .filter(Boolean);
    const tableLabelWithHeaders = headerTexts.length > 0 ? `${tableLabel}: ${headerTexts.join(", ")}` : tableLabel;
    const headerHtml = header.map((cell) => renderer.tablecell(cell)).join("");
    const bodyHtml = rows
      .map((row) => renderer.tablerow({ text: row.map((cell) => renderer.tablecell(cell)).join("") }))
      .join("");
    const body = bodyHtml ? `<tbody>${bodyHtml}</tbody>` : "";

    return `<div class="markdown-table-scroll" role="region" aria-label="${escapeHtmlAttribute(tableLabelWithHeaders)}" tabindex="0"><table>\n<thead>\n${renderer.tablerow({ text: headerHtml })}</thead>\n${body}</table>\n</div>\n`;
  };

  renderer.heading = function heading({ tokens, depth }) {
    const html = this.parser.parseInline(tokens);

    if (depth < 2 || depth > 4) {
      return `<h${depth}>${html}</h${depth}>\n`;
    }

    const text = headingTextFromHtml(html);
    const id = createHeadingId(text, headingOccurrences);
    toc.push({ id, text, level: depth });
    return `<h${depth} id="${escapeHtmlAttribute(id)}">${html}</h${depth}>\n`;
  };

  return renderer;
}

function parseTimestampToSeconds(value) {
  if (!value) return 0;

  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  const matched = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
  if (!matched) return 0;

  const [, hours = "0", minutes = "0", seconds = "0"] = matched;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

function toYouTubeEmbedUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return "";
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);
  let videoId = "";

  if (host === "youtu.be") {
    videoId = parts[0] ?? "";
  } else if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v") ?? "";
    } else if (["embed", "shorts", "live"].includes(parts[0] ?? "")) {
      videoId = parts[1] ?? "";
    }
  }

  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return "";
  }

  const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  const start = parseTimestampToSeconds(url.searchParams.get("start") ?? url.searchParams.get("t") ?? "");
  if (start > 0) {
    embedUrl.searchParams.set("start", String(start));
  }

  return embedUrl.toString();
}

function unwrapStandaloneUrl(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function createYouTubeEmbedHtml(embedUrl) {
  return `<div class="markdown-video"><iframe src="${escapeHtmlAttribute(embedUrl)}" title="YouTube video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
}

function embedStandaloneYouTubeUrls(markdown) {
  let inFence = false;

  return markdown
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();

      if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
        inFence = !inFence;
        return line;
      }

      if (inFence || !trimmed) {
        return line;
      }

      const embedUrl = toYouTubeEmbedUrl(unwrapStandaloneUrl(trimmed));
      return embedUrl ? createYouTubeEmbedHtml(embedUrl) : line;
    })
    .join("\n");
}

function normalizeZennDirectives(markdown) {
  let inFence = false;
  let directive = null;

  return markdown
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();

      if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
        inFence = !inFence;
        return line;
      }

      if (inFence) return line;

      const messageMatch = trimmed.match(/^:::\s*message(?:\s+([\w-]+))?\s*$/);
      if (messageMatch && !directive) {
        directive = "message";
        const calloutKind = messageMatch[1] ?? "message";
        return `<aside class="markdown-callout" data-callout-kind="${escapeHtmlAttribute(calloutKind)}">\n`;
      }

      const detailsMatch = trimmed.match(/^:::\s*details(?:\s+(.+?))?\s*$/);
      if (detailsMatch && !directive) {
        directive = "details";
        const summary = detailsMatch[1]?.trim() || "Details";
        return `<details class="markdown-details"><summary>${escapeHtmlAttribute(summary)}</summary>\n`;
      }

      if (trimmed === ":::" && directive) {
        const closingTag = directive === "details" ? "</details>" : "</aside>";
        directive = null;
        return `\n${closingTag}`;
      }

      return line;
    })
    .join("\n");
}

function collectMarkdownImageHrefs(markdown) {
  const imageHrefs = [];
  const pending = [...marked.lexer(markdown)];

  while (pending.length > 0) {
    const token = pending.pop();
    if (!token || typeof token !== "object") continue;
    if (token.type === "image") imageHrefs.push(token.href);
    if (Array.isArray(token.tokens)) pending.push(...token.tokens);
    if (Array.isArray(token.items)) pending.push(...token.items);
  }

  return imageHrefs;
}

async function getImageDimensions(src, context) {
  if (!imageDimensionTasks.has(src)) {
    imageDimensionTasks.set(
      src,
      (async () => {
        const imagePath = join(root, "public", src.slice(1));
        await access(imagePath).catch(() => {
          throw new Error(`${context.normalized} references missing image: public${src}`);
        });

        let metadata;
        try {
          metadata = await sharp(imagePath).metadata();
        } catch (error) {
          throw new Error(`${context.normalized} has unreadable image metadata for public${src}.`, { cause: error });
        }

        const { width, height } = metadata;
        if (!Number.isSafeInteger(width) || width <= 0 || !Number.isSafeInteger(height) || height <= 0) {
          throw new Error(`${context.normalized} has invalid image dimensions for public${src}.`);
        }

        const dimensions = { width, height };
        imageDimensions.set(src, dimensions);
        return dimensions;
      })()
    );
  }

  return imageDimensionTasks.get(src);
}

async function cacheMarkdownImageDimensions(markdown, context) {
  const imageSources = new Set(
    collectMarkdownImageHrefs(markdown).map((href) => normalizeMarkdownImageHref(href, context))
  );

  await Promise.all([...imageSources].map((src) => getImageDimensions(src, context)));
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

async function listTypeScriptFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const next = join(dir, entry.name);
      if (entry.isDirectory()) return listTypeScriptFiles(next);
      return entry.isFile() && entry.name.endsWith(".ts") ? [next] : [];
    })
  );
  return files.flat();
}

function normalizeArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

function normalizeLinkKind(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isAllowedExternalLinkURL(value) {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname) && !url.username && !url.password
    );
  } catch {
    return false;
  }
}

function normalizeLink(value, fallbackKind = "") {
  if (!value) return null;

  if (typeof value === "string") {
    const markdownLink = value.match(/^\s*\[([^\]]+)\]\(([^)]+)\)\s*$/);
    if (markdownLink) {
      const [, label, url] = markdownLink;
      if (!isAllowedExternalLinkURL(url)) return null;
      return {
        label,
        url,
        kind: normalizeLinkKind(fallbackKind || label)
      };
    }

    if (isAllowedExternalLinkURL(value)) {
      return {
        label: fallbackKind || value,
        url: value,
        kind: normalizeLinkKind(fallbackKind)
      };
    }

    return null;
  }

  if (typeof value !== "object") return null;

  const label = firstString(value.label, firstString(value.name, firstString(value.title, fallbackKind)));
  const url = firstString(value.url, firstString(value.href));
  if (!label || !url) return null;
  if (!isAllowedExternalLinkURL(url)) return null;

  return {
    label,
    url,
    kind: normalizeLinkKind(firstString(value.kind, firstString(value.type, fallbackKind || label)))
  };
}

function normalizeLinks(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((link) => normalizeLink(link)).filter(Boolean);
  }
  if (typeof value === "string") {
    return [normalizeLink(value)].filter(Boolean);
  }
  if (typeof value !== "object") return [];

  return Object.entries(value)
    .map(([kind, link]) => {
      if (typeof link === "string") {
        return normalizeLink(link, kind);
      }
      if (link && typeof link === "object") {
        return normalizeLink({ kind, ...link }, kind);
      }
      return null;
    })
    .filter(Boolean);
}

function firstString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeExperienceType(value, tags = []) {
  const normalized = normalizeLinkKind(value);
  if (["education", "academic", "school"].includes(normalized)) return "education";
  if (["work", "career", "employment"].includes(normalized)) return "work";
  if (
    ["community", "club", "circle", "student-organization", "student-org", "lab", "research-lab"].includes(normalized)
  ) {
    return "community";
  }

  const tagText = tags.join(" ").toLowerCase();
  if (/(community|club|circle|student organization|robotics|lab|部活|部|団体|研究室)/.test(tagText)) {
    return "community";
  }

  if (/(university|college|school|academic|education|高校|大学|学校|学歴)/.test(tagText)) {
    return "education";
  }

  return "work";
}

function parseIsoDate(value) {
  const matched = String(value).match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!matched) return null;

  const parsed = {
    year: Number(matched[1]),
    month: Number(matched[2]),
    day: Number(matched[3] ?? "1")
  };

  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  if (
    date.getUTCFullYear() !== parsed.year ||
    date.getUTCMonth() !== parsed.month - 1 ||
    date.getUTCDate() !== parsed.day
  ) {
    return null;
  }

  return parsed;
}

function formatMonth(value, locale) {
  const parsed = parseIsoDate(value);
  if (!parsed) return firstString(value);

  if (locale === "ja") {
    return `${parsed.year}年${parsed.month}月`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, 1)));
}

function presentLabel(locale) {
  return locale === "ja" ? "現在" : "Present";
}

function formatExperiencePeriod(startLabel, endLabel, locale) {
  if (!startLabel) return endLabel || presentLabel(locale);
  if (!endLabel) return `${startLabel} - ${presentLabel(locale)}`;
  if (startLabel === endLabel) return startLabel;
  return `${startLabel} - ${endLabel}`;
}

function withExpectedSuffix(label, locale) {
  if (!label) return "";
  return locale === "ja" ? `${label}（予定）` : `${label} expected`;
}

function toSlug(filePath, collection) {
  const collectionRoot = `${collection}/`;
  const normalized = relative(contentDir, filePath).replaceAll("\\", "/");
  const start = normalized.indexOf(collectionRoot);
  return normalized.slice(start + collectionRoot.length).replace(/\.md$/, "");
}

function validateDate(value, field, context) {
  if (value && !parseIsoDate(value)) {
    throw new Error(`${context.normalized} has an invalid ${field}: ${value}. Use a real YYYY-MM-DD calendar date.`);
  }
}

function validateExternalUrl(value, field, context) {
  if (value && !isAllowedExternalLinkURL(value)) {
    throw new Error(
      `${context.normalized} has an unsafe ${field}. Only absolute http(s) URLs without credentials are allowed.`
    );
  }
}

function detailModulePath(context) {
  return join(detailsDir, context.locale, context.collection, `${context.slug}.ts`);
}

function detailModuleImportPath(context) {
  return `./content-details/${context.locale}/${context.collection}/${context.slug}`;
}

const files = await listMarkdownFiles(contentDir);
const entries = [];
const detailModules = [];

await rm(detailsDir, { recursive: true, force: true });

for (const file of files) {
  const normalized = relative(contentDir, file).replaceAll("\\", "/");
  const [locale, collection] = normalized.split("/");
  if (!locales.has(locale) || !collections.has(collection)) {
    throw new Error(`Unexpected content path: ${normalized}`);
  }

  const raw = await readFile(file, "utf8");
  const parsed = parseFrontmatter(raw);
  const data = parsed.data;
  const slug = toSlug(file, collection);
  const context = { collection, locale, slug, normalized };
  assertSafeMarkdownTokens(marked.lexer(parsed.content), context);
  await cacheMarkdownImageDimensions(parsed.content, context);
  const toc = [];
  const bodyHtml = await marked.parse(embedStandaloneYouTubeUrls(normalizeZennDirectives(parsed.content)), {
    renderer: createMarkdownRenderer(context, toc)
  });
  const tags = normalizeArray(data.tags);
  const startDate = firstString(data.startDate);
  const endDate = firstString(data.endDate);
  if (data.endDateExpected !== undefined && typeof data.endDateExpected !== "boolean") {
    throw new Error(`${normalized} has a non-boolean endDateExpected value.`);
  }
  const endDateExpected = data.endDateExpected === true;
  const publishedAt = firstString(data.publishedAt);
  const updatedAt = firstString(data.updatedAt);
  const demoUrl = firstString(data.demoUrl);
  const canonicalUrl = firstString(data.canonicalUrl);
  for (const [field, value] of [
    ["startDate", startDate],
    ["endDate", endDate],
    ["publishedAt", publishedAt],
    ["updatedAt", updatedAt]
  ]) {
    validateDate(value, field, context);
  }
  validateExternalUrl(demoUrl, "demoUrl", context);
  validateExternalUrl(canonicalUrl, "canonicalUrl", context);
  const startLabel =
    collection === "experience" ? formatMonth(startDate, locale) : firstString(data.startLabel, startDate);
  const baseEndLabel = collection === "experience" ? formatMonth(endDate, locale) : firstString(data.endLabel, endDate);
  const endLabel = endDateExpected ? withExpectedSuffix(baseEndLabel, locale) : baseEndLabel;
  const period =
    collection === "experience" ? formatExperiencePeriod(startLabel, endLabel, locale) : firstString(data.period);

  for (const required of ["title", "abstract"]) {
    if (!data[required]) {
      throw new Error(`${normalized} is missing frontmatter field: ${required}`);
    }
  }

  entries.push({
    locale,
    collection,
    slug,
    title: firstString(data.title),
    subtitle: firstString(data.subtitle),
    abstract: firstString(data.abstract),
    role: firstString(data.role),
    period,
    startDate,
    endDate,
    endDateExpected,
    startLabel,
    endLabel,
    demoUrl,
    experienceType: collection === "experience" ? normalizeExperienceType(data.experienceType, tags) : "",
    sortOrder: Number(data.sortOrder ?? 999),
    featured: Boolean(data.featured),
    tags,
    links: normalizeLinks(data.links),
    publishedAt,
    updatedAt,
    canonicalUrl
  });
  detailModules.push({ context, bodyHtml, toc });
}

function entryStartTime(entry) {
  const parsed = Date.parse(entry.publishedAt || entry.updatedAt || entry.startDate);
  if (!Number.isNaN(parsed)) return parsed;
  return Number.MIN_SAFE_INTEGER + entry.sortOrder;
}

entries.sort((a, b) => {
  if (a.locale !== b.locale) return a.locale.localeCompare(b.locale);
  if (a.collection !== b.collection) return a.collection.localeCompare(b.collection);
  if (a.collection === "experience") {
    return entryStartTime(b) - entryStartTime(a) || a.sortOrder - b.sortOrder || a.title.localeCompare(b.title);
  }
  if (a.collection === "blog") {
    return entryStartTime(b) - entryStartTime(a) || a.title.localeCompare(b.title);
  }
  if (a.collection === "projects") {
    return entryStartTime(b) - entryStartTime(a) || a.sortOrder - b.sortOrder || a.title.localeCompare(b.title);
  }
  return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title);
});

const source = `import type { PortfolioEntry, PortfolioEntryDetail } from "../types";

export const entries: PortfolioEntry[] = ${JSON.stringify(entries, null, 2)};

export const detailLoaders: Record<string, () => Promise<{ default: PortfolioEntryDetail }>> = {
${detailModules
  .map(
    ({ context }) =>
      `  ${JSON.stringify(`${context.locale}/${context.collection}/${context.slug}`)}: () => import(${JSON.stringify(detailModuleImportPath(context))}),`
  )
  .join("\n")}
};
`;

await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, source, "utf8");
await Promise.all(
  detailModules.map(async ({ context, bodyHtml, toc }) => {
    const file = detailModulePath(context);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(
      file,
      `import type { PortfolioEntryDetail } from "../../../../types";\n\nconst detail: PortfolioEntryDetail = ${JSON.stringify(
        { bodyHtml, toc },
        null,
        2
      )};\n\nexport default detail;\n`,
      "utf8"
    );
  })
);

const expectedDetailModules = new Set(detailModules.map(({ context }) => detailModulePath(context)));
const generatedDetailModules = new Set(await listTypeScriptFiles(detailsDir));
if (
  generatedDetailModules.size !== expectedDetailModules.size ||
  [...generatedDetailModules].some((file) => !expectedDetailModules.has(file))
) {
  throw new Error("Generated detail modules do not exactly match the current content set.");
}
