---
title: "Claude Code・Codexの古い会話をゴミ箱へ移すCLI「aiClean」を作った"
abstract: "Claude CodeやCodexの会話ログは増えていきます。保存フォルダの日付で削除すると、最近再開した会話まで消すかもしれません。 そこで、会話の最終メッセージを確認し、古い会話をOSのゴミ箱へ移す Rust製CLI、aiCleanを作りました。v0.1.2はmacOSとWindowsに対応しています。処理はローカルで行い、CLIへのアカウント登録やログ"
publishedAt: "2026-10-09"
canonicalUrl: "https://zenn.dev/t_tokunaga/articles/2026-10-09-aiclean-cli"
tags:
  - "claude"
  - "codex"
  - "rust"
  - "cli"
  - "ai"
---

Claude CodeやCodexの会話ログは増えていきます。保存フォルダの日付で削除すると、最近再開した会話まで消すかもしれません。

そこで、**会話の最終メッセージを確認し、古い会話をOSのゴミ箱へ移す** Rust製CLI、aiCleanを作りました。v0.1.2はmacOSとWindowsに対応しています。処理はローカルで行い、CLIへのアカウント登録やログインは必要ありません。

https://github.com/ttokunaga-ja/aiClean

## 「古い会話」の判定

対象はClaude Code・Codexのローカル保存データです。ChatGPTのWeb版などのクラウド履歴は対象にしません。

基準は、OSのタイムゾーンで **当月1日0時より前に、最後の実際のメッセージがあった会話** です。ユーザーの送信とアシスタントの応答完了を数えます。ファイルの更新日時や作成日時、アーカイブ日時、ツール実行・メタデータの日時では判定しません。

今月の会話、日時不明、未完了・待機中の処理、有効なgoal、子セッションとの関係など、安全に扱えない会話はスキップします。

## まずは確認だけ

```sh
aiClean check claude codex
```

`check`は読み取り専用です。候補・スキップした会話・元データの容量・ゴミ箱から復元可能な容量を表示します。会話データや処理記録を作成・変更しません。

`claude`と`codex`は明示して指定します。片方だけなら`aiClean check codex`です。

## 実行と毎月の予約

整理するときは、Claude Code・Codexと、それらを使うアプリやエディタを終了してから実行します。実行中のアプリを検出すると処理を拒否し、aiCleanが勝手に終了させることはありません。

```sh
aiClean run claude codex
```

`run`は毎月10日以降に実行でき、サービスごとに、その月の整理が成功するのは1回までです。

自動実行を設定する場合は次のコマンドです。

```sh
aiClean enable claude codex
aiClean status claude codex
```

macOSではlaunchd、Windowsではタスクスケジューラに、**毎月10日03:30、OSのローカル時刻** の予定を登録します。Windowsは現在のユーザーがOSにサインインしている状態で実行し、パスワードは保存しません。

予約時刻にアプリが動いていた場合も整理を拒否します。閉じてから手動で`run`してください。`status`でOSタスクの状態や結果を確認できます。

予約を止める場合は次のコマンドです。

```sh
aiClean stop claude codex
```

今後の実行を無効にし、整理中なら次の会話へ進む前に停止します。強制終了はしません。

## ゴミ箱と容量の関係

元のログと必要なデータベース行を復元用の束に保存・検証し、まず束をOS標準のゴミ箱へ移します。移動先を復元記録へ確実に保存できてから、元データを取り除きます。**aiClean自身はゴミ箱を空にしません。**

整理には、OSの「30日後にゴミ箱から自動削除する」設定が有効だと検証できることが必要です。macOSはFinderの設定を確認します。WindowsはStorage Senseの文書化されたポリシーを確認し、検証できないGUI設定やOSドライブ以外の復元先では実行を拒否します。aiCleanがOS設定を変更することはありません。

ゴミ箱にある間も容量を使うため、整理直後に空き容量が増えるとは限りません。SQLiteの行削除も、データベース内部の領域を再利用可能にする処理です。ファイルの縮小を保証せず、大きな一時領域が必要になる`VACUUM`は自動実行しません。

## 戻したいとき

```sh
aiClean undo claude codex
```

サービスごとの最新の未復元バッチを戻します。中断した整理・復元もこのコマンドで回復します。復元先に無関係なファイルや行があれば上書きせず、競合として拒否します。

OSがゴミ箱から削除したデータは戻せません。復元にはaiCleanの処理記録も必要なので、更新時も状態保存先を残してください。

## インストールと更新

配布先は[v0.1.2のGitHub Releases](https://github.com/ttokunaga-ja/aiClean/releases/tag/v0.1.2)です。OSに合うインストーラで正式リリースを取得できます。

macOS:

```sh
curl -fsSL https://raw.githubusercontent.com/ttokunaga-ja/aiClean/main/install.sh | sh
```

Windows x64のPowerShell:

```powershell
irm https://raw.githubusercontent.com/ttokunaga-ja/aiClean/main/install.ps1 | iex
```

SHA-256とバージョンを確認して配置します。macOSでは新しいターミナルを開いてください。

```sh
aiClean --version
aiClean update
aiClean uninstall
```

Windowsで更新前の実行ファイルを終了時まで削除できない場合は、その退避先を表示して保持します。必要であれば更新プロセスの終了後に、表示された退避ファイルを削除できます。

`uninstall`は実行ファイルとaiCleanが登録した予約を削除します。会話データ・処理記録・復元用の束は残ります。

## v0.1.2で確認した範囲

macOSでは91テストと、実際のゴミ箱を使う移動・復元の2つの試験を確認しました。別途launchdの停止・再有効化・状態確認も行っています。Windowsでは90テストと、ごみ箱の往復・実行しないタスクの登録や切替を使う2つの試験を確認しています。

Windowsの検証機ではStorage Senseの整理条件を未検証のため、実データの整理は実行していません。Intel Mac向けはビルド済みですが、Rosettaでの実行は未確認です。公開URLからのオンライン導入をmacOSとネイティブWindowsのPowerShell 5.1・7で確認しています。両OSとも0.1.0から0.1.2への更新と、公開バイナリとのSHA-256一致を確認しました。

macOS版はad-hoc署名で、Appleの公証は行っていません。Windows版もAuthenticode署名はありません。端末のセキュリティポリシーによっては実行時に確認が必要です。

詳しい条件や復元の仕組みは[README](https://github.com/ttokunaga-ja/aiClean#readme)にまとめています。
