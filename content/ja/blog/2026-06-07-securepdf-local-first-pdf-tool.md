---
title: "securePDF: クライアント側でPDFを編集する client-first ツールを作った"
abstract: "PDF の結合、並び替え、回転、削除のために外部サービスへファイルをアップロードするのは、内容によっては避けたい場面があります。 そこで、PDF の基本的な整理作業を ブラウザ内で完結 させるツールとして securePDF を作りました。PDF や画像の処理をできるだけ端末内で行い、Cloudflare Worker は静的配信と軽い API に寄せる構成"
publishedAt: "2026-06-07"
canonicalUrl: "https://zenn.dev/t_tokunaga/articles/2026-06-07-securepdf-local-first-pdf-tool"
tags:
  - "pdf"
  - "cloudflare"
  - "react"
  - "typescript"
  - "security"
---

PDF の結合、並び替え、回転、削除のために外部サービスへファイルをアップロードするのは、内容によっては避けたい場面があります。

そこで、PDF の基本的な整理作業を **ブラウザ内で完結** させるツールとして **securePDF** を作りました。PDF や画像の処理をできるだけ端末内で行い、Cloudflare Worker は静的配信と軽い API に寄せる構成にしています。

公開URL: [https://securepdf.takumi-tokunaga.com/](https://securepdf.takumi-tokunaga.com/)

GitHub リポジトリ: [ttokunaga-ja/securePDF](https://github.com/ttokunaga-ja/securePDF)

## 何を作ったのか

securePDF は、PDF の整理と PDF 変換を扱うツールです。

現在の主な機能は以下です。

- PDF の取り込み
- JPEG / PNG の PDF 化
- ページの並び替え
- ページの回転
- ページの左右反転
- ページの削除
- PDF の結合
- PDF の印刷、ダウンロード
- docx / xlsx / pptx など Office ファイルの PDF 変換

GUI は Chrome の PDF ビューワーに近い操作感を意識し、左にページ一覧、右にスクロール可能なプレビューを置いています。右側のプレビューをスクロールすると、左側の選択ページも追従します。

初期画面では、中央のエリアに PDF や画像をドロップするか、「ファイルを開く」から選択します。

![securePDFの初期画面](/images/blog/2026-06-07-securepdf-local-first-pdf-tool/2026-06-07-securepdf-local-first-pdf-tool/securepdf1.png)

PDF や JPEG / PNG のようにブラウザで扱えるものは、基本的にローカルで処理します。一方で、Office ファイルの PDF 変換のようにブラウザだけでは難しい処理は、バックエンド変換として切り出しています。

## なぜ client-first にしたのか

PDF は、契約書、成績、校務、社内資料など、外部に出しにくい情報を含みがちです。

ここでいう client-first は、「可能な処理は利用者側の実行環境で完結させ、サーバー処理は必要な機能だけに限定する」という意味です。GUI ではブラウザ内処理、CLI ではローカル実行がそれに当たります。ローカルDBやオフライン同期の文脈で使われる local-first とは少し意味が違うため、この記事では client-first と呼ぶことにします。

「無料で使える PDF 編集ツール」は多くありますが、アップロード型のサービスでは、少なくとも構造上はファイルが第三者のサーバーへ送られます。もちろん便利な場面もありますが、単に数ページを回転したい、不要ページを消したい、複数 PDF を結合したいだけなら、サーバーへ送る必要はありません。

securePDF では、まず次の方針を置きました。

- ブラウザでできる処理はブラウザで完結させる
- Worker では PDF を解析しない
- 重い処理は Cloudflare に載せない
- GUI、CLI、API が同じ操作スキーマを使う
- ファイルの扱いについて、ローカル処理とサーバー処理を分けて考える

この方針にすると、利用者への説明も単純になります。

PDF / JPEG / PNG の通常操作は「ブラウザ内で処理される」。Office 変換など、どうしてもサーバーが必要なものは、認証とクレジットを通して別経路で処理する。ここを混ぜないことを重視しました。

## 全体アーキテクチャ

securePDF は monorepo です。

```text
apps/
  web/        Vite + React + MUI のブラウザGUI
  cli/        ローカル実行用CLI
  worker/     Cloudflare Worker + Static Assets
packages/
  schema/     操作スキーマとバリデーション
  core/       PDF操作エンジン
  codecs/     画像デコーダ
fixtures/     テスト用PDF / 画像
docs/         設計、API、セキュリティ、Cloud Run境界
```

設計上の中心は `packages/schema` と `packages/core` です。

GUI だけに処理を書かず、CLI だけに処理を書かず、HTTP API だけに別仕様を作らず、同じ操作スキーマを使うようにしています。PDF の実処理は、ブラウザ、CLI、Cloud Run が同じ core を使う形に寄せています。

```text
Browser GUI
  └─ operation schema
      └─ @securepdf/core

CLI
  └─ operation schema
      └─ @securepdf/core

Worker
  └─ operation schema

Cloud Run
  └─ operation schema
      └─ @securepdf/core
```

これにより、画面上の操作、CLI のコマンド、HTTP API のリクエストが同じ考え方で扱えます。Worker は軽い schema validation と proxy に限定し、PDF の実処理はブラウザ、CLI、または Cloud Run 側で行います。

## Cloudflare Worker を「軽く」保つ

公開版は Cloudflare Worker with Static Assets で配信しています。

Worker が担当するのは、主に以下です。

- SPA の静的配信
- `GET /api/v1/capabilities`
- `GET /openapi.json`
- `POST /api/v1/validate-plan`
- 重い処理の Cloud Run への proxy
- Office 変換 backend への proxy

重要なのは、**Worker で PDF を解析しない**ことです。

Cloudflare Workers の無料枠は便利ですが、PDF の解析や変換のような処理を雑に載せる場所ではありません。メモリ、CPU、bundle size、body size の制約があり、PDF parser や画像 codec、Office 変換を載せるとすぐに設計が苦しくなります。

そのため Worker は、light endpoint と streaming proxy に寄せています。

```text
Browser
  ├─ static assets ─────────▶ Cloudflare Worker
  ├─ local PDF processing ──▶ browser runtime
  └─ heavy conversion ──────▶ Worker proxy ─▶ Cloud Run / conversion backend
```

`validate-plan` も PDF bytes を読まず、JSON の plan と宣言された page count を検証するだけです。実際のファイル解析は、ブラウザまたは重い backend 側で行います。

## 操作スキーマ

securePDF の操作は、versioned operation schema として表します。

たとえば、PDF を結合して一部ページを回転・削除するような操作は、次のような JSON で表現できます。

```json
{
  "version": "1",
  "inputs": [
    { "id": "a", "filename": "a.pdf", "type": "application/pdf" },
    { "id": "b", "filename": "b.pdf", "type": "application/pdf" }
  ],
  "operations": [
    { "op": "merge", "inputs": ["a", "b"] },
    { "op": "rotate", "pages": "2-4", "degrees": 90 },
    { "op": "delete", "pages": "7" }
  ],
  "output": { "format": "pdf", "filename": "output.pdf" }
}
```

GUI では、ユーザーがページをドラッグしたり、回転ボタンを押したりします。その結果から内部的に plan を組み立て、core に渡します。

CLI や API でも同じ schema を使うため、機能が増えても実装が分岐しにくくなります。

## GUI の設計

GUI は、PDF 編集ツールとして自然に使えることを優先しました。

現在の画面は大きく 3 つに分かれます。

- 上部: ファイル名、ページ番号、ズーム、印刷、ダウンロード、メニュー
- 左側: ページ一覧、選択、回転、削除、挿入位置
- 右側: PDF プレビュー

右側のプレビューは、1ページだけを差し替えて表示するのではなく、Chrome PDF Viewer のように縦にスクロールできる形にしています。スクロール位置に応じて現在ページを更新し、左側の page card も追従するようにしました。

PDF を開くと、左側にページカード、右側にプレビューが表示されます。ページカード上のボタンから削除、回転、反転を直接操作できます。

![PDFを開いたsecurePDFの編集画面](/images/blog/2026-06-07-securepdf-local-first-pdf-tool/2026-06-07-securepdf-local-first-pdf-tool/securepdf2.png)

ページ追加位置も、左の一覧だけでなく右のプレビュー上に「ここに追加」として表示します。PDF のどこに新しいページが入るのかを、プレビュー側でも確認できるようにするためです。

複数ページ選択時のドラッグでは、ドラッグ中の overlay も複数枚の束として表示します。確定後だけ複数ページが動くのではなく、移動中にも「複数枚を持っている」ことが分かるようにしています。

## Office 変換と認証

PDF / JPEG / PNG の通常操作は client-first、つまり GUI ではブラウザ内で処理しますが、Office ファイルの PDF 変換は別です。

docx / xlsx / pptx を PDF にするには、ブラウザだけでは現実的ではありません。そこで securePDF では、Office 入力を検出した時点で backend 変換に切り替えます。

現在の流れは以下です。

```text
Office file selected
  └─ browser detects Office input
      └─ API key required
          └─ Google sign-in popup / saved API key
              └─ POST /api/v1/convert/office
                  └─ Worker proxy
                      └─ Cloud Run office service or GAS fallback
```

Firebase Auth は、Office 変換が必要になった時点で遅延ロードします。PDF だけを編集する利用者には、認証 UI も Firebase chunk も不要です。

API キーは `tkp_` で始まる形式のキーとして保存し、ヘッダー右端のメニューから手入力もできます。Google 認証で発行した場合は、そのキーを同じ入力欄に保存します。

Office 変換では日次クレジットも扱います。現時点では、変換 1 回あたり 5 クレジット消費する設計です。

## CLI と API

GUI だけでなく、CLI と HTTP API も用意しています。

CLI はローカルで処理できるものはローカルで処理し、必要であれば endpoint を指定して remote へ送る構成です。

```bash
node apps/cli/dist/cli.js capabilities --json
node apps/cli/dist/cli.js merge a.pdf b.pdf -o out.pdf
node apps/cli/dist/cli.js convert image.png --to pdf -o image.pdf
node apps/cli/dist/cli.js rotate in.pdf --pages 1,last --degrees 90 -o rotated.pdf
node apps/cli/dist/cli.js delete in.pdf --pages 2,4-5 -o removed.pdf
node apps/cli/dist/cli.js extract in.pdf --pages 1,3-4 -o extracted.pdf
node apps/cli/dist/cli.js flip in.pdf --pages even --axis horizontal -o flipped.pdf
node apps/cli/dist/cli.js reorder in.pdf --order 3,1,2 -o reordered.pdf
node apps/cli/dist/cli.js insert-pdf base.pdf appendix.pdf --at 3 -o inserted.pdf
node apps/cli/dist/cli.js insert-image base.pdf scan.png --at 0 -o with-scan.pdf
node apps/cli/dist/cli.js split in.pdf --every 1 -o page.pdf
node apps/cli/dist/cli.js organize --input a=a.pdf --plan plan.json -o out.pdf
```

Office ファイルは同じ `convert` コマンドで扱いますが、これはサーバー変換なので endpoint と API キーを指定します。CLI からは `X-API-Key` として送ります。

```bash
node apps/cli/dist/cli.js convert deck.pptx --to pdf \
  --endpoint https://securepdf.example.com --api-key "$SECUREPDF_API_KEY" -o deck.pdf
```

HTTP API は same-origin の Worker に載せています。

```text
GET  /api/v1/capabilities
GET  /openapi.json
POST /api/v1/validate-plan
POST /api/v1/organize
POST /api/v1/convert/to-pdf
POST /api/v1/convert/office
```

light endpoint は Worker が直接返し、重い endpoint は backend へ proxy します。クライアントから見ると、入口は同じ origin の API です。

## セキュリティとプライバシー

securePDF で気をつけている点は以下です。

- 通常の PDF 編集はブラウザ内で処理する
- Worker はファイルを保存しない
- Worker は PDF bytes を解析しない
- remote / URL input を受け付けない
- ファイル名は出力時に sanitize する
- Office 変換のようなサーバー処理は認証とクレジットを通す
- エラー表示は日本語で、401 / 402 / 429 などを分ける

PDF parser や画像 decoder は攻撃面になり得ます。だからこそ、どの runtime で何を解析するのかを明確にしました。

Worker は配信と軽い validation/proxy に限定します。ブラウザで解析するものは端末内で完結し、サーバーで解析するものは backend 側の責務として扱います。

## ローカル開発

ローカルでは pnpm で動かします。

```bash
git clone https://github.com/ttokunaga-ja/securePDF.git
cd securePDF
pnpm install
pnpm dev:web
```

検証は以下を基準にしています。

```bash
pnpm check
```

`pnpm check` は、Prettier / ESLint、TypeScript、Vitest、web build をまとめて実行します。

Worker まで含めて見る場合は以下です。

```bash
pnpm build
wrangler deploy --dry-run
```

## 作ってみての所感

PDF ツールは、単に UI を作れば終わりではありませんでした。

どの処理がブラウザでできるのか、どの処理は backend に逃がすべきか、Worker にどこまで責務を持たせるか、ファイルをアップロードする可能性がある操作をどう明示するか、といった境界設計が重要でした。

特に、Cloudflare Worker を便利なサーバーとして何でも載せるのではなく、**静的配信・軽い API・proxy に徹する**と決めたことで、設計がかなり整理されました。

今後は、Cloud Run 側の重い変換基盤、より大きい PDF の扱い、圧縮・修復・linearize などの機能を段階的に足していく予定です。ただし、通常の PDF 整理は client-first、GUI ではブラウザ内処理で完結する、という軸は変えないつもりです。

:::details 検証状況（2026-06-07）
ローカルでは `pnpm check` が成功しています。公開版は [https://securepdf.takumi-tokunaga.com/](https://securepdf.takumi-tokunaga.com/) が HTTP 200 を返すことを確認済みです。
:::
