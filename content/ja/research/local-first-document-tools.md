---
title: "local-first ドキュメントツールのプライバシー境界"
subtitle: "PDF処理をどこまでブラウザ内に留めるか"
abstract: "PDFや画像の整理をブラウザ内で完結させ、Office変換などサーバーが必要な処理だけを明示的に切り出す設計について、利用者のプライバシー境界と実装上の制約を整理しています。"
role: "調査・設計・PDFツール実装"
period: "2026"
startDate: "2026-06-05"
endDate: "2026-06-07"
sortOrder: 20
featured: true
tags:
  - Local-first
  - PDF
  - Privacy
  - Cloudflare Workers
  - pdf.js
links:
  project:
    label: "securePDF"
    url: "https://securepdf.takumi-tokunaga.com/"
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/securePDF"
---

## 背景

PDFには、契約書、校務資料、社内資料、成績、個人情報を含む書類など、外部サービスへ気軽に送れない内容が含まれます。一方で、結合、削除、回転、並び替えのような基本操作は、必ずしもサーバー側で処理する必要はありません。

このテーマでは、ブラウザで完結できる処理と、サーバーへ送る必要がある処理の境界を明確にする設計を整理しています。

## 設計方針

- PDF、JPEG、PNGの通常操作はブラウザ内で処理する
- Office変換のようにブラウザだけでは安定しない処理は、認証付きバックエンドへ分ける
- どの操作でファイルが外部に送信されるかを UI とドキュメントで明示する
- Worker はファイルを解析せず、軽いAPIとproxyに限定する
- PDFプレビューは Chrome PDF Viewer に近い挙動を目指し、元PDFの回転やフォント情報を尊重する

## 実装への反映

securePDF では、プレビューに pdf.js、PDF操作に共通スキーマと core package を使っています。GUI、CLI、API が同じ操作表現を共有することで、画面操作とコマンド実行の挙動を揃えやすくしています。

Office変換は例外として、APIキーと日次クレジットを通す経路に分けています。これにより、通常操作とサーバー処理の違いを利用者に説明しやすくしています。

## 今後の課題

巨大PDF、特殊フォント、画像化PDF、フォームや注釈を含むPDFでは、ブラウザだけで安定して扱うための制約が残ります。プレビュー品質、メモリ使用量、処理時間、エラー表示を継続的に改善する必要があります。
