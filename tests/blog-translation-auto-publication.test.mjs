import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";
import {
  deploymentProvenance,
  publicationTitle,
  validatePublishableData
} from "../scripts/blog-translation-publication.mjs";

const slug = "2025-12-25-git-branch-splitting";
const article = `content/en/blog/${slug}.md`;
const digest = (value) => crypto.createHash("sha256").update(value).digest("hex");

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "translation-publication-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync("git", ["-c", "core.hooksPath=/dev/null", ...args], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    }).trim();
  git("init", "-q", "--initial-branch=main");
  git("config", "user.name", "github-actions[bot]");
  git("config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com");
  const write = (name, value) => {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), value);
  };
  write(`content/ja/blog/${slug}.md`, "Public technical source\n");
  git("add", ".");
  git("commit", "-qm", "Source snapshot");
  const sourceSha = git("rev-parse", "HEAD");
  write(article, "Validated English\n");
  write(
    "translations/blog-en-state.json",
    JSON.stringify({
      schemaVersion: 1,
      entries: {
        [slug]: {
          status: "ready",
          sourceHash: digest("Public technical source\n"),
          outputHash: digest("Validated English\n"),
          model: "gemini-3.5-flash-lite",
          promptVersion: "blog-en-v1"
        }
      }
    })
  );
  git("add", ".");
  git("commit", "-qm", "Checked content");
  const contentSha = git("rev-parse", "HEAD");
  const message = `${publicationTitle}\n\nWorkflow run: 123\nSource snapshot: ${sourceSha}\nValidated content: ${contentSha}`;
  git("commit", "--allow-empty", "-qm", message);
  const currentSha = git("rev-parse", "HEAD");
  const event = {
    repository: { full_name: "owner/portfolio" },
    workflow_run: {
      id: 123,
      name: "Translate blog to English",
      path: ".github/workflows/translate-blog.yml",
      head_repository: { full_name: "owner/portfolio" },
      head_branch: "main",
      event: "schedule",
      conclusion: "success",
      head_sha: sourceSha
    }
  };
  const verify = (overrides = {}) =>
    deploymentProvenance({ event, repository: "owner/portfolio", currentSha, git, root, ...overrides });
  return { root, git, write, sourceSha, contentSha, currentSha, event, message, verify };
}

test("a trusted successful run can deploy its unchanged-content provenance commit", (t) => {
  const f = fixture(t);
  assert.equal(f.verify(), true);
});

for (const change of ["fork", "branch", "failure", "pull_request", "workflow", "path", "repository"]) {
  test(`deployment refuses ${change} workflow provenance`, (t) => {
    const f = fixture(t);
    if (change === "fork") f.event.workflow_run.head_repository.full_name = "fork/portfolio";
    if (change === "branch") f.event.workflow_run.head_branch = "feature";
    if (change === "failure") f.event.workflow_run.conclusion = "failure";
    if (change === "pull_request") f.event.workflow_run.event = "pull_request";
    if (change === "workflow") f.event.workflow_run.name = "Other workflow";
    if (change === "path") f.event.workflow_run.path = ".github/workflows/other.yml";
    if (change === "repository") f.event.repository.full_name = "other/portfolio";
    assert.throws(() => f.verify());
  });
}

test("no-op runs and a later main update do not deploy an unrelated snapshot", (t) => {
  const f = fixture(t);
  f.git("checkout", "-q", f.sourceSha);
  assert.equal(f.verify({ currentSha: f.sourceSha }), false);
  f.git("checkout", "-q", f.currentSha);
  f.git("commit", "--allow-empty", "-qm", "A later ordinary main update");
  assert.equal(f.verify({ currentSha: f.git("rev-parse", "HEAD") }), false);
});

test("a proof commit cannot change content after validation", (t) => {
  const f = fixture(t);
  f.write(article, "Different bytes\n");
  f.git("add", ".");
  f.git("commit", "--amend", "--no-edit", "-q");
  assert.throws(() => f.verify({ currentSha: f.git("rev-parse", "HEAD") }), /changed unchecked data/);
});

test("source or output byte changes are rejected before automatic publication", (t) => {
  const f = fixture(t);
  validatePublishableData({ root: f.root, files: [article, "translations/blog-en-state.json"] });
  f.write(article, "Human edit\n");
  assert.throws(() => validatePublishableData({ root: f.root, files: [article] }), /changed since validation/);
  f.write(article, "Validated English\n");
  f.write(`content/ja/blog/${slug}.md`, "New source\n");
  assert.throws(() => validatePublishableData({ root: f.root, files: [article] }), /source is stale/);
});

test("only generated content paths are publishable", (t) => {
  const f = fixture(t);
  assert.throws(
    () => validatePublishableData({ root: f.root, files: [article, "scripts/other.mjs"] }),
    /not allowlisted/
  );
  assert.throws(
    () => validatePublishableData({ root: f.root, files: ["translations/blog-en-state.json"] }),
    /no English/
  );
});

test("workflow-run deployment rebuilds current main without consuming upstream artifacts or broadening token permissions", () => {
  const deploy = fs.readFileSync(new URL("../.github/workflows/deploy.yml", import.meta.url), "utf8");
  const translation = fs.readFileSync(new URL("../.github/workflows/translate-blog.yml", import.meta.url), "utf8");
  assert.match(deploy, /workflows: \["Translate blog to English"\]/);
  assert.match(deploy, /head_repository\.full_name == github\.repository/);
  assert.match(deploy, /head_branch == 'main'/);
  assert.match(deploy, /conclusion == 'success'/);
  assert.match(deploy, /ref: \$\{\{ github\.sha \}\}/);
  assert.match(deploy, /needs: provenance/);
  assert.doesNotMatch(deploy, /run-id:|workflow_run\.head_sha.*ref:|actions: write/);
  assert.doesNotMatch(translation, /actions: write|--admin|--force/);
  assert.match(translation, /PORTFOLIO_USE_EXISTING_BUILD=1 pnpm test:a11y/);
  assert.match(translation, /PORTFOLIO_USE_EXISTING_BUILD=1 pnpm a11y:lighthouse/);
});
