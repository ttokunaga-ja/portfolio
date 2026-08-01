---
title: "sDB: School / University Database API と教育機関検索ページを公開した"
abstract: "日本の教育機関を検索できるページとして、sDB を公開しました。 sDB の主眼は、政府が公開している公式情報をもとに、高校、大学、短大、高専、専門学校などの検索用データベースを誰でも再現できる形にすることです。特定の外部 SaaS や手元だけの非公開データに依存せず、自社環境でも同じ考え方の DB と API を再構築できるよう、取得・加工スクリプトと A"
publishedAt: "2026-06-07"
canonicalUrl: "https://zenn.dev/t_tokunaga/articles/2026-06-07-sdb-school-university-database-api"
tags:
  - "sdb"
  - "school"
  - "university"
  - "database"
  - "api"
---

日本の教育機関を検索できるページとして、**sDB** を公開しました。

sDB の主眼は、政府が公開している公式情報をもとに、高校、大学、短大、高専、専門学校などの検索用データベースを誰でも再現できる形にすることです。特定の外部 SaaS や手元だけの非公開データに依存せず、自社環境でも同じ考え方の DB と API を再構築できるよう、取得・加工スクリプトと API 仕様を公開しています。

検索体験としては、学校種別、都道府県、学校名、学部・研究科、学科を段階的に選べる UI を用意しました。大学だけでなく、高校、短大、高専、専門学校なども学校種別で切り替えて検索できます。学校名は漢字だけでなく、かな、カタカナ、ローマ字でも候補検索できるようにし、autocomplete で入力途中から絞り込めるようにしています。

公開ページ: [https://sdb.takumi-tokunaga.com/](https://sdb.takumi-tokunaga.com/)

GitHub リポジトリ: [ttokunaga-ja/sDB](https://github.com/ttokunaga-ja/sDB)

API ドキュメント: [https://sdb.takumi-tokunaga.com/api/](https://sdb.takumi-tokunaga.com/api/)

![sDB の検索フォーム](/images/blog/2026-06-07-sdb-school-university-database-api/2026-06-07-sdb-school-university-database-api/sdb-frontend1.jpg)

## 何を作ったのか

sDB は、日本の教育機関データを **再現可能な database / API / search UI** として扱うためのプロジェクトです。

対象は大学に限定していません。高校、大学院、大学、短大、高専、高専専攻科、専門学校など、複数の学校種別を扱えるようにしています。

公開している要素は大きく 3 つあります。

- 公式公開情報を取得し、検索用の形に正規化する Python スクリプト
- 高校、大学、短大、高専、専門学校などの教育機関と、学部・研究科、学科を検索する API 仕様
- API を使って教育機関を探せる React + MUI の検索ページ

利用者から見ると単純な検索フォームですが、内部では表記ゆれを吸収するために検索語を増やしています。たとえば、学校名の漢字表記だけでなく、かな、カタカナ、ローマ字の検索語を生成し、入力方法に依存せず候補を出せるようにしました。

## 公式情報からDBを再現する

sDB では、文部科学省が公開している学校基本情報や学校コードなどの公開資料をもとに、検索用データを生成します。

重要なのは、DB そのものをブラックボックスとして配るのではなく、**公式情報から同じ構造のデータを作り直せる**ことです。

```text
MEXT public materials
  └─ download scripts
      └─ normalize / merge / enrich
          └─ institutions / faculties / departments / search terms
              └─ PostgreSQL
                  └─ API
```

この構成にすると、次のような利点があります。

- 自社環境で同じ生成手順を実行できる
- 特定の外部 API や SaaS に検索基盤を依存させない
- 元資料が更新されたときに、再取得・再生成の流れを追いやすい
- API のレスポンス形式や検索仕様を固定しやすい

単に「学校一覧を持っている」ことよりも、「公開情報から同じ検索 DB を再現できる」ことを重視しました。

## 検索UXのためにやったこと

教育機関名の検索は、単純な完全一致だけでは使いにくくなります。

たとえば、利用者は `東京`、`とうきょう`、`トウキョウ`、`tokyo` のように入力する可能性があります。そこで sDB では、元データの名称に対して検索用の term を生成し、漢字、かな、カタカナ、ローマ字のいずれでも候補に到達しやすくしました。

UI 側では、autocomplete を前提にした軽量な候補取得 API を用意しています。

- 入力途中でも候補を返す
- 高校、大学、短大、高専、専門学校などの学校種別で候補を絞る
- 都道府県で候補を絞る
- 学校を選ぶと学部・研究科候補へ進む
- 学部・研究科を選ぶと学科候補へ進む

![学部候補の autocomplete](/images/blog/2026-06-07-sdb-school-university-database-api/2026-06-07-sdb-school-university-database-api/sdb-frontend2.png)

autocomplete は `/v1/institutions` ではなく `/v1/suggest` を使います。`/v1/institutions` は一覧表示向けに総件数も取得しますが、候補表示のたびに count query を実行すると重くなります。そのため、候補取得専用の軽量 endpoint を分けました。

学校、学部・研究科、学科まで選択すると、現在選択中の内容を確認できるようにしています。単なる検索ボックスではなく、教育機関の階層構造を段階的にたどる UI にしている点がポイントです。

![学校・学部・学科の選択結果](/images/blog/2026-06-07-sdb-school-university-database-api/2026-06-07-sdb-school-university-database-api/sdb-frontend3.png)

## アーキテクチャ

全体構成は以下の通りです。

```text
┌────────────────────┐
│ Cloudflare Pages   │
│ React + MUI frontend│
└─────────┬──────────┘
          │ X-API-Key
          ▼
┌────────────────────┐
│ Cloud Run          │
│ Go API server      │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Neon PostgreSQL    │
│ institution data   │
└────────────────────┘
```

### フロントエンド

フロントエンドは **React + TypeScript + Vite + MUI** です。

ルートページは検索フォームに集中させ、概要、API、注意事項は `/overview/`、`/api/`、`/notices/` に分離しました。API キーはページ状態としてのみ保持し、ブラウザストレージには保存しません。ページ遷移時にもフォーム状態が残らないようにしています。

API キーが未入力の場合は、ポートフォリオの Contact ページから取得導線へ進めるようにしています。

API キー取得導線: [https://takumi-tokunaga.com/contact/](https://takumi-tokunaga.com/contact/)

### API

API のベース URL は以下です。

```text
https://sdb.api.takumi-tokunaga.com
```

`/v1/*` は `X-API-Key` ヘッダーによる認証を要求します。主なエンドポイントは以下です。

- `GET /v1/institutions`: 教育機関検索
- `GET /v1/institutions/{publicId}`: 教育機関詳細
- `GET /v1/institutions/{publicId}/faculties`: 学部・研究科一覧
- `GET /v1/faculties/{publicId}/departments`: 学科一覧
- `GET /v1/suggest`: autocomplete 向けの軽量候補取得

主なエラーレスポンスは以下です。

| ステータス | 意味 |
|---|---|
| `400 Bad Request` | クエリパラメータ不正 |
| `401 Unauthorized` | API キーなし・不正 |
| `402 Payment Required` | 日次クレジット不足 |
| `403 Forbidden` | API キー失効・アクセス禁止 |
| `404 Not Found` | 指定した `publicId` が存在しない |

## API キーとクレジット

API キーはポートフォリオ側の認証フローから取得します。

API キーは `tkp_` で始まる固定長の文字列です。フロントエンド側では、最低限の形式チェックを行い、明らかに不正な値では API 通信を走らせないようにしています。

クレジットは **1 リクエストにつき 1 消費** し、**毎日 0 時（JST）に回復** します。クレジットが尽きた場合は `402 Payment Required` が返ります。

ただし、最終的な検証はバックエンド側で行います。大量アクセスによるクラウドコスト増加を避けるため、API キー検証とクレジット消費はバックエンドで扱う必要があります。

## レイテンシ

公開後に、手元環境から API の応答時間も確認しました。

初回アクセスでは 1 秒前後まで伸びることがありましたが、ウォーム後の autocomplete は 500ms 前後でした。検索フォームで候補を選びながら使う用途では、実用上そこまで大きな問題にならないレイテンシになったと感じています。

## 検証方法

公開ページが返るかは、次のように確認できます。

```bash
curl -I https://sdb.takumi-tokunaga.com/
curl -I https://sdb.takumi-tokunaga.com/api/
```

API の health check は以下です。

```bash
curl https://sdb.api.takumi-tokunaga.com/livez
curl https://sdb.api.takumi-tokunaga.com/readyz
```

認証ありの候補検索は、API キーを環境変数に入れて確認します。

```bash
export SDB_API_KEY="your_api_key"

curl -sS --get "https://sdb.api.takumi-tokunaga.com/v1/suggest" \
  -H "X-API-Key: ${SDB_API_KEY}" \
  -H "Accept: application/json" \
  --data-urlencode "q=東京" \
  --data-urlencode "limit=10"
```

## 実測結果

手元環境から 2026-06-07 に計測した結果です。ネットワーク条件によって変動します。

| 対象 | 結果 |
|---|---:|
| `GET /v1/suggest?q=東京` 初回 | total 1090.8ms / auth 271.6ms / db 572.4ms |
| `GET /v1/suggest?q=東京` ウォーム後平均 | total 約507.8ms / auth 約179.8ms / db 約113.2ms |
| `GET /v1/suggest?q=トウキョウ` 平均 | total 約478.0ms / auth 約180.8ms / db 約89.8ms |
| `GET /v1/institutions?q=東京` 平均 | total 約659.9ms / auth 約147.8ms / db 約303.5ms |
| `GET /readyz` 平均 | total 約313.5ms / db 約95.6ms |
| Cloudflare Pages のトップページ | 108〜136ms |

初回の `/v1/suggest` は 1 秒程度まで伸びましたが、ウォーム後は 500ms 前後で返っています。autocomplete と段階選択の UI では、実用上は十分使える範囲だと思います。

## ローカルでの確認

公開リポジトリを clone すれば、フロントエンドとドキュメントはローカルで確認できます。

```bash
git clone https://github.com/ttokunaga-ja/sDB.git
cd sDB
npm ci
make frontend-serve
```

通常は [http://localhost:5173](http://localhost:5173) で確認できます。`5173` が埋まっている場合は、別ポートを指定します。

```bash
FRONTEND_PORT=5174 make frontend-serve
```

ビルドだけ確認する場合は以下です。

```bash
npm run build
```

データ生成の流れを確認する場合は、Python 依存関係を入れたうえで、公開資料の取得とローカル CSV 生成を実行します。

```bash
make setup
make data-fetch
make data
```

生成物は `data/` 配下に出力されます。これはローカルで DB 投入前のデータ構造を検証するためのもので、リポジトリにはコミットしません。

## 公開時の配慮

再現可能性を重視する一方で、公開リポジトリが元データや生成済みデータの再配布場所にならないようにしています。

公開リポジトリには以下を含めません。

- ダウンロード済みの Excel / PDF / CSV
- 生成済み CSV
- DB ダンプ
- DB 投入用の実行済みデータ
- API キーや DB 接続文字列などのシークレット

代わりに、公開しているのは取得・加工スクリプト、検索ページ、API ドキュメント、注意事項です。これにより、再現手順は読めるが、生成済みデータをそのまま配布する形にはしない構成にしています。

:::message
この記事は実装方針の記録であり、法的助言ではありません。公開資料や加工データを再配布する場合は、対象資料の利用条件や第三者権利の有無を個別に確認する必要があります。
:::

## 出典と注意事項

データパイプラインは、文部科学省が公開している資料を対象にしています。

関連リンク:

- [MEXT Website Terms of Use](https://www.mext.go.jp/b_menu/1351168.htm)
- [MEXT Website Terms of Use Appendix](https://www.mext.go.jp/b_menu/1366610.htm)
- [MEXT School Code](https://www.mext.go.jp/b_menu/toukei/mext_01087.html)
- [sDB の注意事項](https://sdb.takumi-tokunaga.com/notices/)

sDB は文部科学省の公式サービスではありません。生成データには、解析ミス、古い情報、推定分類、公式資料との差異が含まれる可能性があります。

## まとめ

今回の実装では、以下を重視しました。

- 政府の公式公開情報から検索 DB を再現できる
- 特定の外部 SaaS に依存せず、自社環境でも同じ考え方の DB / API を構築できる
- 漢字、かな、カタカナ、ローマ字の検索語を作り、入力方法に依存しにくい検索にする
- autocomplete 用の `/v1/suggest` を分け、候補取得の UX を整える
- API は Cloud Run + Neon PostgreSQL で提供する
- API キー検証でクラウドコストの暴発を防ぐ
- 公開時には元データや生成済み CSV を置かず、出典・加工内容・免責を明示する

個人開発でも、DB の再現性、検索 UX、API キー、クレジット、出典表示を最初から分けて設計しておくと、あとから運用しやすくなります。
