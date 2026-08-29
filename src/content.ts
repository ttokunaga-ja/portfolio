import { detailLoaders, entries } from "./generated/content.generated";
import type { Collection, Locale, PortfolioEntry, PortfolioEntryDetail } from "./types";

export function getEntries(locale: Locale, collection?: Collection): PortfolioEntry[] {
  return entries.filter((entry) => entry.locale === locale && (!collection || entry.collection === collection));
}

export function getFeaturedEntries(locale: Locale, collection: Collection, limit = 3): PortfolioEntry[] {
  return getEntries(locale, collection)
    .filter((entry) => entry.featured)
    .slice(0, limit);
}

function entryTime(entry: PortfolioEntry) {
  const candidate = entry.publishedAt || entry.updatedAt || entry.startDate || entry.endDate;
  const parsed = Date.parse(candidate);
  if (!Number.isNaN(parsed)) return parsed;
  return Number.MAX_SAFE_INTEGER - entry.sortOrder;
}

export function getLatestEntry(locale: Locale, collection: Collection): PortfolioEntry | undefined {
  return [...getEntries(locale, collection)].sort((a, b) => {
    return entryTime(b) - entryTime(a) || a.sortOrder - b.sortOrder || a.title.localeCompare(b.title);
  })[0];
}

const demoLinkKinds = new Set(["demo", "experience", "trial", "preview", "play"]);

export function getDemoHref(entry: PortfolioEntry): string {
  const demoLink = entry.links.find((link) => {
    const kind = link.kind.toLowerCase();
    const label = link.label.trim().toLowerCase();
    return demoLinkKinds.has(kind) || demoLinkKinds.has(label);
  });

  return entry.demoUrl || demoLink?.url || "";
}

export function getEntry(locale: Locale, collection: Collection, slug: string): PortfolioEntry | undefined {
  return entries.find((entry) => entry.locale === locale && entry.collection === collection && entry.slug === slug);
}

export async function loadEntryDetail(
  locale: Locale,
  collection: Collection,
  slug: string
): Promise<PortfolioEntryDetail | undefined> {
  const loader = detailLoaders[`${locale}/${collection}/${slug}`];
  if (!loader) return undefined;
  return (await loader()).default;
}

export function getEntryPaths(locale: Locale): Array<{ collection: Collection; slug: string }> {
  return entries
    .filter((entry) => entry.locale === locale)
    .map((entry) => ({ collection: entry.collection, slug: entry.slug }));
}
