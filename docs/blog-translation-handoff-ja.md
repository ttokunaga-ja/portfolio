# ブログ自動翻訳の引き継ぎ（2026-10-03 UTC）

## 現状

実装は main に反映済みですが、2記事の試行は **1記事公開・1記事停止**です。自動翻訳全体の安定稼働はまだ確認できていません。この引き継ぎブランチは文書だけを追加し、マージ・デプロイ・Gemini 呼び出しは行いません。

- リポジトリ: <https://github.com/ttokunaga-ja/portfolio>
- 確認済み main: `dfb8955a4a45b91ce83d67b9cdef5d82980c6ec3`
- 引き継ぎブランチ: `handoff/blog-translation-2026-10-03`
- 引き継ぎ開始時の作業ツリーはクリーン。旧作業ブランチ `codex/blog-segment-schema-guidance` の `8dc576fb` と main の内容は一致し、未コミットの実装変更はありませんでした。

## 公開結果と停止原因

### Debezium: 公開済み、累計2回

[英語記事](https://takumi-tokunaga.com/en/blog/2026-02-03-debezium-cdc-introduction/)と[英語一覧](https://takumi-tokunaga.com/en/blog/)を 2026-10-03 01:45 UTC に実ページで確認しました。要約・本文・一覧に内部の置換文字列は残っていません。AI 翻訳の表示と原文リンクも確認済みです。成功済みの内容は再生成していません。

### Git: 未公開、累計5/5回で停止

- slug: `2025-12-25-git-branch-splitting`
- `status: exhausted`, `reason: output_validation`, `validationCode: abstract_format`
- `attemptCount: 5`, `reservationId: null`, `nextAttemptAt: null`
- inputHash: `06ec93106e14df918d33acc5aea6e003f958b3c7518d2a818520285dd2daaa4a`
- pendingSourceHash: `3984e9de4ad0c37e41d6d48a502e1c53cdc166b19a308d50991a067e3cb7ed66`

最後の `abstract_format` は、要約の1600文字超過・改行・山括弧のいずれかです。失敗したモデル出力の原文を保存していないため、どれが原因かは確定できません。空文字は別の診断です。最終試行では数値検証を通過しましたが、その後の本文構造検証まで通過したとはいえません。

数値診断の「期待トークン数 / 返却された文章断片内の数字数」は title `0/0`、abstract `1/0`、body `7/0` でした。保護した数値はプログラムで復元するため、断片内の数字数ゼロは正常です。

## 重要: 最新の試行状態は監査ブランチにある

[監査ドラフト PR #33](https://github.com/ttokunaga-ja/portfolio/pull/33) は open / draft のままです。ブランチは `automation/blog-en-translation`、確認時の先端は `7bad18c917ac9f2f6b9a5b8646f407dbd5fdb811` です。main との差分は `translations/blog-en-state.json` のみです。

[このコミットの状態ファイル](https://github.com/ttokunaga-ja/portfolio/blob/7bad18c917ac9f2f6b9a5b8646f407dbd5fdb811/translations/blog-en-state.json)が Git の5回消費済み状態を保持しています。**main だけを checkout してローカル実行すると、最新の試行履歴を見落とすおそれがあります。** Actions は準備処理で検証済みの監査ブランチ状態を読み込みます。

状態ファイルの削除・カウンターのリセット・上限回避目的の入力ハッシュ変更はしないでください。監査ブランチを消したり、引き継ぎ文書をそこへコミットしたりもしないでください。人の変更が入ると自動更新は保護のため停止します。PR #33 の本文にある古い source snapshot よりも、最新 head の状態ファイルと実行履歴を参照してください。

同一入力について5回が上限です。原文・モデル・意味上の prompt version が変わると別入力になり、新しい枠が発生するため、修正前にその影響も確認してください。`locked-segments-v1`〜`v3` の通信形式修正では、意味上の `blog-en-v1` と既存 inputHash を維持しました。

## 設定と検証済みの動作

- 対象は上記 Git と `2026-02-03-debezium-cdc-introduction` の2記事のみ。全記事への拡張はしていません。
- 毎時17分の schedule と、日本語記事更新時の main push が入口です。GitHub の schedule は遅延・省略されることがあります。
- 設定済みのリポジトリ変数: `BLOG_TRANSLATION_ENABLED=true`, `BLOG_TRANSLATION_AUTO_PUBLISH=true`, `BLOG_TRANSLATION_ALLOW_API=1`, `BLOG_TRANSLATION_FREE_TIER_CONFIRMED=1`（初期設定表の既定値とは異なります）。今回の引き継ぎで設定は変更していません。
- モデルは `gemini-3.5-flash-lite` に固定。無料枠前提で、課金モデルへのフォールバックはありません。実際の Google プロジェクトの課金接続状態は所有者側で確認する必要があります。キーの値は文書・Git に含めていません。
- 最新の監査状態と実際の原文を用いた、API を呼ばない予約処理の検証では、Git は exhausted、Debezium は unchanged、予約ゼロ・API 呼び出しゼロ・状態変更なしでした。同じ入力なら定期処理は Git の6回目を予約しません。
- コード・リンク・固有名詞・数値は信頼できるコード側で復元。メタデータ／ビルド適格性／公開時の3段階で未解決置換文字列を拒否します。形式チェックは翻訳の意味の正しさを保証しません。

## 変更と実行の記録

- [PR #22](https://github.com/ttokunaga-ja/portfolio/pull/22): 最大5回の永続予約、無料枠用の再試行、検証後の自動公開とデプロイ連携。
- [PR #30](https://github.com/ttokunaga-ja/portfolio/pull/30): 固定診断コード、残り枠内に限る手動の検証失敗再試行。
- [PR #31](https://github.com/ttokunaga-ja/portfolio/pull/31): Debezium 要約の置換文字列修正と3段階の検査。誤った要約の公開処理は停止後、修正版を公開。
- [PR #32](https://github.com/ttokunaga-ja/portfolio/pull/32): 本文断片の翻訳と保護要素のプログラム側復元。
- [PR #34](https://github.com/ttokunaga-ja/portfolio/pull/34): タイトル・要約・本文の数値、メタデータの固有名詞も保護。
- [PR #35](https://github.com/ttokunaga-ja/portfolio/pull/35): 各断片と原文を対応づける schema、応答原文を含まない数値診断。
- [最終 Gemini 試行 37086311961](https://github.com/ttokunaga-ja/portfolio/actions/runs/37086311961): ワークフロー自体は success（失敗状態の保存に成功）、Git の翻訳は失敗。success を翻訳成功と読み替えないでください。
- [main のデプロイ 37086180033](https://github.com/ttokunaga-ja/portfolio/actions/runs/37086180033): `dfb8955` のビルド・公開・本番 smoke 成功。ローカル単体テスト118件と PR の CI も通過済みです。

## ローカルでの引き継ぎ

既存 checkout の変更を保存したうえで、次を実行してください。監査状態はまず表示して確認し、作業ツリーへ無条件に上書きしないでください。

```bash
git fetch origin
git fetch origin handoff/blog-translation-2026-10-03:refs/remotes/origin/handoff/blog-translation-2026-10-03
git switch --track origin/handoff/blog-translation-2026-10-03
git fetch origin automation/blog-en-translation:refs/remotes/origin/automation/blog-en-translation
git show origin/automation/blog-en-translation:translations/blog-en-state.json
```

Node.js 24 以上と pnpm 11.0.8 を使用します。以下はモデル API を呼ばない検証です。

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm test:unit
pnpm lint
pnpm typecheck
pnpm build
pnpm budget
```

次の作業は、`scripts/blog-translation-core.mjs`、`scripts/blog-translation-segments.mjs` と関連テストで要約の組み立て／形式契約を調べ、長さ・改行・山括弧を区別する安全な診断と決定的なテストを用意することです。原文や秘密をログへ出さず、検証条件を弱めずに原因を絞ってください。必要に応じてブラウザテストと Lighthouse を含む `pnpm quality` を実行します。

追加の実 API 試行は今回の5回枠を使い切っています。まずオフラインで修正を検証し、続行時は所有者が新たな実行方針・予算・状態の扱いを明示的に決めてください。Debezium の再生成は不要です。運用停止方法などの詳細は [blog-translation.md](./blog-translation.md) を参照してください。ただし同文書の一般的な「手動再試行」手順は、今回の Git に残り回数があることを意味しません。
