import { defaultLocale } from "./i18n";
import type { Collection, Locale, PrimaryPage, RouteState } from "./types";

function localePrefix(locale: Locale): string {
  return locale === defaultLocale ? "" : `/${locale}`;
}

export function hrefFor(
  route: PrimaryPage | { collection: Collection; slug: string },
  locale: Locale = defaultLocale
): string {
  const prefix = localePrefix(locale);
  return typeof route === "string"
    ? route === "home"
      ? `${prefix}/`
      : `${prefix}/${route}/`
    : `${prefix}/${route.collection}/${route.slug}/`;
}

export async function hrefForRoute(route: RouteState, locale: Locale = defaultLocale): Promise<string> {
  if (route.kind === "detail") {
    // Keep the metadata catalog out of the common shell. It is needed only when
    // changing locale from a detail page, where it prevents navigating to a
    // target locale that does not have the requested slug.
    try {
      const { getEntry } = await import("./content");
      return getEntry(locale, route.collection, route.slug)
        ? hrefFor({ collection: route.collection, slug: route.slug }, locale)
        : hrefFor(route.collection, locale);
    } catch {
      // A missing metadata wrapper cannot establish that the target detail exists.
      return hrefFor(route.collection, locale);
    }
  }
  return route.kind === "page" ? hrefFor(route.page, locale) : hrefFor("home", locale);
}
