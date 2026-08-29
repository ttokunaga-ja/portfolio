# Deployment and rollback

## Delivery contract

`.github/workflows/deploy.yml` runs build and verification for pull requests, pushes to `main`, and manual runs. Only `main` (including manual runs explicitly dispatched on `main`) can deploy and run the production smoke test. The build job creates `dist/` once, runs the local checks, and retains the tested site artifact for seven days. The deploy job downloads that artifact and invokes the lockfile-pinned Wrangler binary; it does not rebuild the site.

The workflow then smoke-checks `/`, `/experience/rione/`, `/en/experience/rione/`, `/robots.txt`, and `/sitemap.xml` at `https://takumi-tokunaga.com`, with five bounded retries. It verifies route-specific HTML title, canonical URL, and page marker rather than accepting a fallback 200 response; `robots.txt` and `sitemap.xml` also require their expected content types and unique bodies. This check is production-only and is intentionally not run locally.

## Rollback

1. Open Cloudflare Dashboard → Workers & Pages → `takumi-tokunaga` → Deployments.
2. Select the last known-good production deployment and use **Rollback**.
3. Confirm the production URL and the five smoke routes above return successfully.
4. Record the failed GitHub Actions run, the Cloudflare deployment identifier, and the reason for rollback before making a corrective commit.

Cloudflare dashboard rollback and a live production smoke request require the production account and are therefore not part of local validation.

## Secret boundary

`pr-security.yml` deliberately uses `pull_request`, not `pull_request_target`. The Claude review job can run only when both the PR branch repository and PR author match the personal repository owner. It also uses the GitHub Environment named `claude-security-review`; configure that environment with required reviewers and keep `CLAUDE_API_KEY` as an environment secret. Do not grant that secret to repository-wide PR jobs.

All checkouts set `persist-credentials: false`. Cloudflare credentials are exposed only to the `main` deployment job.
