import { getEntry, getUniqueEntryPaths } from "./content";
import { defaultLocale, resources } from "./i18n";
import type { Collection, Locale, PrimaryPage, RouteState } from "./types";

const primaryPages = new Set<PrimaryPage>(["home", "research", "projects", "experience", "skills", "contact"]);
const collections = new Set<Collection>(["research", "projects", "experience"]);

export const locales: Locale[] = ["ja", "en"];

function routeFromSegments(segments: string[]): RouteState {
  if (segments.length === 0) return { kind: "page", page: "home" };

  const [first, second] = segments;
  if (collections.has(first as Collection) && second) {
    return { kind: "detail", collection: first as Collection, slug: second };
  }

  if (primaryPages.has(first as PrimaryPage)) {
    return { kind: "page", page: first as PrimaryPage };
  }

  return { kind: "page", page: "home" };
}

export function parsePath(pathname: string): { locale: Locale; route: RouteState } {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "en") {
    return { locale: "en", route: routeFromSegments(segments.slice(1)) };
  }
  return { locale: defaultLocale, route: routeFromSegments(segments) };
}

function localePrefix(locale: Locale): string {
  return locale === defaultLocale ? "" : `/${locale}`;
}

export function hrefFor(
  route: PrimaryPage | { collection: Collection; slug: string },
  locale: Locale = defaultLocale
): string {
  const prefix = localePrefix(locale);
  if (typeof route === "string") {
    return route === "home" ? `${prefix}/` : `${prefix}/${route}/`;
  }
  return `${prefix}/${route.collection}/${route.slug}/`;
}

export function hrefForRoute(route: RouteState, locale: Locale = defaultLocale): string {
  if (route.kind === "detail") {
    return hrefFor({ collection: route.collection, slug: route.slug }, locale);
  }
  return hrefFor(route.page, locale);
}

export type PrerenderTarget = { path: string; basePath: string; locale: Locale };

export function getStaticPathsForPrerender(): PrerenderTarget[] {
  const basePaths = [
    "/",
    "/research/",
    "/projects/",
    "/experience/",
    "/skills/",
    "/contact/",
    ...getUniqueEntryPaths().map((entry) => `/${entry.collection}/${entry.slug}/`)
  ];

  return locales.flatMap((locale) =>
    basePaths.map((basePath) => ({
      basePath,
      locale,
      path: locale === defaultLocale ? basePath : `/${locale}${basePath}`
    }))
  );
}

export function getSeo(route: RouteState, locale: Locale) {
  const t = resources[locale].translation;
  if (route.kind === "detail") {
    const entry = getEntry(locale, route.collection, route.slug);
    if (entry) {
      return {
        title: `${entry.title} | Takumi Tokunaga`,
        description: entry.abstract,
        ogType: "article" as const
      };
    }
  }

  const pageTitles: Record<PrimaryPage, string> = {
    home: "Takumi Tokunaga Portfolio",
    research: `${t.page.researchTitle} | Takumi Tokunaga`,
    projects: `${t.page.projectsTitle} | Takumi Tokunaga`,
    experience: `${t.page.experienceTitle} | Takumi Tokunaga`,
    skills: `${t.page.skillsTitle} | Takumi Tokunaga`,
    contact: `${t.page.contactTitle} | Takumi Tokunaga`
  };

  const pageDescriptions: Record<PrimaryPage, string> = {
    home: t.home.lead,
    research: t.page.researchLead,
    projects: t.page.projectsLead,
    experience: t.page.experienceLead,
    skills: t.page.skillsLead,
    contact: t.page.contactLead
  };

  const page = route.kind === "page" ? route.page : "home";
  return {
    title: pageTitles[page],
    description: pageDescriptions[page],
    ogType: "website" as const
  };
}

const SAME_AS = [
  "https://github.com/ttokunaga-ja",
  "https://www.linkedin.com/in/%E6%8B%93%E6%9C%AA-%E5%BE%B3%E6%B0%B8-725094354/"
];

// Build the JSON-LD graph for a page: a shared Person node plus a WebSite node
// on the home page and a BreadcrumbList everywhere else.
export function getJsonLd(route: RouteState, locale: Locale, origin: string) {
  const t = resources[locale].translation;
  const inLanguage = locale === "ja" ? "ja-JP" : "en-US";

  const person = {
    "@type": "Person",
    "@id": `${origin}/#person`,
    name: "Takumi Tokunaga",
    url: `${origin}/`,
    image: `${origin}/images/logo.png`,
    sameAs: SAME_AS
  };

  if (route.kind === "page" && route.page === "home") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        person,
        {
          "@type": "WebSite",
          "@id": `${origin}/#website`,
          url: `${origin}${hrefFor("home", locale)}`,
          name: "Takumi Tokunaga Portfolio",
          inLanguage,
          publisher: { "@id": `${origin}/#person` }
        }
      ]
    };
  }

  const crumbs: Array<{ name: string; url: string }> = [
    { name: t.nav.home, url: `${origin}${hrefFor("home", locale)}` }
  ];
  if (route.kind === "detail") {
    crumbs.push({ name: t.nav[route.collection], url: `${origin}${hrefFor(route.collection, locale)}` });
    const entry = getEntry(locale, route.collection, route.slug);
    crumbs.push({
      name: entry ? entry.title : route.slug,
      url: `${origin}${hrefFor({ collection: route.collection, slug: route.slug }, locale)}`
    });
  } else {
    crumbs.push({ name: t.nav[route.page], url: `${origin}${hrefFor(route.page, locale)}` });
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      person,
      {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: crumb.name,
          item: crumb.url
        }))
      }
    ]
  };
}
