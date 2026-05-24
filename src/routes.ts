import { getEntry, getUniqueEntryPaths } from "./content";
import { resources } from "./i18n";
import type { Collection, Locale, PrimaryPage, RouteState } from "./types";

const primaryPages = new Set<PrimaryPage>(["home", "research", "projects", "experience", "skills", "contact"]);
const collections = new Set<Collection>(["research", "projects", "experience"]);

export function parseRoute(pathname: string): RouteState {
  const segments = pathname.split("/").filter(Boolean);
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

export function hrefFor(route: PrimaryPage | { collection: Collection; slug: string }) {
  if (typeof route === "string") {
    return route === "home" ? "/" : `/${route}/`;
  }
  return `/${route.collection}/${route.slug}/`;
}

export function getStaticPathsForPrerender(): string[] {
  return [
    "/",
    "/research/",
    "/projects/",
    "/experience/",
    "/skills/",
    "/contact/",
    ...getUniqueEntryPaths().map((entry) => `/${entry.collection}/${entry.slug}/`)
  ];
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
