# Incremental English blog translation

The Japanese mirror remains the source of truth. The optional `.github/workflows/translate-blog.yml` workflow records generated English in a **bot audit PR**. With explicitly authorized automatic publication enabled, it publishes only the validated generated-data commit and starts the existing production checks; otherwise the PR stays a draft. The normal Cloudflare Pages workflow stays independent, so quota exhaustion, a missing key, or a translation failure cannot block Japanese publication.

## Initial scope and privacy

The initial pilot is deliberately limited to these exact public articles:

- `2025-12-25-git-branch-splitting`: a short VS Code/Git tutorial
- `2026-02-03-debezium-cdc-introduction`: a technical article covering headings, a table, links, and Zenn directives

The workflow rejects other slugs, duplicate slugs, and an empty scope. Its default is two articles per run; the hard maximum is three requests, with only two articles currently allowlisted. It does **not** send the whole blog archive. Expanding the pilot requires a reviewed code change to both the CLI and workflow allowlists and a fresh review of what will be transmitted.

Before activation, the owner must review both current source files and approve sending their translatable text to Google's Gemini API. A public URL does not make every article suitable for reuse by an AI service. Device identifiers, personal stories, private correspondence, unpublished material, and health or financial details need separate review. The Quest logcat article was excluded from this pilot because its text contains a device serial number.

The translator submits translatable text with protected code/link placeholders to the official Gemini Interactions REST endpoint. It does not upload images or fetch linked pages. `store: false` is requested, but this is **not** a guarantee that free-tier inputs and outputs are excluded from Google's service-improvement uses or human review. Read the applicable [Gemini API terms](https://ai.google.dev/gemini-api/terms) before enabling this feature.

## Operator setup: disabled until configured

Keep the repository variable `BLOG_TRANSLATION_ENABLED` unset or `false` until the following steps are complete. Merely merging this implementation does not authorize API transmission or configure a key.

1. Review the two pilot sources, the outgoing-data behavior, and the current [Gemini API terms](https://ai.google.dev/gemini-api/terms).
2. In [Google AI Studio](https://aistudio.google.com/), personally create or choose a dedicated Gemini key attached to a **Free Tier project with no linked billing account**. Check the project's actual billing status and the selected model's availability. Do not enable billing, buy credits, or use a paid key as a fallback. See [Google's billing guide](https://ai.google.dev/gemini-api/docs/billing).
3. Enter the key yourself in this repository's **Settings → Secrets and variables → Actions → Secrets**, as `GEMINI_API_KEY`. Do not put it in a chat, issue, workflow YAML, tracked `.env`, log, or shell history. This implementation neither reads nor verifies the stored secret value during setup.
4. Configure the repository variables below. They are operator acknowledgements, not independent verification of the project's billing settings.
5. If PR creation is disabled by repository or organization policy, the owner must decide whether to enable **Allow GitHub Actions to create and approve pull requests** in **Settings → Actions → General → Workflow permissions**. Leave the default workflow token permissions read-only; only the reservation and publisher jobs request `contents: write` and `pull-requests: write`. This workflow does not approve PRs. Do not introduce a personal access token to bypass the setting.
6. Run **Translate blog to English** manually on `main` with the two default pilot slugs and `maxArticles: 2`. Verify the two initial results, audit PR and production smoke before considering broader scope.

| Repository configuration                        | Initial value                     | Meaning                                                                                                                                                                                |
| ----------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Secret `GEMINI_API_KEY`                         | `REPLACE_WITH_YOUR_FREE_TIER_KEY` | Owner-entered dedicated free-tier key; scoped to the API step only                                                                                                                     |
| Variable `BLOG_TRANSLATION_ENABLED`             | `false`                           | Exact `true` enables the workflow on `main`                                                                                                                                            |
| Variable `BLOG_TRANSLATION_AUTO_PUBLISH`        | unset                             | Exact `true` authorizes automatic publication after full checks; unset keeps review drafts                                                                                             |
| Variable `BLOG_TRANSLATION_ALLOW_API`           | unset                             | Exact `1` confirms approval to transmit the reviewed pilot text to Google                                                                                                              |
| Variable `BLOG_TRANSLATION_FREE_TIER_CONFIRMED` | unset                             | Exact `1` confirms the owner checked the key's unbilled Free Tier project                                                                                                              |
| Secret `GEMINI_TRANSLATION_MODEL`               | `gemini-3.5-flash-lite`           | Non-sensitive model setting (a Secret here at the owner’s request); only the reviewed model is allowed: `gemini-3.5-flash-lite`; other values fail closed until a reviewed code change |

With `BLOG_TRANSLATION_ENABLED=true` but either acknowledgement missing, all automation jobs remain skipped. A placeholder key is rejected locally before any API request. The model Secret takes precedence over a same-name Actions variable, then the reviewed default. A supplied key alone cannot enable transmission. The code cannot infer whether Google has billing attached to a key, so the free-tier check must be made by the operator and repeated if the key or project changes.

## Local planning and intentionally authorized execution

Node 24 or newer is required. These planning commands do not use the Gemini key or send requests:

```bash
# Inspect pending work in the fixed pilot; no API requests.
node scripts/translate-blog.mjs plan

# Inspect only the proposed public pilot.
node scripts/translate-blog.mjs plan \
  --slugs 2025-12-25-git-branch-splitting,2026-02-03-debezium-cdc-introduction
```

The `run` command is intentionally a separate operation. Use it only after the owner approves the specified articles, with a securely supplied key and the two acknowledgement environment variables already set:

```bash
node scripts/translate-blog.mjs run \
  --slugs 2025-12-25-git-branch-splitting,2026-02-03-debezium-cdc-introduction \
  --max-articles 2
```

The CLI writes a sanitized report to `reports/blog-translation-summary.json`. Its categories include `generated`, `unchanged`, `manual`, `waiting`, `failed`, `deleted`, and `pending`; these are local diagnostics, not additional content to publish. Failure reasons exclude provider response bodies and key values. No live API test is needed for the mock-based test suite.

## What changes and what stays pending

Successful results update only `content/en/blog/<slug>.md` and `translations/blog-en-state.json`. The state records source/output identity and generation metadata so unchanged work is skipped and manually edited English is protected. A generated English file's `translationSourceHash` must match the exact raw Japanese source bytes for the build to expose it. A modified or deleted source immediately hides its stale generated English route and listing entry on the next build, even if the API is unavailable. Human-authored English is handled separately from machine-generated files.

Publication requires the complete `pnpm build` pipeline, whose client build cleans `dist` before generating HTML and AI-readable Markdown. Do not deploy a directory produced only by rerunning an individual build script: files removed from the source tree may otherwise remain in an old output directory. Withholding a current page does not erase Git history, prior deployments, or copies held elsewhere.

Both mirrored Japanese and translated English blog Markdown are deliberately excluded from repository-wide Prettier formatting. Embedded code must remain byte-identical to its source; an automatic Markdown formatter could rewrite those code blocks. Structural and content-security validation still applies, and the JSON state remains formatted.

### Bounded, durable free-tier retries

After merge to `main` and explicit activation, a schedule checks the queue at minute 17 of each hour (GitHub can delay or omit scheduled runs). Only due, reviewed articles are attempted. Successful unchanged articles are cached and skipped. There is no promise of eventual success when the provider keeps rejecting requests.

- Each reviewed pilot article receives **at most five total attempts per Japanese synchronization push**, including the initial request. Trusted preparation derives the budget window from the latest commit touching `content/ja/blog`, accepting only the canonical GitHub Actions bot author/committer and `sync: import published Zenn articles from <source SHA>` subject. A later synchronization push opens one fresh window even when that pilot article's input has not changed. Manual dispatches, hourly runs, reruns, configuration changes and English publication commits reuse that source window and cannot renew an exhausted allowance. Legacy CLI execution without a trusted window retains the five-attempt limit per exact source hash + model + prompt version.
- A separate no-Gemini-key job commits an attempt reservation to the draft branch **before** the read-only API job starts. A cancelled runner, expired result artifact, failed verification or failed publication still consumes the reserved attempt. A reservation may conservatively count even if the runner never reaches Google.
- Transient `429`, `408`, `5xx`, timeout and network failures wait 1, 2, 4, then 8 hours plus up to five minutes of jitter. `Retry-After` and structured `RetryInfo` can only lengthen that delay. There is no immediate retry loop.
- A recognized daily quota waits until after the next midnight in `America/Los_Angeles`, including DST. Shared quota responses pause remaining articles for that run; other article-specific failures do not erase successful results.
- Invalid credentials/client requests (`400`, `401`, `402`, `403`), rejected output, and the fifth unsuccessful attempt stop that window and produce a visible Actions warning and sanitized summary. Five is a cumulative ceiling, not a promise of five immediate requests: rejected output still fails closed, and manual validation recovery remains bounded within the current window. Changing the key alone does not reset attempts.
- State (`attemptCount`, `inputHash`, `nextAttemptAt`, reservation ID, sanitized reason, `budgetWindow`) is preserved in `translations/blog-en-state.json` on `automation/blog-en-translation`. Opening a window archives the previous sanitized entry in `budgetHistory`, retaining its actual attempt count, hashes, model/prompt/protocol and failure diagnostics; an exhausted five-attempt entry remains recorded even after a new window succeeds on attempt one. The API job must match the durably reserved window. State-only draft PRs are intentional: they keep retries durable when every article is waiting. No raw provider body, key, or prompt is stored in state.

No paid fallback, alternate provider, billing upgrade or Batch API is used. `maxArticles` remains a per-run cap (default two, hard maximum three), not a billing guard. The operator must use an unbilled Free Tier project. Current limits are project- and model-specific and must be checked in AI Studio; no fixed free RPM/RPD is assumed. See [Google’s retry guidance](https://ai.google.dev/gemini-api/docs/troubleshooting), [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits), and [model pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite).

The schedule is inactive while this feature exists only in a PR: [GitHub schedules use the default branch](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule). Merging alone still leaves every job disabled until the three operator gates above are configured. Source edits to the allowlist are also reconsidered on a qualifying `main` push. Other articles remain excluded.

## Draft branch, permissions, and human edits

The stable branch is `automation/blog-en-translation`. Runs are serialized rather than cancelled midway through an API call. The reservation, read-only API, and publication jobs use trusted `main` code and can reuse generated files from an untouched, bot-authored draft. It validates the exact paths and regular file modes. The API job never checks out or executes code from the generated branch. Write jobs load their trusted helper before switching branches and execute no generated content.

Before bundling, a separate step without the Gemini secret runs lint, typecheck, unit tests, build, blog verification, performance budgets, browser accessibility tests and all-route Lighthouse. The separate publisher receives only a same-run data artifact, verifies its allowlisted paths and SHA-256 digests, and never executes generated Markdown. It has no Gemini secret. It checks that `main` still matches the source snapshot and that the draft head has not changed, merges current `main` into the draft when needed, and uses an ordinary fast-forward push. There are no force pushes.

A human commit, unexpected path, changed output on `main`, merge conflict, concurrent branch edit, ready-for-review PR, closed-unmerged PR, or auto-merge setting stops automatic updates for review. Existing PR titles and bodies are preserved. If you want to edit a generated draft, do so: the workflow will leave that branch alone afterward. Resolve or merge it manually before restarting automation. Delete the completed draft branch after merging, especially if you changed its generated content while reviewing or used a squash merge.

If PR creation fails after the branch push, the validated generated files remain on that branch; fix the repository setting, then rerun to propose them without retranslating unchanged content. Never weaken branch protection or expand credential scope solely to make the automation pass.

## CI, source mirroring, and publication

GitHub's token-trigger rules matter in two places:

- A push made with `GITHUB_TOKEN` does not start another `push` workflow. If the `zenn-content` mirror uses that token, its update may not trigger this translation workflow; the next scheduled sweep detects the changed source, or an operator may manually dispatch on updated `main`. An explicitly implemented `workflow_dispatch` from the source-mirroring workflow is another possible future integration; it is not added here.
- A `GITHUB_TOKEN`-created or updated PR produces `pull_request` workflow runs requiring approval for the `opened`, `synchronize`, and `reopened` events. A user with write access should use **Approve workflows to run** on the PR. Do not assume a generated PR has passed checks merely because its branch exists.

This follows the current [GitHub workflow-trigger documentation](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow). Repository and organization policy may impose additional restrictions. The [repository Actions settings guide](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository) describes the PR-creation setting.

### Authorized automatic publication

`BLOG_TRANSLATION_AUTO_PUBLISH=true` enables publication of the allowlisted generated English after the full candidate quality suite. This is an ordinary **fast-forward publication** of the exact validated bot branch to `main`, not a GitHub auto-merge setting or an approving PR review. The draft PR preserves an audit trail; its indirect-merge state is read back after publication.

Before publishing, the job verifies a unique bot-owned draft, no human commits, an exact generated-path allowlist, unchanged output hashes, current source hashes, reviewed model/prompt metadata and the same main snapshot. It refuses publication whenever main has classic protection or any active ruleset; it does not use an administrator bypass. It never changes branch rules or default token permissions. A normal Git push atomically rejects a divergent main update, leaving the candidate for a later safe run. Already-generated pending English is revalidated on the next sweep without another Gemini request.

An empty provenance commit binds the tested content tree to the originating workflow run ID and source SHA. Because a `GITHUB_TOKEN` push does not trigger ordinary push workflows, the existing deploy workflow also listens for completion of this exact translation workflow. Its read-only gate checks the same repository, trusted `main` branch, push/schedule/manual event, successful conclusion, exact workflow path, current-main provenance commit, parent/tree identity, ancestor relationship and generated-only diff. It does **not** download or execute artifacts from the triggering run. Queue-only, failed, fork, PR and unrelated/later-main cases do not use this route.

After that gate, the existing production workflow rebuilds the verified current-main snapshot, repeats its full quality suite, deploys only its own same-run tested artifact, and performs production smoke checks. The final deploy step rejects a main snapshot that became stale after validation. There are no new credentials, no `actions: write` permission, no paid model fallback and no change to deployment credentials.

These validators check structure, links, hashes, publication eligibility and build quality. They **do not guarantee semantic translation accuracy**. The owner can inspect every English result and disable automatic publication independently while retaining the bounded queue.

In draft-only mode, inspect the English text, attribution and source hashes, approve applicable PR workflows and use the normal human review/merge process. Protected branches remain in that normal process; a blocked policy is reported instead of bypassed.

## Stop and recover

- Set `BLOG_TRANSLATION_AUTO_PUBLISH=false` to stop automatic publication while retaining draft generation. Set `BLOG_TRANSLATION_ENABLED=false` to stop all future translation jobs. Remove the API acknowledgement variables as an additional guard. If a run is already active, cancel it explicitly; disabling a variable cannot recall a request already sent to Google.
- For incorrect draft output, keep the PR unmerged and review or close it. Preserve human edits; do not force-reset the branch. Closing without merging pauses further proposals, even if its branch is deleted. To resume that proposal, restore its branch if necessary and explicitly reopen its PR as a draft. A replacement branch requires a reviewed workflow change.
- For incorrect published English, revert the relevant English/state changes through the normal reviewed deployment path. Do not edit the mirrored Japanese source here; fix it in `zenn-content`.
- For a stale-source refusal, rerun on current `main`. The build's raw-source hash check also protects the short interval between the final freshness check and the branch push.
- For quota/provider failures, inspect the sanitized summary and let due retries run within the five-attempt limit. For terminal schema, credentials or validation failures, review and fix the cause before an explicit state reset. Never delete state just to bypass the retry cap. Japanese publication remains independent.

### Diagnosing a rejected model output

An `output_validation` result now includes a fixed `validationCode` such as `numbers_body`, `marker_count`, or `markdown_structure`. No assertion actual/expected values, response text or provider error body is recorded. All validators remain enforced.

For a future `abstract_format` rejection, `abstractDiagnostics` records only the assembled abstract's character count and fixed booleans for the 1,600-character limit, line breaks, and angle brackets. The original `validationCode` remains `abstract_format` for existing state and reporting. Older failures cannot be classified retrospectively without the rejected output, which is intentionally not retained. These diagnostics do not relax the validator or permit a sixth request within the same budget window.

Within an existing window, only a deliberate manual dispatch with `retryValidation: true` may reserve one more attempt for an output-validation rejection. It preserves the existing attempt count and never permits a sixth request in that window. Scheduled runs ignore this option; credential/request errors, human edits, and other terminal failures cannot be reopened by it. A subsequent trusted Japanese synchronization push creates a separate allowance and retains the prior history. Successful current-hash translations, including the cached Debezium pilot, remain skipped without regeneration.

### Locked-segment response protocol

The `locked-segments-v1` protocol returns an ordered array of translated text segments. The request includes the entire masked article as context, but trusted code alone reassembles the original protected code/link/name boundaries and their whitespace. Missing/extra segments or model-supplied markers are rejected. All existing numeric, language, Markdown, metadata, source and publication checks still apply after reassembly.

This is a transport repair to the existing `blog-en-v1` semantic translation contract. It deliberately retains the existing input hash and attempt allowance; it does not reset the five-attempt cap or regenerate cached successful articles. New generated state/frontmatter records the protocol version. An operator recovering the Git pilot should manually select only `2025-12-25-git-branch-splitting`, `maxArticles: 1`, and `retryValidation: true`; the successful Debezium article remains unchanged.

The `locked-segments-v2` transport additionally protects numeric literals in all three fields and product names in the title/abstract. Complete field context accompanies the indexed prose arrays. Trusted reassembly preserves the original values without relying on the model to reproduce digits rather than English number words; the unchanged numeric validator still rejects added or altered numbers. It retains the same cumulative attempt allowance and cached-success behavior.

The final `locked-segments-v3` refinement uses the provider's documented `prefixItems` tuple schemas to describe each fragment separately and constrain literal/empty fragments with `enum`. It does not assume unsupported string-pattern enforcement. Returned prose segments cannot contain new ASCII digits; a segment-number diagnostic distinguishes this from a later numeric-boundary mismatch. Failure telemetry contains only fixed field names and expected-token/returned-digit counts, never response text or numeric values. The original five-attempt allowance is unchanged.
