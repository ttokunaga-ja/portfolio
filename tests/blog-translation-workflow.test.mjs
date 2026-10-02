import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import test from "node:test";

const workflow = fs.readFileSync(new URL("../.github/workflows/translate-blog.yml", import.meta.url), "utf8");
const slug = "2025-12-25-git-branch-splitting";
const article = `content/en/blog/${slug}.md`;
const branch = "automation/blog-en-translation";
const botEmail = "41898282+github-actions[bot]@users.noreply.github.com";
const helper = fs.readFileSync(new URL("../scripts/blog-translation-workflow.mjs", import.meta.url), "utf8");
const block = (name) => {
  const start = helper.indexOf(`  // BEGIN ${name}\n`);
  const end = helper.indexOf(`  // END ${name}`, start);
  assert.ok(start >= 0 && end > start, `${name} trusted workflow script exists`);
  const imports = helper.slice(0, helper.indexOf("export function"));
  return (
    imports +
    helper
      .slice(start, end)
      .split("\n")
      .map((line) => line.replace(/^ {2}/, ""))
      .join("\n")
  );
};

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "blog-workflow-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const repo = path.join(root, "repo");
  const remote = path.join(root, "origin.git");
  const bin = path.join(root, "bin");
  fs.mkdirSync(repo);
  fs.mkdirSync(bin);
  const env = {
    ...process.env,
    PATH: `${bin}${path.delimiter}${process.env.PATH}`,
    GH_TOKEN: "unit-test-placeholder-not-a-credential",
    GITHUB_REPOSITORY: "fixture/portfolio",
    GITHUB_EVENT_NAME: "workflow_dispatch",
    GITHUB_OUTPUT: path.join(root, "outputs"),
    GIT_AUTHOR_NAME: "Fixture Owner",
    GIT_AUTHOR_EMAIL: "fixture@example.invalid",
    GIT_COMMITTER_NAME: "Fixture Owner",
    GIT_COMMITTER_EMAIL: "fixture@example.invalid",
    GH_TEST_LOG: path.join(root, "gh-log"),
    INPUT_SLUGS: slug,
    INPUT_MAX: "2"
  };
  // Replace gh only inside the fixture PATH; these tests never contact GitHub.
  fs.writeFileSync(
    path.join(bin, "gh"),
    `#!/usr/bin/env node
const fs = require("node:fs");
fs.appendFileSync(process.env.GH_TEST_LOG, JSON.stringify(process.argv.slice(2)) + "\\n");
if (process.argv[2] === "pr" && process.argv[3] === "list") console.log(process.env.GH_TEST_PRS || "[]");
else if (process.argv[2] === "pr" && process.argv[3] === "create") console.log("https://example.invalid/pull/1");
else process.exit(1);
`,
    { mode: 0o755 }
  );
  const git = (...args) =>
    execFileSync("git", ["-c", "core.hooksPath=/dev/null", ...args], {
      cwd: repo,
      env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    }).trim();
  git("init", "--bare", "--initial-branch=main", remote);
  git("init", "--initial-branch=main");
  git("config", "user.name", "Fixture Owner");
  git("config", "user.email", "fixture@example.invalid");
  fs.writeFileSync(path.join(repo, ".gitignore"), "reports/\ntranslation-bundle/\n");
  fs.mkdirSync(path.join(repo, "content/ja/blog"), { recursive: true });
  fs.writeFileSync(path.join(repo, `content/ja/blog/${slug}.md`), "Japanese fixture\n");
  git("add", ".");
  git("commit", "-qm", "Initial source");
  git("remote", "add", "origin", remote);
  git("push", "-qu", "origin", "main");
  env.GITHUB_SHA = git("rev-parse", "HEAD");
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
    fs.writeFileSync(path.join(repo, file), text);
  };
  const commitBot = (message = "chore(blog): update English pilot [blog-translation]") => {
    git("add", ".");
    const original = { ...env };
    Object.assign(env, {
      GIT_AUTHOR_NAME: "github-actions[bot]",
      GIT_AUTHOR_EMAIL: botEmail,
      GIT_COMMITTER_NAME: "github-actions[bot]",
      GIT_COMMITTER_EMAIL: botEmail
    });
    git("commit", "-qm", message);
    Object.assign(env, original);
  };
  const run = (name) =>
    spawnSync(process.execPath, ["--input-type=module", "--eval", block(name)], {
      cwd: repo,
      env,
      encoding: "utf8"
    });
  const makeBundle = ({
    sourceSha = env.GITHUB_SHA,
    branchSha = null,
    file = article,
    text = "English pilot\n"
  } = {}) => {
    const bundle = path.join(root, "bundle");
    const bytes = Buffer.from(text);
    fs.mkdirSync(path.dirname(path.join(bundle, "files", file)), { recursive: true });
    fs.writeFileSync(path.join(bundle, "files", file), bytes);
    const manifest = {
      sourceSha,
      branchSha,
      slugs: [slug],
      max: 2,
      files: [{ path: file, sha256: crypto.createHash("sha256").update(bytes).digest("hex") }]
    };
    fs.writeFileSync(path.join(bundle, "manifest.json"), JSON.stringify(manifest));
    env.BUNDLE_ROOT = bundle;
    // Let the publisher's configured bot identity apply, as it does on Actions.
    delete env.GIT_AUTHOR_NAME;
    delete env.GIT_AUTHOR_EMAIL;
    delete env.GIT_COMMITTER_NAME;
    delete env.GIT_COMMITTER_EMAIL;
    return { bundle, manifest };
  };
  return { root, repo, env, git, write, commitBot, run, makeBundle };
}

const succeeds = (result) => assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
const fails = (result, message) => {
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, message);
};

test("workflow keeps the API read-only, its secret step-scoped, and publication separate", () => {
  assert.match(workflow, /branches: \[main\]/);
  assert.match(workflow, /paths: \["content\/ja\/blog\/\*\*"\]/);
  assert.doesNotMatch(workflow, /pull_request_target:|--force|gh pr merge/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.equal(workflow.match(/secrets\.GEMINI_API_KEY/g)?.length, 1);
  const readJob = workflow.split("  translate:\n")[1].split("  propose:\n")[0];
  const writeJob = workflow.split("  propose:\n")[1];
  const reserveJob = workflow.split("  reserve:\n")[1].split("  translate:\n")[0];
  assert.doesNotMatch(reserveJob, /secrets\.|translate-blog\.mjs run/);
  assert.match(workflow, /cron: "17 \* \* \* \*"/);
  assert.match(readJob, /needs: reserve/);
  assert.doesNotMatch(readJob, /contents: write|pull-requests: write/);
  assert.doesNotMatch(writeJob, /GEMINI_API_KEY|pnpm install|translate-blog\.mjs run/);
  assert.match(helper, /"--draft"/);
  assert.match(readJob, /BLOG_TRANSLATION_ENABLED == 'true'/);
  assert.match(reserveJob, /BLOG_TRANSLATION_ALLOW_API == '1' && vars.BLOG_TRANSLATION_FREE_TIER_CONFIRMED == '1'/);
  for (const action of workflow.matchAll(/uses: (\S+)/g)) {
    assert.match(action[1], /^actions\/[\w-]+@[0-9a-f]{40}$|^pnpm\/action-setup@[0-9a-f]{40}$/);
  }
  for (const name of ["prepare-translation", "bundle-translation", "publish-translation"]) {
    succeeds(spawnSync(process.execPath, ["--input-type=module", "--check"], { input: block(name), encoding: "utf8" }));
  }
});

test("preparation accepts an exact pilot without a prior draft", (t) => {
  const f = fixture(t);
  succeeds(f.run("prepare-translation"));
  const context = JSON.parse(fs.readFileSync(path.join(f.repo, "reports/blog-translation-context.json")));
  assert.deepEqual(context.slugs, [slug]);
  assert.equal(context.branchSha, null);
});

for (const scope of ["", "*", "2025-12-01-quest3s-logcat-windows", `${slug},${slug}`, `${slug},../../secret`]) {
  test(`preparation rejects unreviewed or malformed scope ${JSON.stringify(scope)}`, (t) => {
    const f = fixture(t);
    f.env.INPUT_SLUGS = scope;
    fails(f.run("prepare-translation"), /reviewed two-article pilot/);
  });
}

for (const max of ["0", "4", "2.5", "all", "-1"]) {
  test(`preparation rejects unbounded request count ${max}`, (t) => {
    const f = fixture(t);
    f.env.INPUT_MAX = max;
    fails(f.run("prepare-translation"), /integer from 1 to 3/);
  });
}

test("preparation reuses only generated data from a bot draft", (t) => {
  const f = fixture(t);
  f.git("checkout", "-qb", branch);
  f.write(article, "Prior English\n");
  f.commitBot();
  f.git("push", "-qu", "origin", branch);
  const branchSha = f.git("rev-parse", "HEAD");
  f.git("checkout", "-q", "main");
  succeeds(f.run("prepare-translation"));
  assert.equal(fs.readFileSync(path.join(f.repo, article), "utf8"), "Prior English\n");
  assert.equal(f.git("rev-parse", "HEAD"), f.env.GITHUB_SHA, "trusted main remains checked out");
  const context = JSON.parse(fs.readFileSync(path.join(f.repo, "reports/blog-translation-context.json")));
  assert.equal(context.branchSha, branchSha);
});

test("preparation preserves human commits on a generated branch", (t) => {
  const f = fixture(t);
  f.git("checkout", "-qb", branch);
  f.write(article, "Human review\n");
  f.git("add", ".");
  f.git("commit", "-qm", "Human review changes");
  f.git("push", "-qu", "origin", branch);
  f.git("checkout", "-q", "main");
  fails(f.run("prepare-translation"), /human or unrecognized commits/);
  assert.equal(fs.existsSync(path.join(f.repo, article)), false);
});

test("preparation rejects bot-authored code outside generated paths", (t) => {
  const f = fixture(t);
  f.git("checkout", "-qb", branch);
  f.write("scripts/unexpected.mjs", "throw new Error('must not execute')\n");
  f.commitBot();
  f.git("push", "-qu", "origin", branch);
  f.git("checkout", "-q", "main");
  fails(f.run("prepare-translation"), /outside the generated pilot allowlist/);
});

test("preparation refuses to overwrite output edited on main", (t) => {
  const f = fixture(t);
  f.git("checkout", "-qb", branch);
  f.write(article, "Prior English\n");
  f.commitBot();
  f.git("push", "-qu", "origin", branch);
  f.git("checkout", "-q", "main");
  f.write(article, "Main human English\n");
  f.git("add", ".");
  f.git("commit", "-qm", "Owner translation");
  f.git("push", "-q", "origin", "main");
  f.env.GITHUB_SHA = f.git("rev-parse", "HEAD");
  fails(f.run("prepare-translation"), /main has changed a draft output/);
  assert.equal(fs.readFileSync(path.join(f.repo, article), "utf8"), "Main human English\n");
});

test("bundle includes only generated files and verifies their hashes", (t) => {
  const f = fixture(t);
  succeeds(f.run("prepare-translation"));
  f.write(article, "Generated English\n");
  succeeds(f.run("bundle-translation"));
  const manifest = JSON.parse(fs.readFileSync(path.join(f.repo, "translation-bundle/manifest.json")));
  assert.equal(manifest.files[0].path, article);
  assert.equal(manifest.files[0].sha256, crypto.createHash("sha256").update("Generated English\n").digest("hex"));
});

test("bundle rejects unrelated or executable output", (t) => {
  const f = fixture(t);
  succeeds(f.run("prepare-translation"));
  f.write(article, "Generated English\n");
  fs.chmodSync(path.join(f.repo, article), 0o755);
  fails(f.run("bundle-translation"), /non-executable/);
  fs.chmodSync(path.join(f.repo, article), 0o644);
  f.write("unrelated.txt", "Do not publish\n");
  fails(f.run("bundle-translation"), /Unexpected working-tree path/);
});

test("publisher creates a normal bot branch and draft PR using validated data", (t) => {
  const f = fixture(t);
  f.makeBundle();
  succeeds(f.run("publish-translation"));
  const remoteSha = f.git("ls-remote", "--heads", "origin", `refs/heads/${branch}`).split(/\s+/)[0];
  assert.equal(remoteSha, f.git("rev-parse", "HEAD"));
  assert.equal(f.git("show", "-s", "--format=%ae"), botEmail);
  assert.equal(f.git("diff", "--name-only", `${f.env.GITHUB_SHA}...HEAD`), article);
  const calls = fs.readFileSync(f.env.GH_TEST_LOG, "utf8").trim().split("\n").map(JSON.parse);
  assert.ok(calls.some((call) => call[1] === "create" && call.includes("--draft")));
});

test("publisher rejects artifact tampering before creating a branch", (t) => {
  const f = fixture(t);
  const { bundle } = f.makeBundle();
  fs.writeFileSync(path.join(bundle, "files", article), "Tampered\n");
  fails(f.run("publish-translation"), /digest mismatch/);
  assert.equal(f.git("ls-remote", "--heads", "origin", `refs/heads/${branch}`), "");
});

test("publisher rejects out-of-scope artifact paths", (t) => {
  const f = fixture(t);
  f.makeBundle({ file: "scripts/injected.mjs" });
  fails(f.run("publish-translation"), /Unexpected or duplicate generated path/);
});

test("publisher leaves an advanced main and concurrent draft changes untouched", (t) => {
  const f = fixture(t);
  f.makeBundle();
  f.write("new-source.txt", "new main\n");
  f.git("add", ".");
  f.git("commit", "-qm", "New main change");
  f.git("push", "-q", "origin", "main");
  fails(f.run("publish-translation"), /main advanced while translating/);
  assert.equal(f.git("ls-remote", "--heads", "origin", `refs/heads/${branch}`), "");
  f.env.GITHUB_SHA = f.git("rev-parse", "HEAD");
  f.makeBundle();
  f.git("branch", branch);
  f.git("push", "-q", "origin", branch);
  fails(f.run("publish-translation"), /draft branch changed/);
});

for (const state of ["ready", "closed", "auto-merge"]) {
  test(`publisher preserves a ${state} PR without pushing`, (t) => {
    const f = fixture(t);
    f.makeBundle();
    f.env.GH_TEST_PRS = JSON.stringify([
      {
        number: 10,
        author: { login: "app/github-actions" },
        isDraft: state !== "ready",
        state: state === "closed" ? "CLOSED" : "OPEN",
        mergedAt: null,
        autoMergeRequest: state === "auto-merge" ? {} : null
      }
    ]);
    fails(f.run("publish-translation"), /closed without merging|manual review is required/);
    assert.equal(f.git("ls-remote", "--heads", "origin", `refs/heads/${branch}`), "");
  });
}

test("publisher updates the stable bot draft with a fast-forward merge and preserves its description", (t) => {
  const f = fixture(t);
  f.makeBundle();
  succeeds(f.run("publish-translation"));
  const previous = f.git("rev-parse", "HEAD");
  f.git("checkout", "-q", "main");
  f.git("branch", "-D", branch);
  f.write("README.md", "Trusted main advancement\n");
  f.git("add", ".");
  f.git("commit", "-qm", "Main update");
  f.git("push", "-q", "origin", "main");
  f.env.GITHUB_SHA = f.git("rev-parse", "HEAD");
  f.makeBundle({ branchSha: previous, text: "Updated English\n" });
  f.env.GH_TEST_PRS = JSON.stringify([
    { number: 10, author: { login: "app/github-actions" }, isDraft: true, state: "OPEN", autoMergeRequest: null }
  ]);
  fs.writeFileSync(f.env.GH_TEST_LOG, "");
  succeeds(f.run("publish-translation"));
  f.git("merge-base", "--is-ancestor", previous, "HEAD");
  f.git("merge-base", "--is-ancestor", f.env.GITHUB_SHA, "HEAD");
  assert.equal(f.git("diff", "--name-only", `${f.env.GITHUB_SHA}...HEAD`), article);
  const calls = fs.readFileSync(f.env.GH_TEST_LOG, "utf8").trim().split("\n").map(JSON.parse);
  assert.ok(
    calls.every((call) => call[1] === "list"),
    "existing PR title/body is never edited"
  );
});

test("bundle persists quota-only state for the next scheduled run", (t) => {
  const f = fixture(t);
  succeeds(f.run("prepare-translation"));
  f.write(
    "translations/blog-en-state.json",
    JSON.stringify({ schemaVersion: 1, entries: { [slug]: { status: "wait" } } })
  );
  succeeds(f.run("bundle-translation"));
  assert.match(fs.readFileSync(f.env.GITHUB_OUTPUT, "utf8"), /has_changes=true/);
});

test("workflow verifies translations before the artifact reaches the write job", () => {
  const verification = workflow.indexOf("- name: Verify generated content without the Gemini secret");
  const bundle = workflow.indexOf("- name: Package only allowlisted generated data");
  assert.ok(verification > 0 && bundle > verification);
  const step = workflow.slice(verification, bundle);
  for (const command of ["pnpm typecheck", "pnpm test:unit", "pnpm build", "pnpm check:blog", "pnpm budget"]) {
    assert.ok(step.includes(command));
  }
  assert.doesNotMatch(step, /secrets\.|GH_TOKEN:/);
});

test("draft-only English deletion survives bundle and publication after Japanese source removal", (t) => {
  const f = fixture(t);
  f.makeBundle();
  succeeds(f.run("publish-translation"));
  const draftSha = f.git("rev-parse", "HEAD");
  f.git("checkout", "-q", "main");
  f.git("branch", "-D", branch);
  f.git("rm", `content/ja/blog/${slug}.md`);
  f.git("commit", "-qm", "Remove Japanese source");
  f.git("push", "-q", "origin", "main");
  f.env.GITHUB_SHA = f.git("rev-parse", "HEAD");
  succeeds(f.run("prepare-translation"));
  assert.equal(fs.existsSync(path.join(f.repo, article)), true, "prior draft English was reused");
  // The CLI's exact-hash cleanup removes machine-owned English for a deleted source.
  fs.rmSync(path.join(f.repo, article));
  succeeds(f.run("bundle-translation"));
  const manifest = JSON.parse(fs.readFileSync(path.join(f.repo, "translation-bundle/manifest.json")));
  assert.deepEqual(manifest.files, [{ path: article, deleted: true }]);
  assert.match(fs.readFileSync(f.env.GITHUB_OUTPUT, "utf8"), /has_changes=true/);
  f.env.BUNDLE_ROOT = path.join(f.repo, "translation-bundle");
  f.env.GH_TEST_PRS = JSON.stringify([
    { number: 10, author: { login: "app/github-actions" }, isDraft: true, state: "OPEN", autoMergeRequest: null }
  ]);
  fs.writeFileSync(f.env.GH_TEST_LOG, "");
  succeeds(f.run("publish-translation"));
  const updated = f.git("ls-remote", "--heads", "origin", `refs/heads/${branch}`).split(/\s+/)[0];
  assert.notEqual(updated, draftSha, "the deletion was actually pushed to the draft");
  assert.equal(f.git("ls-tree", updated, "--", article), "", "obsolete English is absent from the remote draft");
  assert.equal(f.git("diff", "--name-only", f.env.GITHUB_SHA, updated), "", "empty draft has current main's tree");
  const calls = fs.readFileSync(f.env.GH_TEST_LOG, "utf8").trim().split("\n").map(JSON.parse);
  assert.ok(
    calls.every((call) => call[1] === "list"),
    "no empty new PR was created"
  );
});

test("a source push uses only the fixed two-article pilot without dispatch inputs", (t) => {
  const f = fixture(t);
  f.env.GITHUB_EVENT_NAME = "push";
  f.env.INPUT_SLUGS = "";
  f.env.INPUT_MAX = "";
  succeeds(f.run("prepare-translation"));
  const context = JSON.parse(fs.readFileSync(path.join(f.repo, "reports/blog-translation-context.json")));
  assert.deepEqual(context.slugs, [slug, "2026-02-03-debezium-cdc-introduction"]);
  assert.equal(context.max, 2);
});

test("a closed-unmerged PR blocks preparation before any translation, even after its branch is deleted", (t) => {
  const f = fixture(t);
  f.env.GH_TEST_PRS = JSON.stringify([
    { number: 10, author: { login: "app/github-actions" }, isDraft: true, state: "CLOSED", mergedAt: null }
  ]);
  fails(f.run("prepare-translation"), /closed without merging/);
  assert.equal(fs.existsSync(path.join(f.repo, "reports/blog-translation-context.json")), false);
});

test("an hourly schedule uses the fixed allowlist and default request cap", (t) => {
  const f = fixture(t);
  f.env.GITHUB_EVENT_NAME = "schedule";
  f.env.INPUT_SLUGS = "";
  f.env.INPUT_MAX = "";
  succeeds(f.run("prepare-translation"));
  const context = JSON.parse(fs.readFileSync(path.join(f.repo, "reports/blog-translation-context.json")));
  assert.deepEqual(context.slugs, [slug, "2026-02-03-debezium-cdc-introduction"]);
  assert.equal(context.max, 2);
});

test("unchanged state on an existing draft produces no repeat commit bundle", (t) => {
  const f = fixture(t);
  const file = "translations/blog-en-state.json";
  const state = JSON.stringify({ schemaVersion: 1, entries: { [slug]: { status: "wait", attemptCount: 1 } } });
  f.makeBundle({ file, text: state });
  succeeds(f.run("publish-translation"));
  f.git("checkout", "-q", "main");
  f.git("branch", "-D", branch);
  f.env.GH_TEST_PRS = JSON.stringify([
    { number: 1, author: { login: "app/github-actions" }, isDraft: true, state: "OPEN", autoMergeRequest: null }
  ]);
  succeeds(f.run("prepare-translation"));
  succeeds(f.run("bundle-translation"));
  assert.match(fs.readFileSync(f.env.GITHUB_OUTPUT, "utf8"), /has_changes=false/);
});

test("state-only reservation survives publication and is available to the next fresh job", (t) => {
  const f = fixture(t);
  const file = "translations/blog-en-state.json";
  const state = JSON.stringify({
    schemaVersion: 1,
    entries: { [slug]: { status: "reserved", attemptCount: 5, reservationId: "123-1" } }
  });
  succeeds(f.run("prepare-translation"));
  f.write(file, state);
  succeeds(f.run("bundle-translation"));
  // Match the reservation job's cleanup before its publisher switches branches.
  f.git("restore", "--worktree", "--", ".");
  f.git("clean", "-fd", "--", "content/en/blog", "translations");
  f.env.BUNDLE_ROOT = path.join(f.repo, "translation-bundle");
  delete f.env.GIT_AUTHOR_NAME;
  delete f.env.GIT_AUTHOR_EMAIL;
  delete f.env.GIT_COMMITTER_NAME;
  delete f.env.GIT_COMMITTER_EMAIL;
  succeeds(f.run("publish-translation"));
  assert.equal(f.git("show", `HEAD:${file}`), state);
  f.git("checkout", "-q", "main");
  f.git("branch", "-D", branch);
  succeeds(f.run("prepare-translation"));
  assert.equal(fs.readFileSync(path.join(f.repo, file), "utf8"), state);
});
