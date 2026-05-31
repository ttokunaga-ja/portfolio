import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import { parsePath } from "./routes";

const { locale, route } = parsePath(window.location.pathname);

const root = document.getElementById("root")!;
const app = (
  <React.StrictMode>
    <App initialRoute={route} initialLocale={locale} />
  </React.StrictMode>
);

if (root.hasChildNodes()) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
