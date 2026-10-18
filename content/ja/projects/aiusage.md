---
title: "aiUsage"
subtitle: "ローカルログからモデル別トークン利用量をCSVにするCLI"
abstract: "Claude Code・Codexの保存ログから、モデル別の入力・キャッシュ・出力トークンとAPI参考換算額をusage.csvへ集計するRust製CLIです。期間指定と日・月・年別集計に対応し、元のログは変更しません。"
updatedAt: "2026-10-10"
sortOrder: 3
featured: true
tags:
  - "Rust"
  - "CLI"
  - "Claude Code"
  - "Codex"
  - "CSV"
links:
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/aiUsage"
  release:
    label: "最新版"
    url: "https://github.com/ttokunaga-ja/aiUsage/releases/latest"
  article:
    label: "紹介記事（Zenn）"
    url: "https://zenn.dev/t_tokunaga/articles/2026-10-04-aiusage-cli"
---

## 概要

aiUsageは、Claude CodeとCodexのローカル保存ログを読み、利用量をモデル別にまとめるRust製CLIです。毎月の利用状況を調べる作業を、期間指定からCSV出力まで一つのコマンドにしています。macOSとWindows x64向けの実行ファイルを配布し、Linuxではソースからビルドできます。

## 主な機能

- 対象期間を指定し、全期間・日別・月別・年別に集計
- 通常入力、キャッシュ読込・書込、出力トークンをモデル別に出力
- 同梱した単価表を用いてAPI参考換算USDを計算
- 実行フォルダーの`usage.csv`へ保存し、既存ファイルの置換は確認後に実行

## 設計と利用範囲

通常の集計はローカルで完結し、APIキーを必要とせず、元のログ・設定・DBを変更しません。会話本文をCSVへ含めず、重複する応答や累積カウンターを考慮して集計します。

参考換算は同梱単価によるトークン部分の比較値で、過去の請求額やサブスクリプション料金ではありません。単価不明などで換算できない場合は金額を空欄にし、警告します。削除されたログは復元しないため、集計範囲は残存する有効な記録に限られます。
