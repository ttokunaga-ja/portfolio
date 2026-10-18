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

Claude Code・Codexのローカル保存ログから、指定した期間の利用量をモデルごとに集計します。利用量の項目は次の6つです。期間を指定すると、日別・月別・年別にも分けられます。

| 区分 | 通常入力 | キャッシュ読込 | キャッシュ書込 | 出力 | API参考換算USD |
| --- | --- | --- | --- | --- | --- |
| モデル名 | トークン数 | トークン数 | トークン数 | トークン数 | API単価での換算額 |

各期間・モデルごとに1行で出力し、合計行は作りません。合計やグラフ、サブスク料金との比較は、ExcelやGoogleスプレッドシートなどで自由に加工できます。

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
aiUsage claude 2026-09 --month
```

Codexの場合は、サービスの指定を`chatgpt`にします。

```sh
aiUsage chatgpt 2026-09 --month
```

ここでの`chatgpt`は、Codexのローカル保存ログを集計する指定です。ChatGPTのWeb版・iOS版の会話履歴は対象に含みません。

結果は **コマンドを実行したフォルダの`usage.csv`** に保存されます。初期設定やログイン操作は必要ありません。

### Claude CodeとCodexの結果を両方残す

ファイル名は常に`usage.csv`です。両方の結果を残したい場合は、保存するフォルダを分けると便利です。次の例はmacOS・WindowsのPowerShellで使えます。

```sh
mkdir claude-usage
cd claude-usage
aiUsage claude 2026-09 --month
cd ..

mkdir codex-usage
cd codex-usage
aiUsage chatgpt 2026-09 --month
cd ..
```

同名のCSVがある場合は上書きするか確認します。`y`・`yes`・`はい`で許可した場合だけ置き換え、Enterだけなら中止します。

## 全月の月次集計を1回で出す

v0.2.0から、対象期間と集計単位を分けて指定できるようにしました。すでにインストールしている場合は、`aiUsage update`で更新してください。

`--day`・`--month`・`--year`は集計単位を指定します。保存ログの全期間を月別に出すなら、次の1回で済みます。

```sh
aiUsage chatgpt --month
```

対象期間は位置引数、または`--from`・`--to`で指定します。

| 集計したい内容 | コマンド例 |
| --- | --- |
| 全期間を月別に集計 | `aiUsage claude --month` |
| 9月を日別に集計 | `aiUsage claude 2026-09 --day` |
| 2026年を月別に集計 | `aiUsage chatgpt 2026 --month` |
| 3〜9月を月別に集計 | `aiUsage chatgpt --month --from 2026-03 --to 2026-09` |
| 全期間を年別に集計 | `aiUsage chatgpt --year` |
| 9月全体をモデル別に集計 | `aiUsage claude 2026-09` |
| 全期間を分割せずに集計 | `aiUsage claude` |

対象期間は`YYYY`・`YYYY-MM`・`YYYY-MM-DD`で指定できます。日付と集計の区切りは日本時間です。`--to 2026-09`は9月末まで、`--to 2026`は年末までを含み、未来の部分は実行時点で打ち切ります。

`--from`だけなら指定した期間の先頭から現在まで、`--to`だけなら保存ログの最初から指定した期間の末尾までです。位置引数の対象期間と`--from`・`--to`は併用できません。

集計単位は1つだけ指定します。省略すると対象期間を区切らずに集計し、期間も省略すると全期間になります。`--all`は使いません。

## CSVを後から集計しやすい形にする

CSVは、1行が「サービス × 集計単位 × 期間 × モデル」の結果になる11列です。

```csv
サービス,集計単位,期間,集計開始,集計終了,区分,通常入力,キャッシュ読込,キャッシュ書込,出力,API参考換算USD
```

| 期間を表す列 | 内容 |
| --- | --- |
| サービス | `claude`または`chatgpt` |
| 集計単位 | `day`・`month`・`year`・`total` |
| 期間 | `2026-09-01`・`2026-09`・`2026`など。分割しない場合は`total` |
| 集計開始 | その行の対象範囲の開始日時（含む） |
| 集計終了 | その行の対象範囲の終了日時（含まない） |

日時は`2026-09-01T00:00:00+09:00`のようなタイムゾーン付き形式です。9月15日から月別集計した場合も、9月の行の開始が9月15日になるため、月全体と月途中の結果を区別できます。

整数は桁区切りなし、金額は通貨記号なしで出します。合計行やコメント行は入れず、利用記録がない期間の行も作りません。ExcelのピボットやPythonなどで月別・モデル別に集計しやすい形にしています。複数CSVを結合するときも、サービス・期間・モデルに加えて開始と終了を確認できます。

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
