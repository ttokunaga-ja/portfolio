---
title: "Claude Code・Codexの利用量をCSVで集計するCLI「aiUsage」を作った"
abstract: "Claude CodeやCodexを使っていて、「今月はどのモデルを、どれくらい使ったのか」を確認したくなったことはありませんか。 私は毎月のAI利用量を記事にまとめています。そのたびに保存ログを調べ、モデルごとにトークン数を集計し、API単価で換算する作業をしていました。この作業をコマンド1つで実行できるようにしたのが、Rust製のCLI aiUsage "
publishedAt: "2026-10-04"
canonicalUrl: "https://zenn.dev/t_tokunaga/articles/2026-10-04-aiusage-cli"
tags:
  - "claude"
  - "codex"
  - "rust"
  - "cli"
  - "ai"
---

Claude CodeやCodexを使っていて、「今月はどのモデルを、どれくらい使ったのか」を確認したくなったことはありませんか。

私は毎月のAI利用量を記事にまとめています。そのたびに保存ログを調べ、モデルごとにトークン数を集計し、API単価で換算する作業をしていました。この作業をコマンド1つで実行できるようにしたのが、Rust製のCLI **aiUsage** です。

https://github.com/ttokunaga-ja/aiUsage

macOSとWindowsに対応しています。配布版はRust・Python・APIキー不要で、インストール後は期間を指定するだけでCSVを出力できます。

## 何ができるか

Claude Code・Codexのローカル保存ログから、指定した期間の利用量をモデルごとに集計します。出力する項目は次の6つです。

| 区分 | 通常入力 | キャッシュ読込 | キャッシュ書込 | 出力 | API参考換算USD |
| --- | --- | --- | --- | --- | --- |
| モデル名 | トークン数 | トークン数 | トークン数 | トークン数 | API単価での換算額 |

モデルごとに1行で出力し、合計行は作りません。合計やグラフ、サブスク料金との比較は、ExcelやGoogleスプレッドシートなどで自由に加工できます。

集計はローカルで行います。保存ログを外部へ送信せず、CSVにも会話本文は含めません。

## インストール

OSに合うコマンドを1回実行します。最新の正式リリースを取得し、SHA-256とバージョンを確認してからインストールします。管理者権限は不要です。

### macOS

ターミナルで実行します。Apple Silicon・Intel共通です。

```sh
curl -fsSL https://raw.githubusercontent.com/ttokunaga-ja/aiUsage/main/install.sh | sh
```

インストール先は`~/.local/bin/aiUsage`です。PATHも自動設定されるので、**新しいターミナルを開いて** 次のコマンドで確認します。

```sh
aiUsage --version
```

### Windows

Windows x64では、PowerShellで実行します。

```powershell
irm https://raw.githubusercontent.com/ttokunaga-ja/aiUsage/main/install.ps1 | iex
```

インストール先は`%USERPROFILE%\.local\bin\aiUsage.exe`です。ユーザーPATHと現在のPowerShellのPATHに追加するため、そのまま動作確認できます。

```powershell
aiUsage --version
```

実行ファイルを手動で取得したい場合は、[GitHub Releases](https://github.com/ttokunaga-ja/aiUsage/releases/latest)からダウンロードできます。

## まずは1か月分を集計する

Claude Codeの2026年9月分なら、次のコマンドです。

```sh
aiUsage claude --month 2026-09
```

Codexの場合は、サービスの指定を`chatgpt`にします。

```sh
aiUsage chatgpt --month 2026-09
```

ここでの`chatgpt`は、Codexのローカル保存ログを集計する指定です。ChatGPTのWeb版・iOS版の会話履歴は対象に含みません。

結果は **コマンドを実行したフォルダの`usage.csv`** に保存されます。初期設定やログイン操作は必要ありません。

### Claude CodeとCodexの結果を両方残す

ファイル名は常に`usage.csv`です。両方の結果を残したい場合は、保存するフォルダを分けると便利です。次の例はmacOS・WindowsのPowerShellで使えます。

```sh
mkdir claude-usage
cd claude-usage
aiUsage claude --month 2026-09
cd ..

mkdir codex-usage
cd codex-usage
aiUsage chatgpt --month 2026-09
cd ..
```

同名のCSVがある場合は上書きするか確認します。`y`・`yes`・`はい`で許可した場合だけ置き換え、Enterだけなら中止します。

## 日・月・年・任意の期間で指定できる

| 集計したい期間 | コマンド例 |
| --- | --- |
| 1日分 | `aiUsage claude --day 2026-09-15` |
| 1か月分 | `aiUsage claude --month 2026-09` |
| 1年分 | `aiUsage chatgpt --year 2026` |
| 開始日から終了日まで | `aiUsage chatgpt --from 2026-09-01 --to 2026-09-30` |
| 指定日から現在まで | `aiUsage chatgpt --from 2026-09-01` |
| 保存ログの最初から指定日まで | `aiUsage chatgpt --to 2026-09-30` |
| 保存ログの全期間 | `aiUsage claude --all` |

日付は日本時間で扱い、`--to`は指定した日を含みます。期間を指定せずに実行した場合も、保存ログの全期間を現在まで集計します。

`--day`・`--month`・`--year`・`--all`は、いずれか1つを指定します。これらと`--from`・`--to`は併用できません。

どの期間指定でも、出力はその期間全体をモデルごとに集計したCSVです。`--year`を指定しても月別の行には分かれません。月別に比較したい場合は、月ごとに実行してCSVを保存します。

## キャッシュを分ける理由

API換算では、総トークン数に通常入力の単価を掛けるだけでは金額が大きく変わってしまいます。通常入力・キャッシュ読込・キャッシュ書込・出力で、それぞれ単価が異なるためです。

aiUsageはログに記録された内訳を使って換算します。

- Claude Codeはキャッシュ書き込みの5分・1時間の違いも換算に反映します。
- Codexは入力からキャッシュ読込を差し引いた分を通常入力として扱います。
- Codexの推論トークンは出力に含まれるため、別途足して二重計上しません。

Claude Codeの同じ応答の更新や、Codexの同じ累積カウンターの反復も、そのまま重ねて加算しないようにしています。Codexは累積値の差分を使い、期間の開始前の記録も差分の起点として読みます。

API参考換算USDは、実行ファイルに同梱した単価表を使った金額です。サブスクの実支払い額ではなく、同梱した単価を指定期間のトークン数に適用した比較用の値として使えます。単価未収録のモデルなど、換算できない場合はトークン数を出し、金額欄を空欄にして端末に警告します。

## 読み取るログ

既定では次の場所を読み取ります。

| 対象 | 保存先 |
| --- | --- |
| Claude Code | `~/.claude/projects/**/*.jsonl` |
| Codex | `~/.codex/sessions/**/*.jsonl`と`~/.codex/archived_sessions/**/*.jsonl` |

`CLAUDE_CONFIG_DIR`や`CODEX_HOME`を設定している場合は、その保存先を使います。元のログや設定は書き換えません。

集計に使うのは残っているログです。スクリーンショットからの補完やキャッシュ比率の推計は行わないので、必要な加工は出力したCSV側で行えます。

## 更新とアンインストール

新しい版へ更新するときは、次のコマンドを実行します。

```sh
aiUsage update
```

最新の正式リリースをダウンロードし、検証してから実行ファイルを自動で置き換えます。単価表も一緒に更新されます。通常の集計時に更新確認は行いません。

使わなくなったら、次のコマンドで削除できます。

```sh
aiUsage uninstall
```

削除する実行ファイルのパスを表示して確認します。Windowsではプロセス終了後に削除する仕組みです。出力済みのCSVやClaude Code・Codexの保存ログは残ります。

詳しい使い方は`aiUsage --help`、実装やソースからのビルド方法は[README](https://github.com/ttokunaga-ja/aiUsage#readme)にまとめています。

毎月の利用量を確認したい方や、モデルごとの使い方を表計算ソフトで分析したい方に使ってもらえればうれしいです。
