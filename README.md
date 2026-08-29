# Portfolio

Personal portfolio built with Vite 8 MPA mode, React 19, TypeScript, MUI 6, Emotion, i18next, and build-time Markdown prerendering.

## Stack

- Build: Vite 8, nine HTML shells, build-time prerender
- UI: React 19 + TypeScript
- Design system: MUI 6 + Emotion
- i18n: i18next + react-i18next, Japanese and English
- Markdown: `marked` at build time only
- Quality: Playwright + axe-core, Lighthouse, and file-size budgets
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

`pnpm quality` runs formatting/a11y lint, typecheck, unit security/middleware tests, build, Playwright + axe-core, and Lighthouse accessibility checks.

`pnpm budget` checks every route's JavaScript graph from the Vite manifest: common static assets, its pre-hydration Markdown detail chunk, and Contact's mount-time Firebase preload when applicable. It writes the common/automatic breakdown to `reports/performance-budget.json`; change its limits only with a new measured baseline.

Node 24 is the minimum supported runtime and CI baseline (`.node-version`); local development may use a newer compatible Node release.

Set `PORTFOLIO_SITE_ORIGIN` during production builds to write absolute sitemap URLs. If it is not set, the build falls back to `https://takumi-tokunaga.com`.

```bash
PORTFOLIO_SITE_ORIGIN=https://takumi-tokunaga.com pnpm build
```

## Content

Markdown files live under `content/{ja,en}/{research,projects,experience,blog}`.
Each file begins with frontmatter and an `## Abstract` section. List pages read the frontmatter `abstract` field, while detail pages render the Markdown body during the build.

Blog posts are generated from the sibling `zenn-content` repository. Do not edit
`content/ja/blog` or `public/images/blog` directly; they are mirrored on the next
`zenn-content` push.

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

Cloudflare Pages is used as a Direct Upload project. GitHub Actions builds and verifies `dist/` once, uploads that tested artifact, then the deploy job downloads and uploads the same bytes with Wrangler; Cloudflare Git integration is not used.

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

| Secret                  | Purpose                                           |
| ----------------------- | ------------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID                             |
| `CLOUDFLARE_API_TOKEN`  | API token with Cloudflare Pages edit permission   |
| `VITE_FIREBASE_API_KEY` | Firebase browser configuration used at build time |

Repository variables consumed by the production build are `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, and `VITE_TRIAL_AUTH_API_ORIGIN`.

The optional Claude PR review uses the `claude-security-review` GitHub Environment. Keep `CLAUDE_API_KEY` only as a secret in that environment, never as a repository secret. The repository variable `CLAUDE_SECURITY_REVIEW_ENABLED` is the explicit feature switch: leave it at `false` until the environment secret is configured and an intentional owner PR has verified the approval gate. As last verified on 2026-08-30, the environment exists with the repository owner as its required reviewer, the environment secret is not configured, and the switch is `false`.

See [the deployment and rollback runbook](docs/deployment-and-rollback.md) for the production-only smoke check, rollback procedure, and the protected `claude-security-review` environment.
