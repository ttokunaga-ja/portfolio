---
title: "CodexにOpenRouterを足して、ChatGPT枠を保ったまま別モデルを使う"
abstract: "Codexを使っていて、こんな経験はありませんか。 作業の途中で、Codexの週間の利用上限を使い切ってしまった Appshots（前面のウィンドウを撮って会話に添える機能）やブラウザー、Computer Useが便利で、ほかのモデルでも使いたいと思った この記事では、Codexアプリの画面や機能はそのままに、中で動くモデルだけをOpenRouterのモデル"
publishedAt: "2026-09-22"
canonicalUrl: "https://zenn.dev/t_tokunaga/articles/2026-09-22-codex-switch-openrouter"
tags:
  - "codex"
  - "openrouter"
  - "ai"
  - "開発環境"
  - "llm"
---

Codexを使っていて、こんな経験はありませんか。

- 作業の途中で、Codexの週間の利用上限を使い切ってしまった
- Appshots（前面のウィンドウを撮って会話に添える機能）やブラウザー、Computer Useが便利で、ほかのモデルでも使いたいと思った

この記事では、Codexアプリの画面や機能はそのままに、中で動くモデルだけをOpenRouterのモデルに替える方法を紹介します。ChatGPTの利用枠は使わず、本体のCodexにも手を加えません。Appshotsは2つ目のインスタンスでもそのまま使えます（画像を受け取れるモデルを選んでください）。Computer Useやブラウザー操作に使うツールがOpenRouterのモデルにもそのまま渡ること、画像入力が通ることも、後半で確かめています。

## 結論――プロバイダを足すだけ。ただしアプリは別インスタンスが要る

CodexはOpenAI公式の`model_providers`機構を持っていて、OpenRouterのような外部エンドポイントを足せます。やることは3つだけです。

```text
1. ~/.codex/config.toml に model_providers を足す
2. プロファイルファイルを作る
3. codex -p <プロファイル名> で起動する
```

ここで大事なのは、**グローバルの`model_provider`は書き換えない**ことです。書き換えると、素の`codex`もCodexアプリも既定がOpenAIから外れます。ChatGPTのサブスク枠をそのまま使い続けたいなら、プロバイダは定義だけしておいてプロファイルで切り替えます。

ただしCodexアプリ（デスクトップ版）にはプロファイルを選ぶUIがありません。アプリでも使いたい場合は、`CODEX_HOME`を分けた**2つ目のインスタンス**を立てます。本体のアプリと設定には一切触れずに済みます。

```text
~/.codex        → ChatGPT / OpenAIモデル     （本体・無傷のまま）
~/.codex-switch → OpenRouter                 （2つ目のインスタンス）
```

実際に並べると次のようになります。左が2つ目のインスタンス、右が本体です。画面の2つ目のインスタンスはZ.ai Coding Planで起動したものですが、OpenRouterでも同じように並びます。

![macOSで、2つ目のインスタンス（左、Z.ai Coding Planのglm-5.3-flash）と本体のCodexアプリ（右、ChatGPTのモデル）を並べて起動した画面](/images/blog/2026-09-22-codex-switch-openrouter/2026-09-22-codex-switch-openrouter/codex-app-two-instances-macos.png)

![Windows版のCodexアプリでも、2つ目のインスタンス（左）と本体（右）を並べて起動できる](/images/blog/2026-09-22-codex-switch-openrouter/2026-09-22-codex-switch-openrouter/codex-app-two-instances-windows.png)

この記事では、CLIで動かす最小手順、アプリで動かす手順、無料モデルの実測、そして踏んだ落とし穴を順に書きます。

## 検証環境

| 項目 | バージョン |
| --- | --- |
| Codex CLI | `codex-cli 0.155.1`（Homebrew cask） |
| Codexアプリ | `26.915.31945`（内蔵CLIは`0.155.0-alpha.9.2`） |
| OS | macOS 27.0 |

Codexは更新が速く、設定スキーマも変わります。とくに後述の`wire_api`まわりはバージョン依存が強いので、手元のバージョンを確認してから読んでください。

```bash
codex --version
```

## 最小手順1：CLIで動かす

まずCLIだけで完結させます。アプリを使わないなら、この節だけで終わりです。

### 1. APIキーをファイルに置く

OpenRouterのダッシュボードでAPIキーを発行し、ファイルに保存します。

```bash
printf %s 'sk-or-v1-あなたのキー' > ~/.codex/openrouter.key
chmod 600 ~/.codex/openrouter.key
```

環境変数（`env_key`）でも渡せますが、ファイルにしておくとアプリから起動したときにも読めます。Finderやドックから起動したアプリは`.zshrc`の`export`を引き継がないので、あとでアプリでも使うつもりならファイル方式のほうが安全です。

### 2. config.tomlにプロバイダを足す

`~/.codex/config.toml`の末尾に追記します。既存の行は触りません。

```toml
[model_providers.openrouter]
name = "OpenRouter"
base_url = "https://openrouter.ai/api/v1"
wire_api = "responses"

[model_providers.openrouter.auth]
command = "/bin/cat"
args = ["/Users/yourname/.codex/openrouter.key"]
```

:::message alert
`args`のパスは**絶対パスで書いてください**。`~`は展開されません。`["~/.codex/openrouter.key"]`と書くと、`cat: ~/.codex/openrouter.key: No such file or directory`で起動に失敗します。
:::

`auth.command`は「標準出力にトークンを吐くコマンド」で、その出力がそのまま`Authorization: Bearer ...`になります。末尾の改行はCodex側でトリムされるので、`echo`でも`printf`でも構いません。

macOSのキーチェーンから読ませることもできます。

```toml
[model_providers.openrouter.auth]
command = "/usr/bin/security"
args = ["find-generic-password", "-s", "openrouter-api-key", "-w"]
```

### 3. プロファイルを作る

`$CODEX_HOME/<名前>.config.toml`を置くと、`codex -p <名前>`でその内容がベース設定に重なります。

```bash
cat > ~/.codex/or-nex.config.toml <<'TOML'
model_provider = "openrouter"
model = "nex-agi/nex-n2.5-pro:free"
model_reasoning_effort = "low"
TOML
```

モデルごとに1ファイル作れば、そのまま切り替えメニューになります。

```text
~/.codex/
├── config.toml                  # プロバイダ定義。グローバルはOpenAIのまま
├── or-nex.config.toml           # codex -p or-nex
├── or-nemotron.config.toml      # codex -p or-nemotron
└── or-ling.config.toml          # codex -p or-ling
```

### 4. 動作確認

```bash
codex exec -p or-nex --skip-git-repo-check -s read-only \
  'Run the shell command: echo ok — then report the exact output.'
```

こうなれば成功です。

```text
model: nex-agi/nex-n2.5-pro:free
provider: openrouter
reasoning effort: low

exec
  /bin/zsh -lc 'echo ok'
  succeeded in 0ms:
  ok
```

`exec`の行が出て、シェルの出力が返ってきていることを確認してください。**ツール呼び出しが通ることが重要**です。テキストが返るだけならチャットと変わりません。Codexがエージェントとして機能するには、モデルがtool callを正しく発行できる必要があります。

素の`codex`（プロファイル指定なし）は、これまでどおりChatGPTのアカウントとOpenAIモデルで動きます。

## 最小手順2：アプリで動かす

Codexアプリにはプロファイルを選ぶUIがありません。アプリでOpenRouterを使うには、`CODEX_HOME`を分けた2つ目のインスタンスを立てます。

準備と起動には、このために作ったツール[codexSwitch](https://github.com/ttokunaga-ja/codexSwitch)を使います。macOSとWindowsで同じコマンドで動きます（個人で作った非公式のツールで、OpenAIとは関係ありません）。手順は4つです。

### 1. codexSwitchを入れる

macOSでは次のようにインストールします。Rustが必要です。Windowsの手順はREADMEにあります。

```bash
git clone https://github.com/ttokunaga-ja/codexSwitch.git
cd codexSwitch
./install.sh   # ~/.local/bin/codexSwitch に入ります
```

2つ目のインスタンスは、Codexの設定・履歴を`~/.codex-switch`に、Electron（アプリの外側）のプロファイルを`~/Library/Application Support/codex-switch/user-data`に持ちます。どちらも本体とは別の場所で、次の準備と初回の起動で作られます。

### 2. 準備する

```bash
codexSwitch init
```

2つ目のインスタンスの設定（`~/.codex-switch/config.toml`）とモデル一覧（`~/.codex-switch/model_catalog.json`）を作り、最後にAPIキーの置き場所を案内します。何度実行しても安全で、あるものはそのまま使い、足りないものだけを足します。

### 3. APIキーを入れる

最小手順1の1.で`~/.codex/openrouter.key`に置いたキーが、そのまま使われます。まだの場合は、initの途中で貼り付けるか（画面には表示されません）、案内されたファイルに入れてください。

### 4. 起動する

```bash
codexSwitch -openrouter
```

2つ目のウィンドウが開き、モデルピッカーにカタログで指定したモデルが並びます。本体のウィンドウは開いたままで構いません。次からは`codexSwitch`だけで、前回と同じ内容で起動します。モデルを指定するときは`codexSwitch -openrouter --model inclusionai/ling-3.0-flash-vl:free`のようにします。

起動するときは、OpenRouterのキーだけを確かめます。入っていなければ、キーのファイルの場所と入れ方を表示して止まります。

`-openrouter` / `-zai`とモデルは起動時にしか読まれません。変えるときは、アプリを終了してから実行し直します。ウィンドウを閉じるだけでは終了しないので、macOSでは⌘Q、Windowsでは通知領域のアイコンを右クリックして「Exit」で終了してください。

codexSwitchがmacOSで内部的に実行しているのは、次のコマンドです。`open --env`はmacOSの`open`コマンドの機能で、`open --help`に記載があります。

```bash
open -n \
  --env "CODEX_HOME=$HOME/.codex-switch" \
  --env "CODEX_ELECTRON_USER_DATA_PATH=$HOME/Library/Application Support/codex-switch/user-data" \
  /Applications/ChatGPT.app \
  --args --user-data-dir="$HOME/Library/Application Support/codex-switch/user-data"
```

### initが作る設定

`~/.codex-switch/config.toml`は、`codexSwitch -openrouter`で起動したあと次のようになっています（macOSの例）。ここでは**グローバルの`model_provider`を設定しています**。`CODEX_HOME`が本体と分かれているので、本体の既定には影響しません。

```toml
# >>> codexSwitch managed: active provider >>>
model_provider = "openrouter"
model = "nex-agi/nex-n2.5-pro:free"
model_catalog_json = "/Users/yourname/.codex-switch/model_catalog.json"
model_reasoning_effort = "low"
# <<< codexSwitch managed: active provider <<<

[model_providers.openrouter]
name = "OpenRouter"
base_url = "https://openrouter.ai/api/v1"
wire_api = "responses"
requires_openai_auth = false

[model_providers.openrouter.auth]
command = "/bin/cat"
args = ["/Users/yourname/.codex/openrouter.key"]
```

実際のファイルには、[別記事](https://zenn.dev/ttokunaga-ja/articles/2026-09-23-codex-switch-zai-coding-plan)で使うZ.aiの定義も同じ形で入っています。先頭の2行のコメントで囲んだ部分（管理ブロック）は、codexSwitchが起動のたびに書き換えます。この2行は消さないでください。

`requires_openai_auth = false`がポイントです。この隔離ホームにはChatGPTの認証情報がないため、これを指定しないとアプリがサインインを要求します。指定すると、アプリが参照する内部サーバが次のように応答するようになります。

```json
{"account": null, "requiresOpenaiAuth": false}
```

アカウントは空のまま、サインイン不要で使える状態です。APIキーだけが認証情報になります。

キーは設定ファイルに書かず、本体のCLIと同じ`~/.codex/openrouter.key`から読みます。キーの置き場が1箇所で済みます。

### モデルピッカーの中身

`model_catalog_json`で指定したファイル（`~/.codex-switch/model_catalog.json`）が、アプリのモデル選択メニューの中身になります。initは、Codexのツール呼び出しが通ることを確かめた無料モデル3つ（後述）でこのファイルを作ります。モデルを足すときは、このファイルを編集します。

このカタログはスキーマが厳しく、必須のフィールドが1つでも欠けると`missing field shell_type`のようなエラーで読み込まれません。1モデルにつき、次の形で書いてください。

```json
{
  "models": [
    {
      "slug": "nex-agi/nex-n2.5-pro:free",
      "display_name": "Nex N2.5 Pro (free)",
      "description": "Vision + computer use",
      "priority": 1,
      "visibility": "list",
      "context_window": 262144,
      "max_context_window": 262144,
      "input_modalities": ["text", "image"],
      "default_reasoning_level": "low",
      "supported_reasoning_levels": [
        {"effort": "low", "description": "Light reasoning"},
        {"effort": "medium", "description": "Balanced reasoning"},
        {"effort": "high", "description": "Enhanced reasoning"}
      ],
      "default_reasoning_summary": "none",
      "base_instructions": "",
      "shell_type": "shell_command",
      "apply_patch_tool_type": "freeform",
      "effective_context_window_percent": 95,
      "experimental_supported_tools": [],
      "support_verbosity": false,
      "supported_in_api": true,
      "supports_parallel_tool_calls": true,
      "supports_reasoning_summaries": true,
      "truncation_policy": {"limit": 10000, "mode": "bytes"}
    }
  ]
}
```

この形は、Z.aiがCodex向けに配信しているカタログ（[別記事](https://zenn.dev/ttokunaga-ja/articles/2026-09-23-codex-switch-zai-coding-plan)で扱います）に合わせたものです。OpenAI以外のモデルを想定して作られているので、そのまま雛形に使えます。

:::message alert
**`codex debug models`の出力を複製してカタログを作らないでください。** そこに並んでいるのはOpenAIのモデルの定義で、OpenAIのモデル専用の`"tool_mode": "code_mode_only"`が含まれています。新しい版のCodexはこの指定に従い、ツールを1つずつではなくJavaScript実行用の入れ物（`namespace`）にまとめて送るため、OpenAI以外のモデルはリクエストを受け付けません。

厄介なのは、**古い版のCodexではこの指定が使われず、問題なく動いてしまう**ことです。アプリの更新をきっかけに、ある日突然動かなくなります。詳しくは落とし穴で説明します。
:::

`input_modalities`は正しく申告してください。画像を持たないモデルに`image`を入れると、Codexが画像を送れると誤判断します。`visibility`を`"hide"`にすると、カタログには残したままピッカーから隠せます。

### 二重起動が通る理由

普通、macOSアプリは2つ目のインスタンスが起動しません。ここが通るのは、Codexアプリが`CODEX_ELECTRON_USER_DATA_PATH`を見て挙動を変えているからです。

この環境変数が設定されているときだけ単一インスタンスのロックを取りにいき、ロックはユーザーデータディレクトリごとに分かれます。つまり`--user-data-dir`が違えば別のロックになり、2つ目が起動できます。

これは裏技ではなく、アプリ自身が同じ起動方法を内部に持っています。アプリのバンドルを覗くと、`~/.codex-demo`を別ホームとして第2インスタンスを起動する処理が入っていて、コマンドの形は上のコマンドとほぼ同じです。

## 無料モデルで実際に動かす

OpenRouterには`:free`のモデル群があり、**残高ゼロのキーでも通ります**。

日次のリクエスト上限があり、クレジットを\$10以上追加すると上限が上がります。手元では追加前後でこうなりました。

```text
追加前: free_model_daily_requests = {limit: 50}
追加後: free_model_daily_requests = {limit: 1000}
```

Codexのエージェントは1ターンあたり最低2リクエスト（初回＋ツール結果の返し）を使うので、50だと実質20〜25ターン、1000なら400〜500ターン程度が目安です。

### 実際に回ったモデル

無料モデルは440件中24件、うち画像入力とtool callの両方に対応しているのは11件でした（執筆時点）。その中からCodexのループを完走したものを挙げます。

| モデル | コンテキスト | 画像 | 結果 |
| --- | ---: | :---: | --- |
| `nex-agi/nex-n2.5-pro:free` | 262,144 | ○ | ツール実行・画像とも成功 |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | 1,000,000 | – | ツール実行成功 |
| `inclusionai/ling-3.0-flash-vl:free` | 262,144 | ○ | ツール実行・画像とも成功 |

Nexは「ブラウザやデスクトップを操作しながらコードを直す」用途を想定したモデルで、今回の3つの中ではGUI操作に一番向いています。Nemotronは100万トークンのコンテキストがあるので、大きな差分をまとめて読ませるレビュー用途に向きます。Lingは別ベンダーの視覚モデルなので、Nexとのクロスチェックに使えます。

### 画像入力も通るか

「画像入力対応」と書いてあっても、実際に経路が通るかは別問題です。合成画像で確かめました。

左半分が純赤、右半分が純青の64×32ピクセルのPNGを作り、Responses API経由で「左右それぞれ何色か」を聞きます。

```text
Q: What are the two colors in this image, left and right?
A: Red left, blue right.
```

NexもLingも正答しました。画像がモデルまで届いていることが確認できます。

:::message
Lingは`max_output_tokens`が小さいと、推論トークンだけで予算を使い切って本文が空になります。手元では80だと空、2000にすると正答しました。Codexで使うときは`model_reasoning_effort`を`low`にしておくと安定します。
:::

### Codexはカスタムプロバイダにもツールを渡す

「OpenAI以外のモデルには、Codexがツールを渡してくれないのでは」という懸念があります。実際に送信されたリクエストを覗いて確認しました。

ローカルにHTTPサーバを立てて`base_url`をそこへ向け、リクエストボディの`tools`配列を記録します。カスタムプロバイダに対して、次の12個が渡っていました。

```text
exec_command        write_stdin         apply_patch
view_image          web_search          request_user_input
multi_agent_v1      mcp__cua_repl       mcp__node_repl
list_mcp_resources  list_mcp_resource_templates  read_mcp_resource
```

`view_image`で画像ファイルを読み、`mcp__cua_repl`（コンピュータ操作）や`mcp__node_repl`（ブラウザサービスのホスト）も含まれています。**プロバイダによる出し分けはしていません。**

アプリが参照する能力情報も、OpenAI・OpenRouterのどちらでも同じ値が返りました。

```json
{"namespaceTools": true, "imageGeneration": true, "webSearch": true}
```

つまり、視覚を持つモデルを繋げば、その能力を活かす前提条件は整っています。

## 落とし穴

### wire_api = "chat" は廃止されている

古い記事やテンプレートには`wire_api = "chat"`と書かれていることがありますが、現在のCodexは起動時に拒否します。

```text
Error: `wire_api = "chat"` is no longer supported.
How to fix: set `wire_api = "responses"` in your provider config.
```

つまり**接続先がOpenAI Responses APIを提供していないとCodexからは使えません**。OpenAI互換を謳っていても`/chat/completions`しかないサービスは、そのままでは繋がりません。OpenRouterは`/api/v1/responses`を提供しているので問題ありません。

### 1インスタンスに複数プロバイダは混ぜられない

「モデル一覧にOpenAIとOpenRouterを並べて、クリックで切り替える」はできません。

`model_provider`は`CODEX_HOME`ごとに1つのグローバル設定で、カタログのエントリ側にプロバイダを持たせることができないからです。カタログに`model_provider`を書いても無視されます。

スレッドは自分が動いたプロバイダを記録しますが、これは記録用で、UIから選ぶ導線はありません。**プロバイダを分けたいならインスタンスを分ける**、が現状の答えです。

### authとenv_keyは併用できない

両方書くと起動しません。

```text
Error loading config.toml: model_providers.openrouter:
provider auth cannot be combined with env_key
```

どちらか一方にしてください。

### プロバイダIDには予約語がある

`openai`・`ollama`・`lmstudio`は組み込みで、上書きしようとするとエラーになります。

```text
Error: model_providers contains reserved built-in provider IDs: `openai`.
Built-in providers cannot be overridden.
```

`openrouter`や`zai`のような名前は自由に使えます。

### パスの`~`は展開される場所とされない場所がある

ここは実際に踏みました。

| 設定 | `~` |
| --- | :---: |
| `model_catalog_json` | 展開される |
| `model_providers.<id>.auth.args` | **展開されない** |

`auth.args`はコマンドの引数としてそのまま渡るだけなので、シェルを経由しません。絶対パスで書いてください。

### カタログを指定すると警告が消える

カタログに載っていないモデルを指定すると、毎回この警告が出ます。

```text
warning: Model metadata for `nex-agi/nex-n2.5-pro:free` not found.
Defaulting to fallback metadata; this can degrade performance and cause issues.
```

動作はしますが、コンテキスト長などが既定値になります。`model_catalog_json`を設定すると消えます。

### OpenAIのモデル定義を複製したカタログは、他社モデルで動かない

カタログをゼロから書くのは面倒なので、`codex debug models`の出力から1件複製して書き換えたくなります。私も最初はそうしていて、この記事の検証環境（Codexアプリ同梱のcodex-cli 0.155.0-alpha.9.2）では問題なく動いていました。

ところが、より新しい版のcodex（Homebrew版のcodex-cli 0.155.1や、Windows版アプリ同梱の0.155.0-alpha.16.3）で同じカタログを使うと、最初のリクエストで止まります。

```text
400 Provider returned error
tools[0].function: missing field `parameters`
```

実際に送られたリクエストを確認すると、古い版では12個並んでいたツールが、1つの入れ物にまとめられていました。

```json
{"type":"namespace","name":"functions","tools":[{"type":"custom","name":"exec", ...
```

原因は、複製元のOpenAIのモデル定義に含まれていた`"tool_mode": "code_mode_only"`です。新しい版のcodexはこれに従い、ツール群をJavaScriptで呼び分ける「コードモード」の形で送ります。OpenRouter経由の他社モデルはこの形式を扱えません。

同じ条件で比べた結果です。

| カタログ | codex-cli 0.155.1 |
| --- | --- |
| OpenAIのモデル定義を複製（`tool_mode`あり） | ✗ 400 |
| 前述の最小の形（`tool_mode`なし） | ✓ ツール実行に成功 |

複製して作ったカタログを使っている場合は、少なくとも`tool_mode`を取り除いてください。OpenAIのモデル向けの項目はほかにも含まれているので、前述の最小の形で書き直すのが確実です。

### 無料モデルはupstream側で落ちていることがある

OpenRouterの日次上限とは別に、モデルを提供している事業者側の混雑があります。手元では次のような状態に遭遇しました。

```text
poolside/laguna-s-2.1:free  → 429 temporarily rate-limited upstream（連続3回とも）
qwen/qwen3.8-27b:free       → 429
google/gemma-4-31b-it:free  → 429
```

また、一部のモデルは利用元を制限しています。

```text
thinkingmachines/inkling:free
→ 403 only available on agentic harnesses.
   Try plugging it into a coding agent or productivity app listed on ...
```

これはOpenRouterに登録されたアプリ限定のゲートで、カスタムプロバイダ経由では通りませんでした。`HTTP-Referer`や`X-Title`を付けても変わりません。

**無料モデルを監査パイプラインなどに固定で組み込むなら、フォールバックを用意してください。**

## Q&A

### ChatGPTのログインが消えたりしませんか

消えません。認証情報は`CODEX_HOME`ごとに独立しています。

2つ目のインスタンスを起動したあと、本体側を確認するとこうなります。

```bash
codex login status
# Logged in using ChatGPT
```

プロセスを見ても、本体は`~/.codex`、2つ目は`~/.codex-switch`を参照していて、混ざっていません。2つ目のウィンドウが「未ログイン」に見えるのは、そのホームに認証情報がないからで、正常な状態です。

### 本体のモデル一覧にOpenRouterのモデルを並べられますか

並べるだけなら`model_catalog_json`でできますが、**選んでも本体のプロバイダ（OpenAI）にそのモデル名が送られるだけ**で、エラーになります。前述のとおりカタログはプロバイダを束縛できないためです。

素直にインスタンスを分けてください。

### アプリを2つ同時に起動できますか

できます。`--user-data-dir`が違えば別インスタンスとして動きます。本体を開いたまま`codexSwitch -openrouter`を実行して問題ありません。

### スレッド履歴はどうなりますか

`CODEX_HOME`ごとに独立します。2つ目のインスタンスには本体の会話履歴は出てきません。用途を分けたい場合はむしろ好都合です。

本体の会話を2つ目のインスタンスで続けたいときは、`codexSwitch handoff <チャット名/ID>`で会話をコピーできます。引き継いだ会話全体がモデルに送られるので、長い会話ほど利用量が増えます。

### 無料モデルだけでコーディングエージェントを回せますか

回りますが、日次リクエスト数が効いてきます。1ターンあたり最低2リクエスト、ツールを何度も呼ぶタスクならもっと使います。

GUI操作のようにスクリーンショットごとに往復する用途は特に消費が激しいので、常用するなら上限を上げておくか、主力は別に置いて無料モデルは併走レビュー用に使うのが現実的です。

### キーをconfig.tomlに直接書きたくない

`auth.command`を使ってください。設定ファイルに秘密が残りません。キーチェーンから読む例は前述のとおりです。

`experimental_bearer_token`というフィールドもありますが、これはconfig.tomlに直書きする方式です。

### 設定が正しいかを起動前に確かめたい

`--strict-config`を付けると、認識できないフィールドがあるときにエラーになります。

```bash
codex exec --strict-config --ephemeral -s read-only -p or-nex 'hi'
```

タイプミスや古いフィールド名を使っていると、ここで止まります。

## まとめ

- `model_providers`を足せばOpenRouterは繋がる。`wire_api = "responses"`が必須
- グローバルの`model_provider`は書き換えず、プロファイルで切り替える
- アプリで使うなら`CODEX_HOME`と`CODEX_ELECTRON_USER_DATA_PATH`を分けた2つ目のインスタンスを立てる。本体は無傷のまま。codexSwitchなら`codexSwitch init`で準備し、`codexSwitch -openrouter`で起動する
- 1インスタンス＝1プロバイダ。混在はできない
- モデルカタログはOpenAIのモデル定義を複製せず、最小の形で書く。複製すると新しい版のCodexで動かなくなる
- 無料モデルでもツール呼び出しと画像入力は通る。ただしupstream側の混雑と日次上限は織り込む

同じ仕組みでZ.aiのCoding Planを繋ぐ方法は別記事に書きました。サブスクの定額枠をCodexから使う話です。

- [Z.ai Coding PlanをCodexアプリで使う](https://zenn.dev/ttokunaga-ja/articles/2026-09-23-codex-switch-zai-coding-plan)

## 参考資料

- [OpenRouter Models](https://openrouter.ai/models)
- [OpenRouter Pricing](https://openrouter.ai/pricing)
- [openai/codex](https://github.com/openai/codex)
