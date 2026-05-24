import React from "react";
import { renderToString } from "react-dom/server";
import App from "./App";
import { setI18nLanguage } from "./i18n";
import { getSeo, getStaticPathsForPrerender, parseRoute } from "./routes";
import type { Locale } from "./types";

export { getStaticPathsForPrerender };

export function render(pathname: string, locale: Locale = "ja") {
  const route = parseRoute(pathname);
  setI18nLanguage(locale);
  return {
    html: renderToString(<App initialRoute={route} initialLocale={locale} />),
    locale,
    seo: getSeo(route, locale)
  };
}
