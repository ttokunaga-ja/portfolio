---
title: "aiClean"
subtitle: "会話の最終メッセージで判定するローカル履歴整理CLI"
abstract: "Claude Code・Codexの古いローカル会話を、実際の最終メッセージに基づいてOSのゴミ箱へ移すRust製CLIです。事前確認、月次実行、復旧記録と復元を備え、クラウド履歴は対象にしません。"
updatedAt: "2026-10-10"
sortOrder: 1
featured: true
tags:
  - "Rust"
  - "CLI"
  - "Claude Code"
  - "Codex"
  - "Local-first"
links:
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/aiClean"
  release:
    label: "最新版"
    url: "https://github.com/ttokunaga-ja/aiClean/releases/latest"
  article:
    label: "紹介記事（Zenn）"
    url: "https://zenn.dev/t_tokunaga/articles/2026-10-09-aiclean-cli"
---

## 概要

aiCleanは、Claude CodeとCodexのローカル保存データを整理するRust製CLIです。フォルダーの更新日時ではなく、ユーザーの送信とアシスタントの応答完了を基準に、当月より前の会話を判定します。macOSとWindows x64向けに配布しています。

## 主な機能

- `check`で候補、最終メッセージ日時、元データの容量を読み取り専用で確認
- 明示的に有効化する月次実行と、`status`・`stop`による状態確認と停止
- 原本ファイルと必要なDB行を検証・記録して、復旧用バンドルをOSのゴミ箱へ移動
- `undo`で最新または指定バッチを復元し、中断した処理の復旧にも対応

## 設計と利用範囲

日時不明、未完了の処理、有効なgoal、安全に扱えない関連セッションはスキップします。インストールだけでは自動整理を有効にしません。

対象は端末内のClaude Code・Codexで、ChatGPT Webなどのクラウド履歴は扱いません。ゴミ箱の削除はOSに任せるため、移動直後に容量が空くとは限りません。OSがバンドルを削除した後は復元できず、復元先の既存データも上書きしません。
