# Deployment and rollback

## Delivery contract

`.github/workflows/deploy.yml` runs build and verification for pull requests, pushes to `main`, and manual runs. Only `main` (including manual runs explicitly dispatched on `main`) can deploy and run the production smoke test. The build job creates `dist/` once, runs the local checks, and retains the tested site artifact for seven days. The deploy job downloads that artifact and invokes the lockfile-pinned Wrangler binary; it does not rebuild the site.

The workflow then smoke-checks `/`, the Japanese and English Ri-one and Marugame Kyudo Club pages, `/robots.txt`, and `/sitemap.xml` at `https://takumi-tokunaga.com`, with five bounded retries. It verifies route-specific HTML title, canonical URL, and page marker rather than accepting a fallback 200 response; `robots.txt` and `sitemap.xml` also require their expected content types and unique bodies. The experience-page checks reject their retired filenames while confirming the intended remaining content. Body-discarding GET checks require canonical retired asset URLs and their query, repeated-slash, percent-encoded, case, and applicable legacy-extension variants to return an empty `410` on the first hop with `Cache-Control: no-store, max-age=0` and no image content type. Known-good Ri-one and Kyudo practice images must still return non-empty image responses with the established bounded cache directives. Diagnostics record the commit SHA, deployment URL where available, response-header hashes, header sizes, status, type, and byte counts; no retired response body is saved. This check is production-only and is intentionally not run locally.

Exact retired paths are `410` middleware tombstones with `no-store`; unrelated `/images/*` files retain the existing bounded public cache policy. Future security-sensitive or frequently replaced media should use content-hashed filenames (for example, `/images/photo.a1b2c3.webp`) with an explicit invalidation plan.

## Rollback

1. Identify the current security-floor deployment: it must include deletion and middleware tombstones for both `rione_expo_pass.JPG` and `marugame-kyudo-club_farewell` (WebP and legacy PNG paths). Never roll back to a deployment older than that floor, even if it otherwise appears healthy.
2. Open Cloudflare Dashboard → Workers & Pages → `takumi-tokunaga` → Deployments. Enumerate all older deployment aliases and remove or disable aliases that point to a deployment predating the security floor.
3. Select the newest known-good deployment at or after the security floor and use **Rollback**.
4. Confirm the production URL, all positive smoke routes, and every retired-asset `410` negative smoke check succeed.
5. Record the failed GitHub Actions run, the Cloudflare deployment identifier, the security-floor deployment identifier, and the reason for rollback before making a corrective commit.

Rollback does not remove already cached or historic data. After deploying the deletion/tombstone, purge the retired filename prefix from the Cloudflare CDN so canonical and query-keyed entries are invalidated, and record the purge result; do not use **Purge Everything**. A CDN purge cannot clear copies already stored in visitor browsers. Removing the file from the current deployment also does not remove it from Git history or other public archive/cache views. History rewriting and host-level cache removal are separate, explicitly approved operations.

Cloudflare dashboard rollback and a live production smoke request require the production account and are therefore not part of local validation.

## Secret boundary

`pr-security.yml` deliberately uses `pull_request`, not `pull_request_target`. The Claude review job can run only when `CLAUDE_SECURITY_REVIEW_ENABLED` is exactly `true` and both the PR branch repository and PR author match the personal repository owner. It also uses the GitHub Environment named `claude-security-review`; configure that environment with required reviewers and keep `CLAUDE_API_KEY` as an environment secret. Do not grant that secret to repository-wide PR jobs. Until the environment-scoped key is present and an intentional owner PR has verified the approval gate, keep the repository variable at `false`; the job then skips instead of failing ordinary PRs.

All checkouts set `persist-credentials: false`. Cloudflare credentials are exposed only to the `main` deployment job.
