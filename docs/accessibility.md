# Accessibility Checks

This site targets WCAG 2.2 AA for the public portfolio pages.

## Commands

| Command                | Purpose                                                               |
| ---------------------- | --------------------------------------------------------------------- |
| `pnpm lint`            | Prettier check and JSX accessibility lint                             |
| `pnpm typecheck`       | Build content and run TypeScript                                      |
| `pnpm test:a11y`       | Playwright + axe-core route checks                                    |
| `pnpm a11y:lighthouse` | Lighthouse accessibility reports for all built routes and `/404.html` |
| `pnpm quality`         | Full local quality gate                                               |

## Regression Coverage

- Primary routes, one generated experience detail route, and `/404.html` are covered by axe-core.
- Prerendered HTML is checked before hydration for route-specific title, description, OGP, canonical, and H1.
- Keyboard checks cover the skip link and navigation drawer focus restoration.
- Header targets are measured for a 44px minimum touch area.
- Lighthouse accessibility reports are written to `.accessibility-reports/lighthouse`.

## Manual Checks

- Tab once from the top of the page: the skip link should appear.
- Open the hamburger menu with the keyboard: focus should move into the menu and Escape should return focus to the menu button.
- Check light and dark OS appearances: browser chrome color and page colors should follow the system setting.
- Confirm external links communicate that they open in a new tab through accessible names.
