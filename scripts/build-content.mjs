import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
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

  const tagText = tags.join(" ").toLowerCase();
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
  const bodyHtml = await marked.parse(parsed.content);
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
    organization: firstString(data.organization),
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
