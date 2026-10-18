---
title: "Claude DesktopのCode履歴をアカウント間で同期するCLI「claudeHistory」を作った"
abstract: "Claude Desktopでアカウントを切り替えたところ、Codeの会話が新しいアカウントの一覧に表示されなくなりました。 同じPCに残っているCodeのローカル履歴を、複数のアカウントから使えるようにしたのが、Rust製CLI claudeHistory です。macOSとWindows向けの実行ファイルを配布しているので、使う側にRustやPython"
publishedAt: "2026-10-07"
canonicalUrl: "https://zenn.dev/t_tokunaga/articles/2026-10-07-claude-history-cli"
tags:
  - "claude"
  - "rust"
  - "cli"
  - "windows"
  - "macos"
---

Claude Desktopでアカウントを切り替えたところ、Codeの会話が新しいアカウントの一覧に表示されなくなりました。

同じPCに残っているCodeのローカル履歴を、複数のアカウントから使えるようにしたのが、Rust製CLI **claudeHistory** です。macOSとWindows向けの実行ファイルを配布しているので、使う側にRustやPython、APIキーは必要ありません。

https://github.com/ttokunaga-ja/claudeHistory

## 何ができるか

Claude Desktopのアカウント間でCode履歴を同期します。3つ以上のアカウントでも、1つの操作でそれぞれに足りない履歴を追加できます。既存の履歴は上書きしません。

対象はCodeのローカル履歴です。通常チャット・Cowork・クラウド会話の移行や、自動ログアウト・ログインには対応していません。削除済みの会話本文を復旧するものでもありません。

## インストール

OSに合うコマンドを1回実行します。ダウンロードとインストールを自動で行うので、ターミナルを開いたフォルダーのままで実行できます。管理者権限は必要ありません。

### macOS（Apple Silicon）

ターミナルで次のコマンドを実行します。

```sh
curl -fsSL https://raw.githubusercontent.com/ttokunaga-ja/claudeHistory/main/install.sh | sh
```

`~/.local/bin`にインストールされ、PATHも設定されます。**新しいターミナルを開いてから**使ってください。

### Windows（x64）

PowerShellで次のコマンドを実行します。

```powershell
irm https://raw.githubusercontent.com/ttokunaga-ja/claudeHistory/main/install.ps1 | iex
```

`%USERPROFILE%\.local\bin`にインストールされ、PATHも設定されます。そのまま同じPowerShellで使えます。

### インストールの確認

どちらのOSでも、次のコマンドで版が表示されればインストール完了です。

```sh
claudeHistory --version
```

v0.3.0以前から更新する場合は、最初の1回だけ同じインストールコマンドを再実行してください。手動でファイルを取得したい場合は[GitHub Releases](https://github.com/ttokunaga-ja/claudeHistory/releases/latest)を利用してください。

## バージョン・使い方・状態を確認する

インストール済みのバージョンは、次のコマンドで確認できます。

```sh
claudeHistory --version
```

短い書き方は`claudeHistory -V`です。`claudeHistory version`というサブコマンドはないので、`--version`を使ってください。

コマンド一覧やオプションを確認するには、ヘルプを表示します。

```sh
claudeHistory --help
claudeHistory sync --help
```

`--help`は`-h`でも指定できます。2行目のようにコマンド名の後に付けると、そのコマンドの使い方を確認できます。

同期前にClaudeの起動・作業状態や、保存済みアカウント・組織の履歴件数を確認する場合は、次のコマンドを使います。どちらも履歴を変更しません。

```sh
claudeHistory status
claudeHistory accounts
```

## 更新・アンインストール

最新版への更新は、次のコマンドで行えます。

```sh
claudeHistory update
```

更新時に403エラーが出る旧版では、上のインストールコマンドを再実行してください。CLI本体だけを更新し、履歴やバックアップは変更しません。

このCLIが不要になったら、次のコマンドを実行します。

```sh
claudeHistory uninstall
```

削除対象のパスが表示されるので、確認して`y`を入力します。Enterだけなら中止します。claudeHistory本体と専用フォルダー`~/.claude-history`を削除します。専用フォルダーに残っているファイルと復旧用バックアップも削除されます。Claude本体の履歴・設定・認証情報には触れません。

Windowsでは終了後に削除されます。表示された結果の記録で`deleted`になれば完了です。

## 全アカウントに同期する

作業を保存してから、ターミナル（WindowsではPowerShell）で次のコマンドを実行してメニューを開きます。Claude内から実行している場合は、独立したターミナルから実行し直してください。

```sh
claudeHistory
```

**「1：すべてのアカウントに不足履歴を同期」** を選びます。初回の登録や設定は不要です。検出したすべてのアカウント・組織へ不足履歴を追加します。同じアカウントの複数組織や履歴0件の組織、3つ以上のアカウントも同じ手順です。

先に追加予定だけを確認したい場合は、次のコマンドを使えます。

```sh
claudeHistory sync --dry-run
```

`--dry-run`は履歴を変更せず、Claudeの終了も行いません。

Claude Desktop・CLIや関連ヘルパーが起動している場合は、対象のPIDを表示して、終了して続けるかYes/Noで確認します。**`Yes`または`y`を入力すると、識別できたClaudeとその子プロセスをすべて終了します。作業中の処理や未保存の状態を失う可能性があるため、先に保存してください。** 終了処理中に新しく起動・再起動したClaudeも対象です。終了要求から5秒後に残っている対象は強制終了し、すべての終了を確認してからバックアップと同期へ進みます。

`No`・Enter・入力終了では、Claudeと履歴を変更せず中止します。対話できない実行環境でも終了は行いません。対象を安全に識別できない場合は中止するので、Claudeを手動終了してから再実行してください。

完了するとバックアップの場所が表示されます。Desktopを起動し直して、追加された会話の一覧と本文を確認してください。別のアカウントで新しい会話が増えたら、再び1番を選んで同期できます。

特定のアカウントから現在のアカウントへだけ引き継ぐ場合は、メニューの2番を選びます。

## 追加した履歴を取り消す

引き継ぎ時に表示されたバックアップのパスを指定します。

```sh
claudeHistory undo "バックアップの絶対パス"
```

取り消すのは、その実行で追加した登録だけです。元の履歴や会話本文は削除しません。追加した登録が後から変更されている場合は中止するので、新しい作業を勝手に消すことはありません。

claudeHistoryは非公式ツールです。Desktopの更新によって動作が変わる可能性があるため、まず`--dry-run`で確認してください。詳しい仕様や実装、検証結果は[GitHubのREADMEとコード](https://github.com/ttokunaga-ja/claudeHistory)を参照してください。
