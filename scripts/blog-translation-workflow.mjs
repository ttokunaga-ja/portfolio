import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function prepare_translation() {
  // BEGIN prepare-translation
  const pilot = ["2025-12-25-git-branch-splitting", "2026-02-03-debezium-cdc-introduction"];
  const allowedPaths = new Set([
    "translations/blog-en-state.json",
    ...pilot.map((slug) => `content/en/blog/${slug}.md`)
  ]);
  const pushed = process.env.GITHUB_EVENT_NAME !== "workflow_dispatch";
  const slugs = (pushed ? pilot.join(",") : process.env.INPUT_SLUGS).split(",").map((slug) => slug.trim());
  const max = Number(pushed ? 2 : process.env.INPUT_MAX);
  if (!slugs.length || slugs.some((slug) => !pilot.includes(slug)) || new Set(slugs).size !== slugs.length) {
    throw new Error(
      "Select distinct exact slugs from the reviewed two-article pilot; broad or empty scopes are rejected."
    );
  }
  if (!Number.isInteger(max) || max < 1 || max > 3) throw new Error("maxArticles must be an integer from 1 to 3.");
  const branch = "automation/blog-en-translation";
  const gitEnv = {
    ...process.env,
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
    GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${process.env.GH_TOKEN}`).toString("base64")}`
  };
  const git = (...args) =>
    execFileSync("git", args, { env: gitEnv, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 }).trim();
  const remote = (name) => git("ls-remote", "--heads", "origin", `refs/heads/${name}`).split(/\s+/)[0] || null;
  if (remote("main") !== process.env.GITHUB_SHA)
    throw new Error("main advanced; rerun on its newest commit before translating.");
  const branchSha = remote(branch);
  const prs = JSON.parse(
    execFileSync(
      "gh",
      [
        "pr",
        "list",
        "--repo",
        process.env.GITHUB_REPOSITORY,
        "--head",
        branch,
        "--base",
        "main",
        "--state",
        "all",
        "--limit",
        "100",
        "--json",
        "number,author,isDraft,autoMergeRequest,state,mergedAt"
      ],
      { encoding: "utf8" }
    )
  );
  const latest = [...prs].sort((a, b) => b.number - a.number)[0];
  if (latest?.state === "CLOSED" && !latest.mergedAt)
    throw new Error("The previous translation PR was closed without merging; preserve that decision.");
  const openPrs = prs.filter((pr) => pr.state === "OPEN");
  if (
    openPrs.length > 1 ||
    openPrs.some(
      (pr) =>
        (pr.author.login !== "app/github-actions" && pr.author.login !== "github-actions[bot]") ||
        !pr.isDraft ||
        pr.autoMergeRequest
    )
  ) {
    throw new Error(
      "The existing PR is human-owned, ready for review, or has auto-merge enabled; preserve it and resolve manually."
    );
  }
  if (branchSha) {
    git("fetch", "--no-tags", "origin", `refs/heads/${branch}`);
    if (git("rev-parse", "FETCH_HEAD") !== branchSha)
      throw new Error("Draft branch changed during preparation; rerun.");
    const commits = git("rev-list", `${process.env.GITHUB_SHA}..${branchSha}`).split("\n").filter(Boolean);
    for (const commit of commits) {
      const identity = git("show", "-s", "--format=%ae%n%ce", commit).split("\n");
      const message = git("show", "-s", "--format=%B", commit);
      if (
        identity.some((email) => email !== "41898282+github-actions[bot]@users.noreply.github.com") ||
        !message.startsWith("chore(blog):") ||
        !message.includes("[blog-translation]")
      ) {
        throw new Error("The draft branch has human or unrecognized commits; do not overwrite them.");
      }
    }
    const changed = git("diff", "--name-only", "--no-renames", `${process.env.GITHUB_SHA}...${branchSha}`)
      .split("\n")
      .filter(Boolean);
    if (changed.some((file) => !allowedPaths.has(file)))
      throw new Error("The draft contains paths outside the generated pilot allowlist.");
    const base = git("merge-base", process.env.GITHUB_SHA, branchSha);
    const changedOnMain = changed.length
      ? git("diff", "--name-only", base, process.env.GITHUB_SHA, "--", ...changed)
          .split("\n")
          .filter(Boolean)
      : [];
    if (changedOnMain.length && git("diff", "--name-only", process.env.GITHUB_SHA, branchSha, "--", ...changedOnMain)) {
      throw new Error("main has changed a draft output; resolve it manually rather than overwriting the edit.");
    }
    for (const file of changed) {
      const entry = git("ls-tree", branchSha, "--", file);
      if (!entry) {
        fs.rmSync(file, { force: true });
        continue;
      }
      if (!entry.startsWith("100644 blob "))
        throw new Error("Only regular non-executable generated files may be reused.");
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, execFileSync("git", ["show", `${branchSha}:${file}`], { maxBuffer: 2 * 1024 * 1024 }));
    }
  }
  fs.mkdirSync("reports", { recursive: true });
  fs.writeFileSync(
    "reports/blog-translation-context.json",
    JSON.stringify(
      { sourceSha: process.env.GITHUB_SHA, branchSha, needsPr: branchSha !== null && !openPrs.length, slugs, max },
      null,
      2
    )
  );
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `slugs=${slugs.join(",")}\nmax=${max}\n`);
  // END prepare-translation
}

export function bundle_translation() {
  // BEGIN bundle-translation
  const context = JSON.parse(fs.readFileSync("reports/blog-translation-context.json", "utf8"));
  const allowed = new Set([
    "translations/blog-en-state.json",
    "content/en/blog/2025-12-25-git-branch-splitting.md",
    "content/en/blog/2026-02-03-debezium-cdc-introduction.md"
  ]);
  const status = execFileSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], { encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
  const files = [];
  for (const entry of status) {
    const file = entry.slice(3);
    if (!allowed.has(file) || !/^( M| D|\?\?) /.test(entry))
      throw new Error("Unexpected working-tree path or change type; nothing will be published.");
    if (entry.startsWith(" D ")) {
      files.push({ path: file, deleted: true });
      continue;
    }
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.size > 2 * 1024 * 1024 || stat.mode & 0o111)
      throw new Error("Generated output is not a bounded, non-executable regular file.");
    const bytes = fs.readFileSync(file);
    if (context.branchSha) {
      const prior = execFileSync("git", ["ls-tree", context.branchSha, "--", file], { encoding: "utf8" }).trim();
      if (prior && prior.startsWith("100644 blob ")) {
        const before = execFileSync("git", ["show", `${context.branchSha}:${file}`], { maxBuffer: 2 * 1024 * 1024 });
        if (bytes.equals(before) && !context.needsPr) continue;
      }
    }
    const destination = path.join("translation-bundle/files", file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, bytes);
    files.push({ path: file, sha256: crypto.createHash("sha256").update(bytes).digest("hex") });
  }
  // A draft-only file removed after source deletion has no diff against
  // main. Carry that deletion explicitly when publishing atop the draft.
  if (context.branchSha) {
    for (const file of allowed) {
      if (files.some((entry) => entry.path === file) || fs.existsSync(file)) continue;
      const prior = execFileSync("git", ["ls-tree", context.branchSha, "--", file], { encoding: "utf8" }).trim();
      if (prior) {
        if (!prior.startsWith("100644 blob ")) throw new Error("Invalid previous generated file mode.");
        files.push({ path: file, deleted: true });
      }
    }
  }
  fs.mkdirSync("translation-bundle", { recursive: true });
  fs.writeFileSync("translation-bundle/manifest.json", JSON.stringify({ ...context, files }, null, 2));
  // Persist state-only reservations and quota results so retries survive runs.
  const hasChanges = files.length > 0;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `has_changes=${hasChanges}\n`);
  // END bundle-translation
}

export function publish_translation() {
  // BEGIN publish-translation
  const pilot = ["2025-12-25-git-branch-splitting", "2026-02-03-debezium-cdc-introduction"];
  const allowed = new Set(["translations/blog-en-state.json", ...pilot.map((slug) => `content/en/blog/${slug}.md`)]);
  const root = process.env.BUNDLE_ROOT;
  const manifestPath = path.join(root, "manifest.json");
  const manifestStat = fs.lstatSync(manifestPath);
  if (!manifestStat.isFile() || manifestStat.size > 64 * 1024) throw new Error("Invalid manifest file.");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (
    manifest.sourceSha !== process.env.GITHUB_SHA ||
    !/^[0-9a-f]{40}$/.test(manifest.sourceSha) ||
    (manifest.branchSha !== null && !/^[0-9a-f]{40}$/.test(manifest.branchSha)) ||
    !Array.isArray(manifest.slugs) ||
    !manifest.slugs.length ||
    manifest.slugs.some((slug) => !pilot.includes(slug)) ||
    !Array.isArray(manifest.files) ||
    !manifest.files.length ||
    manifest.files.length > allowed.size
  )
    throw new Error("Invalid translation manifest.");
  const seen = new Set();
  // Validate every byte before touching the repository or publishing.
  for (const item of manifest.files) {
    if (!allowed.has(item.path) || seen.has(item.path)) throw new Error("Unexpected or duplicate generated path.");
    seen.add(item.path);
    if (item.deleted === true) continue;
    const input = path.join(root, "files", item.path);
    for (let parent = input; parent !== root; parent = path.dirname(parent)) {
      if (fs.lstatSync(parent).isSymbolicLink()) throw new Error("Symlink in generated data.");
    }
    const stat = fs.lstatSync(input);
    if (!stat.isFile() || stat.size > 2 * 1024 * 1024) throw new Error("Invalid generated file.");
    const digest = crypto.createHash("sha256").update(fs.readFileSync(input)).digest("hex");
    if (digest !== item.sha256) throw new Error("Generated file digest mismatch.");
  }
  const branch = "automation/blog-en-translation";
  const gitEnv = {
    ...process.env,
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
    GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${process.env.GH_TOKEN}`).toString("base64")}`
  };
  const git = (...args) =>
    execFileSync("git", args, { env: gitEnv, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 }).trim();
  const remote = (name) => git("ls-remote", "--heads", "origin", `refs/heads/${name}`).split(/\s+/)[0] || null;
  const assertFresh = () => {
    if (remote("main") !== manifest.sourceSha)
      throw new Error("main advanced while translating; rerun on current main.");
    if (remote(branch) !== manifest.branchSha)
      throw new Error("The draft branch changed; preserve the concurrent edit and rerun.");
  };
  const openPrs = () =>
    JSON.parse(
      execFileSync(
        "gh",
        [
          "pr",
          "list",
          "--repo",
          process.env.GITHUB_REPOSITORY,
          "--head",
          branch,
          "--base",
          "main",
          "--state",
          "all",
          "--limit",
          "100",
          "--json",
          "number,author,isDraft,autoMergeRequest,state,mergedAt"
        ],
        { encoding: "utf8" }
      )
    );
  const assertDraft = () => {
    const history = openPrs();
    const latest = [...history].sort((a, b) => b.number - a.number)[0];
    if (latest?.state === "CLOSED" && !latest.mergedAt)
      throw new Error("The previous translation PR was closed without merging; preserve that decision.");
    const prs = history.filter((pr) => pr.state === "OPEN");
    if (
      prs.length > 1 ||
      prs.some(
        (pr) =>
          (pr.author.login !== "app/github-actions" && pr.author.login !== "github-actions[bot]") ||
          !pr.isDraft ||
          pr.autoMergeRequest
      )
    ) {
      throw new Error("Preserve the existing human-owned/ready/auto-merge PR; manual review is required.");
    }
    return prs;
  };
  assertFresh();
  assertDraft();
  git("config", "user.name", "github-actions[bot]");
  git("config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com");
  if (manifest.branchSha) {
    git("fetch", "--no-tags", "origin", `refs/heads/${branch}`);
    if (git("rev-parse", "FETCH_HEAD") !== manifest.branchSha) throw new Error("Draft changed during fetch.");
    git("checkout", "-b", branch, manifest.branchSha);
    git("merge", "--no-edit", "-m", "chore(blog): refresh translation base [blog-translation]", manifest.sourceSha);
  } else {
    git("checkout", "-b", branch, manifest.sourceSha);
  }
  for (const item of manifest.files) {
    // The trusted checkout must not redirect an allowed output elsewhere.
    for (let parent = item.path; parent !== "."; parent = path.dirname(parent)) {
      if (fs.existsSync(parent) && fs.lstatSync(parent).isSymbolicLink()) throw new Error("Symlink in output path.");
    }
    if (item.deleted === true) fs.rmSync(item.path, { force: true });
    else {
      fs.mkdirSync(path.dirname(item.path), { recursive: true });
      fs.writeFileSync(item.path, fs.readFileSync(path.join(root, "files", item.path)), { mode: 0o644 });
      fs.chmodSync(item.path, 0o644);
    }
  }
  git("add", "--", ...manifest.files.map((item) => item.path));
  if (git("diff", "--cached", "--name-only")) {
    git(
      "commit",
      "-m",
      `chore(blog): update English pilot [blog-translation]\n\nJapanese source: ${manifest.sourceSha}`
    );
  }
  const finalPaths = git("diff", "--name-only", "--no-renames", `${manifest.sourceSha}...HEAD`)
    .split("\n")
    .filter(Boolean);
  if (finalPaths.some((file) => !allowed.has(file)))
    throw new Error("Refuse to publish changes outside generated translation data.");
  assertFresh();
  const prs = assertDraft();
  // No force push, no auto-merge, no execution of downloaded content.
  git("push", "origin", `HEAD:refs/heads/${branch}`);
  if (!finalPaths.length) {
    console.log("Removed obsolete draft changes; no new PR is needed.");
    process.exit(0);
  }
  if (!prs.length) {
    const body =
      "## English blog pilot\n\nGenerated English text, retry reservations and hash state only. A state-only draft is expected while a free-tier request is waiting. Review accuracy, preserved code/URLs/images, and current Japanese source hashes.\n\n" +
      "Approve the GitHub Actions workflow runs on this PR, then require the normal quality checks before a human merge. This automation never merges or deploys.\n\n" +
      `Source snapshot: ${manifest.sourceSha}\n\nSee docs/blog-translation.md for review, quota, and rollback instructions.`;
    execFileSync(
      "gh",
      [
        "pr",
        "create",
        "--repo",
        process.env.GITHUB_REPOSITORY,
        "--draft",
        "--head",
        branch,
        "--base",
        "main",
        "--title",
        "chore(blog): review English translation pilot",
        "--body",
        body
      ],
      { stdio: "inherit" }
    );
  } else {
    console.log(`Updated draft PR #${prs[0].number}; its human-edited title and body were preserved.`);
  }
  // END publish-translation
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const commands = { prepare: prepare_translation, bundle: bundle_translation, publish: publish_translation };
  const command = commands[process.argv[2]];
  if (!command) throw new Error("Unknown trusted workflow operation");
  command();
}
