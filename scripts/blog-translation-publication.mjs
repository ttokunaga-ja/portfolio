import assert from "node:assert/strict";
import { hasTranslationMarkers } from "./blog-translation-markers.mjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const publicationPaths = new Set([
  "translations/blog-en-state.json",
  "content/en/blog/2025-12-25-git-branch-splitting.md",
  "content/en/blog/2026-02-03-debezium-cdc-introduction.md"
]);
export const publicationTitle = "chore(blog): publish checked English [blog-translation] [blog-translation-publish]";
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");

export function validatePublishableData({ root = process.cwd(), files }) {
  assert.ok(files.length && files.every((file) => publicationPaths.has(file)), "Publication paths are not allowlisted");
  const english = files.filter((file) => file.startsWith("content/en/blog/"));
  assert.ok(english.length, "There is no English publication change");
  const state = JSON.parse(fs.readFileSync(path.join(root, "translations/blog-en-state.json"), "utf8"));
  assert.equal(state.schemaVersion, 1);
  for (const slug of Object.keys(state.entries))
    assert.ok(publicationPaths.has(`content/en/blog/${slug}.md`), "Unexpected state entry");
  for (const file of english) {
    const slug = path.basename(file, ".md");
    const outputPath = path.join(root, file);
    const sourcePath = path.join(root, "content/ja/blog", `${slug}.md`);
    if (!fs.existsSync(outputPath)) {
      assert.ok(!fs.existsSync(sourcePath), "Only a removed source allows automatic output deletion");
      continue;
    }
    assert.ok(fs.existsSync(sourcePath), "An English output has no current Japanese source");
    assert.ok(
      !hasTranslationMarkers(fs.readFileSync(outputPath, "utf8")),
      "Unresolved translation marker prevents publication"
    );
    const entry = state.entries[slug];
    assert.equal(entry?.status, "ready", "Only a completed translation can be published");
    assert.equal(entry.outputHash, hash(fs.readFileSync(outputPath)), "English output has changed since validation");
    assert.equal(entry.sourceHash, hash(fs.readFileSync(sourcePath)), "The Japanese source is stale");
    assert.equal(entry.model, "gemini-3.5-flash-lite", "Unreviewed model");
    assert.equal(entry.promptVersion, "blog-en-v1", "Unreviewed prompt version");
  }
}

export function deploymentProvenance({ event, repository, currentSha, git, root = process.cwd() }) {
  const run = event.workflow_run;
  assert.equal(event.repository?.full_name, repository, "Wrong event repository");
  assert.equal(run?.head_repository?.full_name, repository, "Fork workflow cannot deploy");
  assert.equal(run?.name, "Translate blog to English", "Unexpected workflow");
  assert.equal(run?.path, ".github/workflows/translate-blog.yml", "Unexpected workflow path");
  assert.equal(run?.head_branch, "main", "Only trusted main runs can deploy");
  assert.equal(run?.conclusion, "success", "Only successful translation runs can deploy");
  assert.ok(["push", "schedule", "workflow_dispatch"].includes(run?.event), "Untrusted workflow event");
  assert.ok(Number.isSafeInteger(run.id) && run.id > 0, "Invalid workflow run ID");
  assert.match(run.head_sha, /^[a-f0-9]{40}$/);
  assert.match(currentSha, /^[a-f0-9]{40}$/);
  assert.equal(git("rev-parse", "HEAD"), currentSha, "Checkout is not the current main snapshot");
  if (currentSha === run.head_sha) return false; // Queue-only or no-op run.
  const message = git("show", "-s", "--format=%B", currentSha);
  const expected = `${publicationTitle}\n\nWorkflow run: ${run.id}\nSource snapshot: ${run.head_sha}\n`;
  if (!message.startsWith(expected)) return false; // A later ordinary main push owns its own deploy.
  const lines = message.trim().split("\n");
  assert.equal(lines.length, 5, "Unexpected publication commit metadata");
  const contentSha = lines[4].replace(/^Validated content: /, "");
  assert.match(contentSha, /^[a-f0-9]{40}$/);
  assert.equal(git("rev-parse", `${currentSha}^`), contentSha, "Publication parent mismatch");
  assert.equal(
    git("rev-parse", `${currentSha}^{tree}`),
    git("rev-parse", `${contentSha}^{tree}`),
    "Publication changed unchecked data"
  );
  git("merge-base", "--is-ancestor", run.head_sha, currentSha);
  const files = git("diff", "--name-only", "--no-renames", `${run.head_sha}..${currentSha}`)
    .split("\n")
    .filter(Boolean);
  assert.ok(
    files.some((file) => file.startsWith("content/en/blog/")) && files.every((file) => publicationPaths.has(file)),
    "Publication contains unexpected paths"
  );
  validatePublishableData({ root, files });
  return true;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 }).trim();
  const proceed = deploymentProvenance({
    event,
    repository: process.env.GITHUB_REPOSITORY,
    currentSha: process.env.GITHUB_SHA,
    git
  });
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `proceed=${proceed}\n`);
  console.log(
    proceed
      ? "Verified the current main publication from this trusted translation run."
      : "No current main publication belongs to this translation run; deployment skipped."
  );
}
