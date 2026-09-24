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

この記事では、Codexアプリの画面や機能はそのままに、中で動くモデルだけをOpenRouterのモデルに替える方法を紹介します。ChatGPTの利用枠は使わず、本体のCodexにも手を加えません。Appshotsも2つ目のインスタンスでそのまま使えます（画像を受け取れるモデルを選んでください）。Computer Useやブラウザー操作に使うツールがOpenRouterのモデルにもそのまま渡ること、画像入力が通ることも、後半で確かめています。

## 結論――codexSwitchで3ステップ

Codexアプリの**2つ目のインスタンス**を、OpenRouterのモデルで起動します。本体のアプリと設定には一切触れません。

```text
~/.codex        → ChatGPT / OpenAIモデル     （本体・そのまま）
~/.codex-switch → OpenRouter                 （2つ目のインスタンス）
```

準備と起動は、このために作ったツール[codexSwitch](https://github.com/ttokunaga-ja/codexSwitch)が行います。macOSとWindowsで同じコマンドで動きます（個人で作った非公式のツールで、OpenAIとは関係ありません）。

実際に並べると次のようになります。左が2つ目のインスタンス、右が本体です。画面の2つ目のインスタンスはZ.ai Coding Planで起動したものですが、OpenRouterでも同じように並びます。

![macOSで、2つ目のインスタンス（左、Z.ai Coding Planのglm-5.3-flash）と本体のCodexアプリ（右、ChatGPTのモデル）を並べて起動した画面](/images/blog/2026-09-22-codex-switch-openrouter/2026-09-22-codex-switch-openrouter/codex-app-two-instances-macos.png)

![Windows版のCodexアプリでも、2つ目のインスタンス（左）と本体（右）を並べて起動できる](/images/blog/2026-09-22-codex-switch-openrouter/2026-09-22-codex-switch-openrouter/codex-app-two-instances-windows.png)

## 手順

### 1. codexSwitchを入れる

macOSでは次のとおりです（Rustが必要です）。Windowsは[README](https://github.com/ttokunaga-ja/codexSwitch#1-インストールする)を見てください。

```bash
git clone https://github.com/ttokunaga-ja/codexSwitch.git
cd codexSwitch
./install.sh
```

### 2. 準備する

OpenRouterのダッシュボードでAPIキーを発行してから、次を実行します。

```bash
codexSwitch init
```

APIキーを聞かれたら、OpenRouterの欄に貼り付けます（画面には表示されません）。使わないZ.aiの欄は、そのままEnterで飛ばします。設定ファイルとモデル一覧は、ここで自動的に作られます。

### 3. 起動する

```bash
codexSwitch -openrouter
```

2つ目のウィンドウが開きます。本体のウィンドウは開いたままで構いません。次からは`codexSwitch`だけで、前回と同じ内容で起動します。

終了はアプリの画面から行います。macOSでは⌘Q、Windowsでは通知領域のアイコンを右クリックして「Exit」です。ウィンドウを閉じるだけでは終了しません。

本体で進めていた会話は、`codexSwitch handoff <チャット名/ID>`で2つ目のインスタンスへ引き継げます。モデルの指定などの使い方は[README](https://github.com/ttokunaga-ja/codexSwitch#使い方)にあります。

## 仕組み

Codexは`CODEX_HOME`ごとに接続先（`model_provider`）を1つしか持てず、アプリには接続先を選ぶ画面もありません。そこで、`CODEX_HOME`とElectronのユーザーデータを分けた2つ目のアプリを起動します。

普通、macOSアプリは2つ目のインスタンスが起動しません。ここが通るのは、Codexアプリが`CODEX_ELECTRON_USER_DATA_PATH`を見て、ユーザーデータのディレクトリごとに別のインスタンスとして動くからです。アプリ自身も、同じ方法で別ホームのインスタンスを起動する処理を持っています。

2つ目のインスタンスはChatGPTにサインインせず、APIキーだけで動きます。

## 無料モデルで実際に動かす

OpenRouterには`:free`のモデル群があり、**残高ゼロのキーでも通ります**。日次のリクエスト上限があり、クレジットを\$10以上追加すると上限が上がります。手元では、追加前は1日50回、追加後は1日1000回でした。

Codexのエージェントは1ターンあたり最低2リクエスト（初回とツール結果の返し）を使うので、50回だと実質20〜25ターン、1000回なら400〜500ターン程度が目安です。

### 実際に回ったモデル

無料モデルは440件中24件、うち画像入力とツール呼び出しの両方に対応しているのは11件でした（執筆時点）。その中からCodexのループを完走したものを挙げます。codexSwitchのinitは、この3つをモデル一覧に入れます。

| モデル | コンテキスト | 画像 | 結果 |
| --- | ---: | :---: | --- |
| `nex-agi/nex-n2.5-pro:free` | 262,144 | ○ | ツール実行・画像とも成功 |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | 1,000,000 | – | ツール実行成功 |
| `inclusionai/ling-3.0-flash-vl:free` | 262,144 | ○ | ツール実行・画像とも成功 |

Nexは「ブラウザやデスクトップを操作しながらコードを直す」用途を想定したモデルで、3つの中ではGUI操作に一番向いています。Nemotronは100万トークンのコンテキストがあるので、大きな差分をまとめて読ませるレビューに向きます。Lingは別ベンダーの視覚モデルなので、Nexとのクロスチェックに使えます。

### 画像入力も通るか

左半分が純赤、右半分が純青の小さなPNGを作り、「左右それぞれ何色か」を聞きました。NexもLingも「Red left, blue right.」と正答し、画像がモデルまで届いていることを確認できました。

### Codexはカスタムプロバイダにもツールを渡す

「OpenAI以外のモデルには、Codexがツールを渡してくれないのでは」という懸念があります。実際に送信されたリクエストを記録して確認しました。OpenRouterに対しても、次の12個が渡っていました。

```text
exec_command        write_stdin         apply_patch
view_image          web_search          request_user_input
multi_agent_v1      mcp__cua_repl       mcp__node_repl
list_mcp_resources  list_mcp_resource_templates  read_mcp_resource
```

`view_image`で画像ファイルを読み、`mcp__cua_repl`（コンピュータ操作）や`mcp__node_repl`（ブラウザサービスのホスト）も含まれています。**接続先による出し分けはしていません**。視覚を持つモデルを選べば、その能力を活かす前提条件は整っています。

## 注意点

### OpenRouterとZ.aiは同時に使えない

1つのインスタンスで使えるのは、OpenRouterかZ.aiのどちらかです。`-openrouter` / `-zai`とモデルは起動時にしか読まれないので、切り替えるときはアプリを終了してから起動し直します。起動中に別の指定をすると、codexSwitchは終了のしかたを表示して止まります。

### 無料モデルは提供元の都合で落ちることがある

OpenRouterの日次上限とは別に、モデルを提供している事業者側の混雑があります。手元では、`poolside/laguna-s-2.1:free`・`qwen/qwen3.8-27b:free`・`google/gemma-4-31b-it:free`が`429 temporarily rate-limited upstream`を返し続けました。

また`thinkingmachines/inkling:free`は、OpenRouterに登録されたアプリからしか使えない制限があり、Codexからは`403`で通りませんでした。

**無料モデルを作業の流れに固定で組み込むなら、代わりのモデルを用意しておいてください。**

## Q&A

### ChatGPTのログインが消えたりしませんか

消えません。認証情報は`CODEX_HOME`ごとに独立していて、本体は`~/.codex`、2つ目は`~/.codex-switch`を使います。2つ目のウィンドウが「未ログイン」に見えるのは、そのホームに認証情報がないからで、正常な状態です。

### アプリを2つ同時に起動できますか

できます。本体を開いたまま`codexSwitch -openrouter`を実行して問題ありません。

### 会話の履歴はどうなりますか

`CODEX_HOME`ごとに独立します。2つ目のインスタンスには本体の会話は出てきません。本体の会話を続けたいときは、`codexSwitch handoff <チャット名/ID>`で引き継げます。引き継いだ会話全体がモデルに送られるので、長い会話ほど利用量が増えます。

### 無料モデルだけでコーディングエージェントを回せますか

回りますが、日次のリクエスト数が効いてきます。GUI操作のように画面を撮るたびに往復する用途は特に消費が激しいので、常用するなら上限を上げておくか、主力は別に置いて無料モデルは併走のレビュー用に使うのが現実的です。

## まとめ

- `codexSwitch init`で準備し、`codexSwitch -openrouter`で起動するだけで、CodexアプリがOpenRouterのモデルで動く
- 本体のアプリとChatGPTの利用枠には触れない。2つ目のインスタンスとして並べて使う
- 無料モデルでもツール呼び出しと画像入力は通る。ただし日次上限と提供元の混雑は織り込む

同じ方法でZ.aiのCoding Planを使う話は別記事に書きました。サブスクの定額枠をCodexアプリから使う話です。

- [Z.ai Coding PlanをCodexアプリで使う](https://zenn.dev/t_tokunaga/articles/2026-09-23-codex-switch-zai-coding-plan)

## 参考資料

- [codexSwitch](https://github.com/ttokunaga-ja/codexSwitch)
- [OpenRouter Models](https://openrouter.ai/models)
- [OpenRouter Pricing](https://openrouter.ai/pricing)
- [openai/codex](https://github.com/openai/codex)
