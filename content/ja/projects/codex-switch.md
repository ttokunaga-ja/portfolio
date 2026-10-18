---
title: "codexSwitch"
subtitle: "別プロバイダー用のCodex第2インスタンスを起動するCLI"
abstract: "独立したCODEX_HOMEとアプリデータを使い、OpenRouterやZ.ai Coding Plan向けにCodexアプリを追加起動する非公式CLIです。本体のChatGPT設定を保ち、準備・状態確認・会話の引き継ぎを支援します。"
updatedAt: "2026-10-03"
sortOrder: 4
featured: true
tags:
  - "Rust"
  - "CLI"
  - "Codex"
  - "OpenRouter"
  - "Z.ai"
links:
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/codexSwitch"
  release:
    label: "最新版"
    url: "https://github.com/ttokunaga-ja/codexSwitch/releases/latest"
  article:
    label: "紹介記事（Zenn）"
    url: "https://zenn.dev/t_tokunaga/articles/2026-09-22-codex-switch-openrouter"
---

## 概要

codexSwitchは、Codexアプリの横にOpenRouterまたはZ.ai Coding Plan用の第2インスタンスを起動する非公式CLIです。Rust製で、macOSとWindowsに対応しています。OpenAIによる承認・保証はありません。

## 主な機能

- `init`で専用設定とモデル一覧を準備し、APIキーの保存先を案内
- プロバイダーを指定して起動し、`status`で設定と第2インスタンスの状態を確認
- `handoff`で元の会話を探し、確認後にコピーとフォークを作成
- 引き継ぎ時に読み取り専用の初回メッセージを送り、会話の文脈を確認

## 設計と利用範囲

`CODEX_HOME`とElectronのユーザーデータを分け、本体のChatGPT向け設定を保持します。キーは設定本文に埋め込まず、専用ファイルから読み込みます。Windowsのスクリプト配布版は利用できるコマンドが異なり、`status`は実行ファイル版のみです。

引き継ぎ先への初回送信には会話の文脈が含まれます。外部プロバイダーの料金や利用枠はChatGPT契約とは別で、無料利用は保証しません。アプリ内部の起動方式と実験的なapp-serverに依存するため、Codex更新による影響を受ける可能性があります。
