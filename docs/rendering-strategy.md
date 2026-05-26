# Rendering Strategy

The portfolio is a Vite MPA with React hydration.

## Build Flow

- `content/{ja,en}/{research,projects,experience}/*.md` is converted at build time.
- `vite build` creates the six HTML shells.
- `vite build --config vite.ssr.config.ts` creates a server render bundle.
- `scripts/prerender.mjs` injects route HTML and route-specific head metadata.
- `scripts/build-sitemap.mjs` writes `dist/sitemap.xml` from the generated `dist/**/index.html` files.

## Page Inventory

| Route                                                               | Rendering                         |
| ------------------------------------------------------------------- | --------------------------------- |
| `/`                                                                 | Prerendered HTML + hydrated React |
| `/research/`, `/projects/`, `/experience/`, `/skills/`, `/contact/` | Prerendered HTML + hydrated React |
| `/{research,projects,experience}/{slug}/`                           | Prerendered HTML + hydrated React |
| `/404.html`                                                         | Static HTML, no React hydration   |

## SSR/CSR Audit

- This project does not use React Server Components, so there are no `use client` files to reduce.
- SSR responsibility is the build-time prerender step: route body HTML, headings, Markdown article content, canonical URL, description, OGP, and Twitter metadata must be present in the generated HTML.
- CSR responsibility is limited to hydration for navigation drawer focus management, language switching, and metadata updates after the viewer switches language.
- Browser APIs are isolated to `src/entry-client.tsx` and the interactive parts of `src/App.tsx`. The SSR entry uses `renderToString` and route data only.
- Display-only structures such as article bodies, cards, timelines, header links, and footer links are still hydrated because the app is a React/Vite MPA. Splitting them into islands would add complexity and is not required for the current pre-release scope.

## Policy

1. Viewer-facing text and route metadata must be present before hydration.
2. Browser-only behavior is limited to language switching, drawer focus management, and client-side metadata sync after language changes.
3. Render output should not depend on runtime-only values such as the current date unless the value is intentionally client-only.
4. New Markdown content should keep required frontmatter explicit so list pages and detail pages stay consistent.
