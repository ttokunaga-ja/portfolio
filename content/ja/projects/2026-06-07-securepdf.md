---
title: "securePDF"
subtitle: "ブラウザ内でPDFを整理するlocal-first PDFツール"
abstract: "PDF、JPEG、PNGの基本的な整理・PDF化をブラウザ内で処理し、Office変換だけを認証付きバックエンドへ切り出したPDFツールです。Chrome PDF Viewerに近いプレビュー、ページ並び替え、回転、反転、削除、挿入位置表示、CLI/APIを備えています。"
role: "設計・PDF操作エンジン・フロントエンド実装・Worker/API設計・CLI実装・デプロイ"
period: "2026"
startDate: "2026-06-05"
endDate: "2026-06-07"
updatedAt: "2026-06-07"
sortOrder: 12
featured: true
tags:
  - React
  - TypeScript
  - Cloudflare Workers
  - Cloud Run
  - PDF
  - Security
demoUrl: "https://securepdf.takumi-tokunaga.com/"
links:
  demo:
    label: "公開ページ"
    url: "https://securepdf.takumi-tokunaga.com/"
  api:
    label: "APIドキュメント"
    url: "https://securepdf.takumi-tokunaga.com/docs/api/"
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/securePDF"
---

## 概要

securePDFは、PDFの結合、並び替え、回転、反転、削除、画像のPDF化を扱うlocal-firstなPDFツールです。PDF、JPEG、PNGの通常操作はブラウザ内で完結させ、OfficeファイルのPDF変換のようにサーバーが必要な処理だけを認証付きのバックエンド変換に切り出しています。

公開ページは [https://securepdf.takumi-tokunaga.com/](https://securepdf.takumi-tokunaga.com/) です。

## 主な機能

- PDF、JPEG、PNGの取り込み
- JPEG / PNGのPDF化
- ページの並び替え、回転、左右反転、削除
- PDFの結合、印刷、ダウンロード
- Chrome PDF Viewerに近い縦スクロールプレビュー
- プレビュー上でのページ追加位置表示
- docx / xlsx / pptxなどOfficeファイルのPDF変換
- GUI、CLI、HTTP APIで共通の操作スキーマ

## 技術構成

フロントエンドはReact、TypeScript、Vite、MUIで構成し、PDFプレビューにはpdf.jsを使っています。PDF操作は `@securepdf/schema` と `@securepdf/core` に分け、GUI、CLI、Cloud Run側の処理で同じ操作スキーマとエンジンを共有できるようにしました。

配信はCloudflare Worker with Static Assetsです。WorkerはPDFを解析せず、`capabilities`、`openapi.json`、`validate-plan` のような軽いAPIと、Cloud Run / Office変換バックエンドへのproxyに限定しています。

## 設計で重視したこと

PDFには契約書、校務資料、成績、社内資料など、外部に出しにくい情報が含まれがちです。単に数ページを回転したり、不要ページを消したり、複数PDFを結合したりするだけなら、サーバーへアップロードする必要はありません。

そこで、ブラウザでできる処理は端末内で完結させ、Office変換のようにどうしてもサーバーが必要な処理は、認証とクレジットを通す別経路として明示しました。利用者にとって「どの操作でファイルが外へ出るのか」が曖昧にならないことを重視しています。

## 公開・運用

公開版はCloudflare上で配信しています。通常のPDF整理はブラウザで処理し、重い処理やOffice変換はWorkerからCloud Runまたは変換バックエンドへproxyします。

CLIも用意しており、回転、削除、抽出、反転、順序変更、PDF/画像挿入、分割、画像PDF化、Office変換などをコマンドから実行できます。
