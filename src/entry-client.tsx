import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import { setI18nLanguage } from "./i18n";
import { parseClientPath, resolveKnownClientDetail } from "./clientRoutes";
import { loadRoutePage } from "./routePageLoaders";
import type { PortfolioEntryDetail, PortfolioTocItem } from "./types";

function recoverPrerenderedDetail(root: HTMLElement): PortfolioEntryDetail | undefined {
  const article = root.querySelector<HTMLElement>(".markdown-article");
  if (!article) return undefined;

  const toc = Array.from(article.querySelectorAll<HTMLElement>("h2[id], h3[id], h4[id]")).map((heading) => ({
    id: heading.id,
    text: heading.textContent?.replace(/\s+/g, " ").trim() ?? "",
    level: Number(heading.tagName.slice(1)) as PortfolioTocItem["level"]
  }));

  return { bodyHtml: article.innerHTML, toc };
}

const { locale, route: parsedRoute } = parseClientPath(window.location.pathname);
// Ensure the client uses the locale that produced the prerendered markup before hydration starts.
setI18nLanguage(locale);
const root = document.getElementById("root")!;
let route = parsedRoute;
let entryDetail: PortfolioEntryDetail | undefined;
let knownMissingDetail = false;
if (route.kind === "detail") {
  try {
    const { getEntry, loadEntryDetail } = await import("./content");
    const entryExists = Boolean(getEntry(locale, route.collection, route.slug));
    knownMissingDetail = !entryExists;
    route = resolveKnownClientDetail(route, entryExists);
    if (route.kind === "detail") {
      entryDetail = (await loadEntryDetail(locale, route.collection, route.slug)) ?? recoverPrerenderedDetail(root);
    }
  } catch {
    // A content wrapper or detail chunk failure must not blank usable SSR markup.
    entryDetail = recoverPrerenderedDetail(root);
  }
}
// Resolve the route implementation before hydration so it matches the SSR tree.
let RouteView:
  React.ComponentType<{ route: typeof route; locale: typeof locale; entryDetail?: PortfolioEntryDetail }> | undefined;
try {
  RouteView = await loadRoutePage(route);
} catch (error) {
  // Keep SSR content intact when a route chunk is unavailable. Links in the prerendered
  // layout and the article body remain usable while the next navigation can retry.
  console.error("Unable to load the route view; retaining prerendered content.", error);
}
const app = RouteView && (
  <React.StrictMode>
    <App initialRoute={route} initialLocale={locale}>
      <RouteView route={route} locale={locale} entryDetail={entryDetail} />
    </App>
  </React.StrictMode>
);

if (app && knownMissingDetail) {
  // Static hosts may return a generic fallback shell for an unknown URL. This is
  // a known route mismatch, so replace it rather than attempting to hydrate it.
  root.replaceChildren();
  createRoot(root).render(app);
} else if (app && root.hasChildNodes() && (route.kind !== "detail" || entryDetail)) {
  hydrateRoot(root, app);
} else if (app && !root.hasChildNodes()) {
  createRoot(root).render(app);
}
