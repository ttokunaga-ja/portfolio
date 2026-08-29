import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import { loadEntryDetail } from "./content";
import { setI18nLanguage } from "./i18n";
import { parsePath } from "./routes";
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

const { locale, route } = parsePath(window.location.pathname);
// Ensure the client uses the locale that produced the prerendered markup before hydration starts.
setI18nLanguage(locale);
const root = document.getElementById("root")!;
let entryDetail: PortfolioEntryDetail | undefined;
if (route.kind === "detail") {
  try {
    entryDetail = (await loadEntryDetail(locale, route.collection, route.slug)) ?? recoverPrerenderedDetail(root);
  } catch {
    entryDetail = recoverPrerenderedDetail(root);
  }
}
const app = (
  <React.StrictMode>
    <App initialRoute={route} initialLocale={locale} initialEntryDetail={entryDetail} />
  </React.StrictMode>
);

if (root.hasChildNodes() && (route.kind !== "detail" || entryDetail)) {
  hydrateRoot(root, app);
} else if (!root.hasChildNodes()) {
  createRoot(root).render(app);
}
