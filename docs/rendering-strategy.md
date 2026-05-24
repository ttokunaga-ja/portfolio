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

## Policy

1. Viewer-facing text and route metadata must be present before hydration.
2. Browser-only behavior is limited to language switching, drawer focus management, and client-side metadata sync after language changes.
3. New Markdown content should keep required frontmatter explicit so list pages and detail pages stay consistent.
