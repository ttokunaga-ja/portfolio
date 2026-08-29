import { defaultLocale } from "./i18n";
import type { Collection, Locale, PrimaryPage, RouteState } from "./types";

const primaryPages = new Set<PrimaryPage>([
  "home",
  "about",
  "research",
  "projects",
  "experience",
  "blog",
  "skills",
  "contact",
  "privacy"
]);
const collections = new Set<Collection>(["research", "projects", "experience", "blog"]);

// Detail URL shapes are validated against the metadata catalog immediately before
// hydration in entry-client. Keeping this parser catalog-free preserves the small
// shared entry chunk.
export function parseClientPath(pathname: string): { locale: Locale; route: RouteState } {
  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0] === "en" ? "en" : defaultLocale;
  const routeSegments = locale === "en" ? segments.slice(1) : segments;
  if (routeSegments.length === 0) return { locale, route: { kind: "page", page: "home" } };
  const [first, second] = routeSegments;
  if (routeSegments.length === 2 && second && collections.has(first as Collection)) {
    return { locale, route: { kind: "detail", collection: first as Collection, slug: second } };
  }
  if (routeSegments.length === 1 && primaryPages.has(first as PrimaryPage)) {
    return { locale, route: { kind: "page", page: first as PrimaryPage } };
  }
  return { locale, route: { kind: "notFound" } };
}

export function resolveKnownClientDetail(route: RouteState, exists: boolean): RouteState {
  return route.kind === "detail" && !exists ? { kind: "notFound" } : route;
}
