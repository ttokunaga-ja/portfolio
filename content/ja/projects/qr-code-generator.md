---
title: "QR Code Generator"
subtitle: "ブラウザ内で完結するQRコード生成ツール"
abstract: "Wi-Fi、URL、テキストのQRコードをブラウザ内で作成できる、React + TypeScript + MUI製のクライアント完結型ツールです。Cloudflare Pagesで公開し、無料・回数制限なしで使えるサイトとして運用しています。"
role: "設計・フロントエンド実装・デプロイ"
period: "2025 - 2026"
startDate: "2025-11-01"
endDate: "2026-06-05"
sortOrder: 20
featured: true
tags:
  - React
  - TypeScript
  - MUI
  - Cloudflare Pages
  - Security
demoUrl: "https://qr.takumi-tokunaga.com/"
links:
  demo:
    label: "公開サイト"
    url: "https://qr.takumi-tokunaga.com/"
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/QR_Code_Generator"
---

## 概要

QR Code Generatorは、Wi-Fi、URL、テキストのQRコードを手軽に作成できるWebツールです。入力からプレビュー、PNG形式でのダウンロードまでをブラウザ内で完結させ、外部APIに入力内容を預けない構成にしています。

公開サイトはCloudflare Pagesで配信し、カスタムドメインとして [https://qr.takumi-tokunaga.com/](https://qr.takumi-tokunaga.com/) を設定しています。

## 主な機能

- Wi-Fi、URL、テキストのQRコード作成
- 入力内容に応じた即時プレビュー
- 生成したQRコードのダウンロード
- 日本語・英語の言語切り替え
- OSやブラウザのテーマに合わせたライト / ダーク表示
- セキュリティ方針とFAQページ
- 上部・下部の2箇所に配置した中央揃えの広告スペース

## 技術構成

フロントエンドはReact、TypeScript、Vite、MUIで構成しました。QRコードの生成には `qrcode` を利用し、Canvasへ直接描画しています。言語切り替えにはi18nextを使い、UIテキストやポリシー、FAQを日英で管理できるようにしています。

デプロイはCloudflare Pagesを利用し、GitHubの `main` ブランチへの反映を起点に静的ファイルをビルド・公開する構成です。

## 設計で重視したこと

利用者が迷わず使えるように、入力フォームとQRプレビューを同じ画面にまとめました。ヘッダーには言語切り替え、セキュリティ方針、FAQへの導線を置き、無料で回数制限なく使えることもFAQで明記しています。

UIはMUIのコンポーネントを中心に組み立て、丸みのあるカード、レスポンシブなレイアウト、システムテーマに連動する配色で、スマートフォンでもデスクトップでも使いやすい画面を目指しました。

## 公開・運用

ビルド成果物はCloudflare Pagesで静的サイトとして配信しています。QRコード生成にサーバー処理を必要としないため、公開後の運用はシンプルで、利用者は追加登録なしでそのまま使えます。
