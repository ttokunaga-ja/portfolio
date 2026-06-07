import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, posix, relative } from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const root = process.cwd();
const contentDir = join(root, "content");
const outFile = join(root, "src/generated/content.generated.ts");
const collections = new Set(["research", "projects", "experience"]);
const locales = new Set(["ja", "en"]);
const buildNow = new Date();

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

function createMarkdownRenderer(context) {
  const renderer = new marked.Renderer();

  renderer.image = (token) => {
    const src = normalizeMarkdownImageHref(token.href, context);
    const title = token.title ? ` title="${escapeHtmlAttribute(token.title)}"` : "";

    return `<img src="${escapeHtmlAttribute(src)}" alt="${escapeHtmlAttribute(token.text)}"${title} loading="lazy" decoding="async">`;
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

async function validateMarkdownImages(html, context) {
  const imageBase = contentImageBase(context.collection, context.slug);
  const imageSources = [...html.matchAll(/<img\b[^>]*\bsrc=(["'])(.*?)\1/gi)].map((match) => match[2]);

  await Promise.all(
    imageSources.map(async (src) => {
      if (!src.startsWith(imageBase)) {
        throw new Error(`${context.normalized} image path must start with ${imageBase}.`);
      }

      await access(join(root, "public", src.slice(1))).catch(() => {
        throw new Error(`${context.normalized} references missing image: public${src}`);
      });
    })
  );
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

function normalizeLink(value, fallbackKind = "") {
  if (!value) return null;

  if (typeof value === "string") {
    const markdownLink = value.match(/^\s*\[([^\]]+)\]\(([^)]+)\)\s*$/);
    if (markdownLink) {
      const [, label, url] = markdownLink;
      return {
        label,
        url,
        kind: normalizeLinkKind(fallbackKind || label)
      };
    }

    if (/^https?:\/\//.test(value)) {
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

  return {
    year: Number(matched[1]),
    month: Number(matched[2]),
    day: Number(matched[3] ?? "1")
  };
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

function isFutureDate(value) {
  const parsed = parseIsoDate(value);
  if (!parsed) return false;

  return Date.UTC(parsed.year, parsed.month - 1, parsed.day) > buildNow.getTime();
}

function withPlannedSuffix(label, locale) {
  if (!label) return "";
  return locale === "ja" ? `${label}（予定）` : `${label} expected`;
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

function toSlug(filePath, collection) {
  const collectionRoot = `${collection}/`;
  const normalized = relative(contentDir, filePath).replaceAll("\\", "/");
  const start = normalized.indexOf(collectionRoot);
  return normalized.slice(start + collectionRoot.length).replace(/\.md$/, "");
}

const files = await listMarkdownFiles(contentDir);
const entries = [];

for (const file of files) {
  const normalized = relative(contentDir, file).replaceAll("\\", "/");
  const [locale, collection] = normalized.split("/");
  if (!locales.has(locale) || !collections.has(collection)) {
    throw new Error(`Unexpected content path: ${normalized}`);
  }

  const raw = await readFile(file, "utf8");
  const parsed = matter(raw);
  const data = parsed.data;
  const slug = toSlug(file, collection);
  const context = { collection, slug, normalized };
  const bodyHtml = await marked.parse(embedStandaloneYouTubeUrls(parsed.content), {
    renderer: createMarkdownRenderer(context)
  });
  await validateMarkdownImages(bodyHtml, context);
  const tags = normalizeArray(data.tags);
  const startDate = firstString(data.startDate);
  const endDate = firstString(data.endDate);
  const startLabel =
    collection === "experience" ? formatMonth(startDate, locale) : firstString(data.startLabel, startDate);
  const baseEndLabel = collection === "experience" ? formatMonth(endDate, locale) : firstString(data.endLabel, endDate);
  const endLabel =
    collection === "experience" && endDate && isFutureDate(endDate)
      ? withPlannedSuffix(baseEndLabel, locale)
      : baseEndLabel;
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
    startLabel,
    endLabel,
    demoUrl: firstString(data.demoUrl),
    experienceType: collection === "experience" ? normalizeExperienceType(data.experienceType, tags) : "",
    sortOrder: Number(data.sortOrder ?? 999),
    featured: Boolean(data.featured),
    tags,
    links: normalizeLinks(data.links),
    bodyHtml
  });
}

function entryStartTime(entry) {
  const parsed = Date.parse(entry.startDate);
  if (!Number.isNaN(parsed)) return parsed;
  return Number.MIN_SAFE_INTEGER + entry.sortOrder;
}

entries.sort((a, b) => {
  if (a.locale !== b.locale) return a.locale.localeCompare(b.locale);
  if (a.collection !== b.collection) return a.collection.localeCompare(b.collection);
  if (a.collection === "experience") {
    return entryStartTime(b) - entryStartTime(a) || a.sortOrder - b.sortOrder || a.title.localeCompare(b.title);
  }
  return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title);
});

const source = `import type { PortfolioEntry } from "../types";

export const entries: PortfolioEntry[] = ${JSON.stringify(entries, null, 2)};

export const generatedAt = ${JSON.stringify(new Date().toISOString())};
`;

await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, source, "utf8");
