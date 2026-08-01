---
title: "機密情報を守る：React + MUI + Cloudflare Pages で作る「完全クライアント完結型」QRコード生成器"
abstract: "社内の Wi-Fi 情報や限定公開 URL を共有する際、既存の SaaS 型 QR 生成サービスを利用すると「入力値が第三者の環境に送信される」という構造的なセキュリティリスクが伴います。 この課題を解決するため、「ブラウザ内で生成が完結し、サーバー側には一切データを送らない」構成の QR コード生成ツールを開発しました。本記事では、そのアーキテクチャと実"
publishedAt: "2025-11-01"
canonicalUrl: "https://zenn.dev/t_tokunaga/articles/2025-11-01-secure-qr-generator"
tags:
  - "react"
  - "mui"
  - "cloudflare"
  - "typescript"
  - "security"
---

社内の Wi-Fi 情報や限定公開 URL を共有する際、既存の SaaS 型 QR 生成サービスを利用すると「入力値が第三者の環境に送信される」という構造的なセキュリティリスクが伴います。

この課題を解決するため、「ブラウザ内で生成が完結し、サーバー側には一切データを送らない」構成の QR コード生成ツールを開発しました。本記事では、そのアーキテクチャと実装のポイントを紹介します。

公開URL: [https://qr.takumi-tokunaga.com/](https://qr.takumi-tokunaga.com/)

GitHub リポジトリ: [ttokunaga-ja/QR_Code_Generator](https://github.com/ttokunaga-ja/QR_Code_Generator)

## なぜこのリポジトリを作ったのか

もっとも大きな動機は **情報漏洩リスクの排除** です。

1. **プライバシーの担保**: Wi-Fi のパスワードや機密性の高い URL を外部サーバーに送信したくない。
2. **静的アセットの配布**: 実行時にサーバーサイドのロジックを必要とせず、ビルド済みの静的ファイルのみを配信する構成にしたい。
3. **公開・運用の容易さ**: GitHub と Cloudflare Pages を使い、静的サイトとしてすぐ公開できるようにしたい。

## 最初に決めた開発方針

開発にあたり、以下の 4 つを重視しました。

- **フロントエンド中心の構成**: React + Vite アプリをリポジトリルートに配置し、Cloudflare Pages でビルド・配信する。
- **静的配信のみ**: 実行時にサーバーへ入力を送らない。QRコード生成はブラウザ内で完結させ、公開側は静的ファイル配信に徹する。
- **再現性の保証**: ルートの `package-lock.json` と `npm run build` を基準にし、ローカルでも Cloudflare Pages でも同じ `build/` を生成できるようにする。
- **運用の簡素化**: GitHub の `main` ブランチへの push を起点に Cloudflare Pages へ自動デプロイし、カスタムドメイン `qr.takumi-tokunaga.com` で公開する。

## アーキテクチャの概要

システム全体の流れは以下の通りです。

```text
┌────────────┐   ビルド   ┌───────────────┐
│ React + Vite │─────────▶│ /build         │
└────────────┘            └───────────────┘
       ▲                                 │
       │ MUI, i18next, qrcode            ▼
       │                         ┌──────────────────┐
       └─────────────────────────│ Cloudflare Pages │
                                 └──────────────────┘
                                          │
                                          ▼
                            https://qr.takumi-tokunaga.com/
```

### フロントエンド
**React + TypeScript + Vite + MUI** を採用。
MUI の `ThemeProvider`、`AppBar`、`Paper`、`ToggleButtonGroup`、`TextField` などを使い、ヘッダー、入力フォーム、プレビュー、補足表示を一貫したデザインで構成しています。

QRコードの描画には `QRCode.toCanvas` を用いて、ブラウザの DOM 内で直接 QR コードを描画します。i18next による日英切り替えにも対応しています。

### 配信基盤
公開版は **Cloudflare Pages** で配信します。
リポジトリルートをビルドして生成される `build/` をそのまま公開し、入力値を受け取る API は用意しません。

### インフラ
GitHub の `main` ブランチに push すると Cloudflare Pages が `npm run build` を実行し、`build/` を公開します。カスタムドメインとして [https://qr.takumi-tokunaga.com/](https://qr.takumi-tokunaga.com/) を割り当てています。

## フロントエンド実装の工夫

### ブラウザ内での QR 生成
入力イベントをトリガーに、ライブラリを用いて即時描画を行っています。

```tsx:src/components/QRGeneratorApp.tsx
const wifiString = `WIFI:T:${encryption};S:${ssid};P:${password};H:false;;`;
await QRCode.toCanvas(canvasRef.current, wifiString, {
  width: qrSize,
  margin: 2,
  color: { dark: '#000000', light: '#FFFFFF' }
});
```

- **バリデーション**: Wi-Fi モードでは SSID 必須チェック、URL モードでは `new URL()` による形式検証を実施し、誤った QR 生成を抑制。
- **ダウンロード機能**: Canvas の `toDataURL` を活用し、PNG 画像として保存可能。追加ライブラリなしでブラウザ標準 API のみで完結させました。
- **MUI による UI 構成**: ヘッダー、モード切り替え、入力フォーム、QR プレビュー、広告枠を MUI コンポーネントで構成し、画面幅に応じて自然にレイアウトが変わるようにしています。
- **システムテーマ対応**: MUI のカラースキームを使い、OS やブラウザのテーマ設定に合わせてライト / ダーク表示を切り替えます。

:::message
**UXへの配慮**
入力欄と QR プレビューを同じ画面に置き、入力するとすぐ結果が分かるようにしています。言語切り替えやセキュリティ方針ページもヘッダーからアクセスできるようにし、利用者が迷わず確認できる導線にしています。
:::

## 静的配信まわりの工夫

Cloudflare Pages で静的ファイルとして配信するため、アプリ側では以下の点を意識しています。

1. **SPA ルーティング**: `/policy` や `/faq` などの直接アクセスでもアプリが開けるよう、Cloudflare Pages の標準SPA挙動を利用する。
2. **キャッシュ制御**: ハッシュ付きのアセットは長期キャッシュし、`index.html` は更新を拾いやすくする。
3. **セキュリティヘッダー**: `_headers` で CSP、`X-Frame-Options`、`Permissions-Policy` などを設定し、静的サイトとして不要な権限を閉じる。

## ビルドとデプロイの流れ

### ローカルビルド

```bash
npm ci
npm run build
```

Vite が `build/` を生成し、その中身が Cloudflare Pages で配信されます。

### Cloudflare Pages での公開

公開版は Cloudflare Pages で配信しています。リポジトリルートをビルドし、生成された `build/` ディレクトリを静的サイトとして公開する構成です。

- Production branch: `main`
- Root directory: 空欄（リポジトリルート）
- Build command: `npm run build`
- Build output directory: `build`
- Node.js: `20`
- Custom domain: [https://qr.takumi-tokunaga.com/](https://qr.takumi-tokunaga.com/)

入力値を受け取るAPIを用意せず、静的ファイルとして公開できる点は、このツールの設計と相性がよいと感じています。

## セキュリティ観点でのまとめ

- **データの局所性**: 入力値はブラウザから外に出ません。
- **静的配信**: 入力値を受け取る API を持たず、Cloudflare Pages はビルド済みファイルを配信するだけです。
- **ヘッダー制御**: CSP や Permissions-Policy により、不要なブラウザ権限や埋め込みを制限します。

## これからの拡張アイデア

今後、さらに利便性を高めるために以下の機能を検討しています。

- **PWA 化**: Service Worker を導入し、完全オフライン環境での QR 生成を実現。
- **テンプレート保存**: よく使う設定を `LocalStorage` に保存。
- **カスタマイズ性**: ロゴの合成やカラー変更機能の追加。

---

「入力値を預からない」というシンプルな設計ですが、社内ツールとしては非常に強力な安心感を提供できます。似たような課題感をお持ちの方は、ぜひリポジトリを参考にしてみてください。

:::details 実装の検証状況（2025-12-01）
ローカル環境にて、Wi-Fi モード・URL モード双方の生成・ダウンロード機能が正常に動作することを確認済みです。
:::

:::details 公開版の検証状況（2026-06-05）
Cloudflare Pages 上で [https://qr.takumi-tokunaga.com/](https://qr.takumi-tokunaga.com/) が HTTP 200 を返し、公開ページとして表示できることを確認済みです。
:::
