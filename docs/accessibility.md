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

- Every prerendered route in `dist/**/index.html` and `/404.html` is covered by axe-core.
- Prerendered HTML is checked before hydration for route-specific title, description, OGP, canonical, and H1.
- Keyboard checks cover the skip link and navigation drawer focus restoration.
- Header targets are measured for a 44px minimum touch area.
- Markdown images are checked for non-empty `alt` text and successful loading.
- Representative hydrated routes are checked for React hydration mismatch warnings.
- Lighthouse accessibility reports are written to `.accessibility-reports/lighthouse`.

## Manual Checks

- Tab once from the top of the page: the skip link should appear.
- Open the hamburger menu with the keyboard: focus should move into the menu and Escape should return focus to the menu button.
- Check light and dark OS appearances: browser chrome color and page colors should follow the system setting.
- Confirm external links communicate that they open in a new tab through accessible names.
- Confirm newly added Markdown media uses useful alt text and does not rely on color alone for meaning.
- Forms, modals, tabs, dropdowns, and toast interactions are not currently part of the site. Add focused keyboard and screen-reader checks before introducing them.
