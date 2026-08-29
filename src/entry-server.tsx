import React from "react";
import { renderToString } from "react-dom/server";
import App from "./App";
import { loadEntryDetail } from "./content";
import { setI18nLanguage } from "./i18n";
import { getAlternateLocales, getJsonLd, getSeo, getStaticPathsForPrerender, parsePath } from "./routes";

export { getAlternateLocales, getJsonLd, getStaticPathsForPrerender };

export async function render(pathname: string) {
  const { locale, route } = parsePath(pathname);
  setI18nLanguage(locale);
  const entryDetail = route.kind === "detail" ? await loadEntryDetail(locale, route.collection, route.slug) : undefined;
  return {
    html: renderToString(<App initialRoute={route} initialLocale={locale} initialEntryDetail={entryDetail} />),
    locale,
    route,
    seo: getSeo(route, locale)
  };
}
