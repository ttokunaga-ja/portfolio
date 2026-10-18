import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(new URL("../scripts/check-blog-freshness.mjs", import.meta.url));
const env = { ...process.env, GITHUB_ACTIONS: "false", GIT_TERMINAL_PROMPT: "0", GIT_OPTIONAL_LOCKS: "0" };

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), "blog-freshness-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const origin = path.join(root, "origin.git");
  const source = path.join(root, "source");
  const checkout = path.join(root, "checkout");
  git(root, "init", "--bare", "--initial-branch=main", origin);
  git(root, "clone", origin, source);
  git(source, "config", "user.name", "Freshness Test");
  git(source, "config", "user.email", "freshness@example.invalid");
  mkdirSync(path.join(source, "content/ja/blog"), { recursive: true });
  mkdirSync(path.join(source, "public/images/blog"), { recursive: true });
  writeFileSync(path.join(source, "content/ja/blog/post.md"), "initial post\n");
  writeFileSync(path.join(source, "public/images/blog/image.svg"), "initial image\n");
  git(source, "add", ".");
  git(source, "commit", "-m", "Initial blog");
  git(source, "push", "origin", "main");
  git(root, "clone", origin, checkout);
  return { root, origin, source, checkout };
}

function check(cwd, extraEnv = {}) {
  return spawnSync(process.execPath, [script], { cwd, env: { ...env, ...extraEnv }, encoding: "utf8" });
}

function snapshot(cwd) {
  return {
    head: git(cwd, "rev-parse", "HEAD"),
    index: readFileSync(path.join(cwd, ".git/index")).toString("hex"),
    status: git(cwd, "status", "--porcelain=v1"),
    post: readFileSync(path.join(cwd, "content/ja/blog/post.md"), "utf8")
  };
}

test("current managed content passes", (t) => {
  const { checkout } = fixture(t);
  assert.equal(check(checkout).status, 0);
});

test("new remote blog content blocks preview without changing checkout or index", (t) => {
  const { source, checkout } = fixture(t);
  writeFileSync(path.join(source, "content/ja/blog/post.md"), "new remote post\n");
  git(source, "commit", "-am", "Update blog");
  git(source, "push", "origin", "main");
  const before = snapshot(checkout);
  const result = check(checkout);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /origin\/main/);
  assert.deepEqual(snapshot(checkout), before);
  assert.equal(git(checkout, "rev-parse", "origin/main"), git(source, "rev-parse", "HEAD"));
});

test("new remote image content also blocks preview", (t) => {
  const { source, checkout } = fixture(t);
  writeFileSync(path.join(source, "public/images/blog/image.svg"), "new image\n");
  git(source, "commit", "-am", "Update blog image");
  git(source, "push", "origin", "main");
  const result = check(checkout);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /origin\/main/);
});

test("tracked, staged, and untracked managed changes block preview", (t) => {
  const { checkout } = fixture(t);
  writeFileSync(path.join(checkout, "content/ja/blog/post.md"), "local edit\n");
  assert.match(check(checkout).stderr, /ローカル変更/);
  git(checkout, "add", "content/ja/blog/post.md");
  assert.match(check(checkout).stderr, /ローカル変更/);
  git(checkout, "restore", "--staged", "content/ja/blog/post.md");
  git(checkout, "restore", "content/ja/blog/post.md");
  writeFileSync(path.join(checkout, "public/images/blog/local.svg"), "local image\n");
  assert.match(check(checkout).stderr, /ローカル変更/);
});

test("unrelated work in progress is preserved and allowed", (t) => {
  const { checkout } = fixture(t);
  writeFileSync(path.join(checkout, "notes.txt"), "unrelated work\n");
  const before = snapshot(checkout);
  assert.equal(check(checkout).status, 0);
  assert.deepEqual(snapshot(checkout), before);
});

test("local non-Git directories and missing origin fail clearly", (t) => {
  const { root, checkout } = fixture(t);
  assert.match(check(root).stderr, /Git/);
  assert.equal(check(root).status, 1);
  git(checkout, "remote", "remove", "origin");
  const result = check(checkout);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /origin/);
});

test("failed remote fetch blocks preview without changing checkout or index", (t) => {
  const { origin, checkout } = fixture(t);
  rmSync(origin, { recursive: true });
  const before = snapshot(checkout);
  const result = check(checkout);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /取得できません/);
  assert.deepEqual(snapshot(checkout), before);
});

test("GitHub Actions skips freshness and needs no Git checkout", (t) => {
  const { root } = fixture(t);
  assert.equal(check(root, { GITHUB_ACTIONS: "true", PATH: "" }).status, 0);
});
