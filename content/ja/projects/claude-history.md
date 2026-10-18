---
title: "claudeHistory"
subtitle: "Claude DesktopのCode履歴一覧をアカウント間で補うCLI"
abstract: "同じPCのClaude Desktopで、Codeのローカル会話登録を複数アカウント・組織の一覧へ追加するRust製CLIです。不足分のみを補い、原本・バックアップを保持し、dry-runと取り消しに対応します。"
updatedAt: "2026-10-15"
sortOrder: 2
featured: true
tags:
  - "Rust"
  - "CLI"
  - "Claude Desktop"
  - "Local-first"
links:
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/claudeHistory"
  release:
    label: "最新版"
    url: "https://github.com/ttokunaga-ja/claudeHistory/releases/latest"
  article:
    label: "紹介記事（Zenn）"
    url: "https://zenn.dev/t_tokunaga/articles/2026-10-07-claude-history-cli"
---

## 概要

claudeHistoryは、Claude Desktopでアカウントを切り替えた際、同じPCに残るCodeの会話を別のアカウントの一覧からも参照できるようにする非公式CLIです。Rustで実装し、macOS Apple SiliconとWindows x64向けに配布しています。

## 主な機能

- 検出したアカウント・組織を確認し、それぞれの一覧へ不足する会話登録を追加
- `sync --dry-run`で、アプリや履歴を変更せず追加予定を確認
- 現在のアカウントへの片方向引き継ぎと、バックアップを指定した`undo`
- 既存の同一IDは保持し、参照先や作業フォルダーが競合する場合は書き込み前に中止

## 設計と利用範囲

移すのは一覧の登録情報で、会話本文は同じPC上の原本への参照を維持します。元の登録と復旧用バックアップを残し、認証、MCP接続、旧アカウントの実行許可などは引き継ぎません。

通常チャット・Cowork・クラウド履歴や、削除済み本文の復元は対象外です。ローカル処理時に会話を外部送信しませんが、引き継いだ会話で後から送信すると、その文脈はログイン中のアカウントからClaudeへ渡ります。自分が所有し、引き継ぎを許可できるアカウント間で使用します。
