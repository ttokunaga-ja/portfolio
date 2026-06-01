import React from "react";
import { renderToString } from "react-dom/server";
import App from "./App";
import { setI18nLanguage } from "./i18n";
import { getJsonLd, getSeo, getStaticPathsForPrerender, parsePath } from "./routes";

export { getJsonLd, getStaticPathsForPrerender };

export function render(pathname: string) {
  const { locale, route } = parsePath(pathname);
  setI18nLanguage(locale);
  return {
    html: renderToString(<App initialRoute={route} initialLocale={locale} />),
    locale,
    route,
    seo: getSeo(route, locale)
  };
}
