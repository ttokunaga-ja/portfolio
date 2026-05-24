import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import { defaultLocale } from "./i18n";
import { parseRoute } from "./routes";

const htmlLocale = document.documentElement.lang === "en" ? "en" : defaultLocale;

const root = document.getElementById("root")!;
const app = (
  <React.StrictMode>
    <App initialRoute={parseRoute(window.location.pathname)} initialLocale={htmlLocale} />
  </React.StrictMode>
);

if (root.hasChildNodes()) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
