---
title: "Kio"
subtitle: "Rust製のローカル知識アーカイブ — 開発中・CLIプレリリース"
abstract: "開発中・CLIプレリリースのRust製知識アーカイブです。原本・履歴・索引をローカルに保持し、検索結果から原文の根拠へ辿る設計です。OCRやEmbeddingで外部AIを利用する場合は明示的な許可を必要とします。"
sortOrder: 5
featured: true
tags:
  - Rust
  - CLI
  - SQLite
  - CAS
  - Local-first
links:
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/kio"
  release:
    label: "CLIプレリリース"
    url: "https://github.com/ttokunaga-ja/kio/releases/tag/v0.1.0-rc.3"
---

## 概要

Kioは、手元の資料を継続して扱うためのローカルファーストな知識アーカイブです。Rustで開発しており、現在は開発中・CLIプレリリースの段階です。

## 設計の中心

ファイルを内容に基づいて管理するCASと、検索結果を保存された版や原文の位置へ結び付けるEvidence Pointerを中核にしています。原本・履歴・索引をローカルに保持し、RustのワークスペースでCLI、保存層、索引、検索、取り込みパイプラインを分離しています。

ネットワーク送信は既定で無効で、OCRやEmbeddingに外部AIを使う場合は、対象範囲ごとの明示的な許可が必要です。

## 現在の状態

GUIは提供しておらず、v1の受入検証を継続しています。過去の根拠への参照には、必要な履歴の保持と現行ポリシーによる許可が必要です。ここで紹介するmainの開発内容と、配布RCが保証する範囲は同一ではありません。公開コードと配布版の対応範囲はREADMEで案内しています。

[公開コード・README](https://github.com/ttokunaga-ja/kio) / [CLIプレリリース](https://github.com/ttokunaga-ja/kio/releases/tag/v0.1.0-rc.3)
