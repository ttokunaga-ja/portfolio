# Portfolio

Personal portfolio built with Vite 8 MPA mode, React 19, TypeScript, MUI 6, Emotion, i18next, and build-time Markdown prerendering.

## Stack

- Build: Vite 8, six HTML entries, build-time prerender
- UI: React 19 + TypeScript
- Design system: MUI 6 + Emotion
- i18n: i18next + react-i18next, Japanese and English
- Markdown: `marked` at build time only
- Quality: Playwright + axe-core, Lighthouse
- Deploy: Cloudflare Pages Direct Upload via Wrangler and GitHub Actions
- Package manager: pnpm 11

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
pnpm quality
```

`pnpm quality` runs formatting/a11y lint, typecheck, build, Playwright + axe-core, and Lighthouse accessibility checks.

Set `PORTFOLIO_SITE_ORIGIN` during production builds to write absolute sitemap URLs. If it is not set, the build falls back to `https://takumi-tokunaga.com`.

```bash
PORTFOLIO_SITE_ORIGIN=https://takumi-tokunaga.com pnpm build
```

## Content

Markdown files live under `content/{ja,en}/{research,projects,experience}`.
Each file begins with frontmatter and an `## Abstract` section. List pages read the frontmatter `abstract` field, while detail pages render the Markdown body during the build.

The content model is limited to Research, Projects, and Experience.

Example project frontmatter:

```yaml
---
title: "Project title"
abstract: "Short abstract shown on list pages."
startDate: "2026-05"
demoUrl: "https://example.com/demo"
links:
  - "[GitHub](https://github.com/example/repo)"
---
```

Project pages show `demoUrl`, or a link whose label/kind is `demo` / `experience` / `trial` / `preview` / `play`, as the primary demo link. Link metadata can be written as Markdown links or as `{ label, url }` objects.

Markdown body images are stored under `public/images/{collection}/{slug}/`, where `slug` is the Markdown filename without `.md`. Relative image paths in Markdown are rewritten to that folder at build time.

```markdown
![Screenshot](screenshot.webp)
```

YouTube URLs written as a standalone line in the Markdown body are converted at build time into privacy-enhanced `youtube-nocookie.com` embeds. YouTube links in frontmatter `links:` remain normal external links.

Example experience frontmatter:

```yaml
---
title: "Institution"
organization: "Institution"
role: "Role"
abstract: "Short abstract shown on the timeline."
startDate: "2026-04-01"
endDate: "2028-03-31"
experienceType: "education"
---
```

Experience frontmatter uses `startDate` and optional `endDate` as the source of truth. The build generates month-level labels and period text from those dates. If `endDate` is empty, the UI displays Present. If `endDate` is in the future at build time, the generated end label is marked as planned/expected.
Set `experienceType` to `education`, `work`, or `community` to control the timeline dot color.

## Deploy

Cloudflare Pages is used as a Direct Upload project. GitHub Actions builds `dist/` and uploads it with Wrangler; Cloudflare Git integration is not used.

| Setting                  | Value                          |
| ------------------------ | ------------------------------ |
| Cloudflare Pages project | `takumi-tokunaga`              |
| Deployment method        | Direct Upload                  |
| GitHub workflow          | `.github/workflows/deploy.yml` |
| Build output directory   | `dist`                         |
| Production branch        | `main`                         |
| Custom domain            | `takumi-tokunaga.com`          |
| Production origin        | `https://takumi-tokunaga.com`  |

GitHub repository secrets:

| Secret                  | Purpose                                         |
| ----------------------- | ----------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID                           |
| `CLOUDFLARE_API_TOKEN`  | API token with Cloudflare Pages edit permission |
