import { execFileSync } from "node:child_process";

const managedPaths = ["content/ja/blog", "public/images/blog"];
const gitEnv = {
  ...process.env,
  GIT_TERMINAL_PROMPT: "0",
  GIT_OPTIONAL_LOCKS: "0",
  GIT_SSH_COMMAND: "ssh -oBatchMode=yes -oConnectTimeout=10"
};

function git(...args) {
  return execFileSync("git", args, {
    env: gitEnv,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 15_000
  }).trim();
}

function checkFreshness() {
  if (process.env.GITHUB_ACTIONS === "true") return;

  try {
    git("rev-parse", "--show-toplevel");
  } catch {
    throw new Error(
      "Git チェックアウトで実行してください。ローカルプレビューには origin/main のブログ確認が必要です。"
    );
  }

  try {
    git("fetch", "--no-tags", "--no-recurse-submodules", "origin", "+refs/heads/main:refs/remotes/origin/main");
  } catch {
    throw new Error(
      "origin/main を取得できませんでした。origin の設定・接続・認証を確認して再実行してください（取得上限 15 秒）。"
    );
  }

  if (git("status", "--porcelain=v1", "--untracked-files=all", "--", ...managedPaths)) {
    throw new Error(
      "ブログ管理ディレクトリにローカル変更があります。作業を保全して変更内容を確認してください。ブログ同期は GitHub Actions が行います。"
    );
  }

  for (const managedPath of managedPaths) {
    if (git("rev-parse", `HEAD:${managedPath}`) !== git("rev-parse", `refs/remotes/origin/main:${managedPath}`)) {
      throw new Error(
        "ブログが origin/main と一致していないため、ローカルプレビューを停止しました。未コミット作業とローカルコミットを保全し、チェックアウトを最新の main に更新してから再実行してください。ブログ同期は GitHub Actions が行います。"
      );
    }
  }
}

try {
  checkFreshness();
} catch (error) {
  console.error(
    error.message.startsWith("Command failed:")
      ? "ブログ管理ディレクトリの Git 状態を確認できませんでした。origin/main とチェックアウトの構成を確認してください。"
      : error.message
  );
  process.exitCode = 1;
}
