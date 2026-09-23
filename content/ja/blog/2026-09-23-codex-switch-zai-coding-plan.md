---
title: "Z.ai Coding PlanをCodexアプリで使う"
abstract: "Codexを使っていて、こんな経験はありませんか。 作業の途中で、Codexの週間の利用上限を使い切ってしまった Appshots（前面のウィンドウを撮って会話に添える機能）やブラウザー、Computer Useが便利で、ほかのモデルでも使いたいと思った Z.aiのCoding Planを契約しているなら、その定額枠でCodexアプリを動かせます。アプリの画"
publishedAt: "2026-09-23"
canonicalUrl: "https://zenn.dev/t_tokunaga/articles/2026-09-23-codex-switch-zai-coding-plan"
tags:
  - "codex"
  - "glm"
  - "zai"
  - "ai"
  - "llm"
---

Codexを使っていて、こんな経験はありませんか。

- 作業の途中で、Codexの週間の利用上限を使い切ってしまった
- Appshots（前面のウィンドウを撮って会話に添える機能）やブラウザー、Computer Useが便利で、ほかのモデルでも使いたいと思った

Z.aiのCoding Planを契約しているなら、その定額枠でCodexアプリを動かせます。アプリの画面や機能はそのままに、中で動くモデルだけをZ.aiのGLMに替えます。ChatGPTの利用枠は使わないので、上限に達したあとも同じアプリで作業を続けられます。Appshotsも2つ目のインスタンスでそのまま使えます（Z.aiで画像を受け取れるのは、既定の`glm-5.3-flash`です）。

## 結論――Codex用のエンドポイントは`/api/v1`

Z.aiのCoding Planは、Codexからそのまま使えます。定額のサブスク枠で、GLMがCodexのエージェントループを回します。プロキシも変換レイヤも要りません。

ただし**接続先を間違えると「使えない」という結論になります**。Z.aiはツールごとに別のエンドポイントを持っているからです。

| 用途 | エンドポイント | API形式 |
| --- | --- | --- |
| Claude Code | `https://api.z.ai/api/anthropic` | Anthropic Messages |
| OpenCode / Cline | `https://api.z.ai/api/coding/paas/v4` | OpenAI chat/completions |
| **Codex** | **`https://api.z.ai/api/v1`** | **OpenAI Responses** |

Coding Planのドキュメントでよく見るのは`/api/coding/paas/v4`のほうですが、ここにCodexが必要とするResponses APIはありません。Codex用は`/api/v1`です。

```toml
[model_providers.zai]
name = "Z.ai Coding Plan"
base_url = "https://api.z.ai/api/v1"
wire_api = "responses"
```

この記事では、この設定でCLIとCodexアプリの両方から使えるようにします。

:::message
カスタムプロバイダの足し方、プロファイルの作り方、Codexアプリで2つ目のインスタンスを立てる方法は、前記事で詳しく書きました。共通部分はそちらを参照してください。
[CodexにOpenRouterを足して、ChatGPT枠を保ったまま別モデルを使う](https://zenn.dev/ttokunaga-ja/articles/2026-09-22-codex-switch-openrouter)
:::

## 検証環境

| 項目 | バージョン |
| --- | --- |
| Codex CLI | `codex-cli 0.155.1` |
| Codexアプリ | `26.915.31945` |
| OS | macOS 27.0 |
| プラン | Z.ai GLM Coding Plan |

## 最小手順

### 1. APIキーをファイルに置く

Z.aiのダッシュボードでCoding Plan用のAPIキーを取得し、ファイルに保存します。

```bash
printf %s 'あなたのキー' > ~/.codex/zai.key
chmod 600 ~/.codex/zai.key
```

すでにOpenCodeやClaude CodeでCoding Planを使っているなら、**同じキーがそのまま使えます**。用途ごとにキーを分ける必要はありません。

### 2. プロバイダを足す

`~/.codex/config.toml`の末尾に追記します。

```toml
[model_providers.zai]
name = "Z.ai Coding Plan"
base_url = "https://api.z.ai/api/v1"
wire_api = "responses"

[model_providers.zai.auth]
command = "/bin/cat"
args = ["/Users/yourname/.codex/zai.key"]
```

Z.aiの公式ドキュメントは`experimental_bearer_token`にキーを直接書く例を載せていますが、`auth.command`にしておくと設定ファイルに秘密が残りません。

:::message alert
`args`は絶対パスで書いてください。`~`は展開されません。
:::

プロファイルを1本作ります。

```bash
cat > ~/.codex/zai-glm.config.toml <<'TOML'
model_provider = "zai"
model = "glm-5.3"
model_reasoning_effort = "high"
TOML
```

グローバルの`model_provider`は書き換えません。素の`codex`はこれまでどおりChatGPTのアカウントで動きます。

### 3. モデルカタログはZ.aiが配信している

ここが気持ちのいいところです。`GET /api/v1/models`が、**Codex内部形式のモデルカタログをそのまま返します**。

```bash
curl -s https://api.z.ai/api/v1/models \
  -H "authorization: Bearer $(cat ~/.codex/zai.key)"
```

アプリで使うときは、後の「5. アプリで使う」で使うcodexSwitchがこの一覧を取得して保存するので、手で保存する必要はありません。

返ってくるJSONのフィールドを見ると、Codex向けに作られていることが分かります。

```json
{
  "models": [
    {
      "slug": "glm-5.3",
      "display_name": "glm-5.3",
      "description": "Z.ai's latest flagship model",
      "context_window": 1048576,
      "default_reasoning_level": "max",
      "supported_reasoning_levels": ["low", "high", "max"],
      "shell_type": "shell_command",
      "apply_patch_tool_type": "freeform",
      "supports_parallel_tool_calls": true,
      "visibility": "list"
    }
  ]
}
```

`shell_type`や`apply_patch_tool_type`といったCodex固有のフィールドまで含まれています。**カタログを自作する必要はありません**。取得したファイルを`model_catalog_json`に指定するだけで使えます。

配信されているのは次の3モデルでした（執筆時点）。

| slug | コンテキスト | カタログが申告するreasoning |
| --- | ---: | --- |
| `glm-5.3` | 1,048,576 | low / high / max（既定 max） |
| `glm-5.3-flash` | 1,048,576 | 同上 |
| `glm-5-turbo` | 204,800 | （空） |

:::message alert
このカタログをそのまま使うと、**アプリのEffortスライダーが2段しか出ません**。`glm-5-turbo`にいたってはEffortの申告が空です。codexSwitchは取得したときにこれを直します。原因と直し方は後述の落とし穴に書きました。
:::

### 4. 動作確認

```bash
codex exec -p zai-glm --skip-git-repo-check -s read-only \
  'Run the shell command: echo zai-ok — then report the exact output.'
```

```text
model: glm-5.3
provider: zai
reasoning effort: high

exec
  /bin/zsh -lc 'echo zai-ok'
  succeeded in 0ms:
  zai-ok

codex
  `zai-ok`
tokens used 48,065
```

`exec`が出てシェルの出力が返っていれば成功です。**tool callが通ることが重要**で、ここが通らないとCodexはコマンドを一切実行できず、エージェントとして機能しません。

### 5. アプリで使う

Codexアプリで使うには、前記事と同じく`CODEX_HOME`を分けた2つ目のインスタンスを立てます。準備と起動には、このために作ったツール[codexSwitch](https://github.com/ttokunaga-ja/codexSwitch)を使います。macOSとWindowsで同じコマンドで動きます（個人で作った非公式のツールで、OpenAIとは関係ありません）。手順は4つです。

#### 1. インストールする

macOSでは次のようにインストールします。Rustが必要です。Windowsの手順はREADMEにあります。

```bash
git clone https://github.com/ttokunaga-ja/codexSwitch.git
cd codexSwitch
./install.sh   # ~/.local/bin/codexSwitch に入ります
```

#### 2. 準備する

```bash
codexSwitch init
```

2つ目のインスタンスの設定（`~/.codex-switch/config.toml`）とモデル一覧を作り、最後にAPIキーの置き場所を案内します。設定の中身は、2.で`~/.codex/config.toml`に足したのと同じ`[model_providers.zai]`に、`requires_openai_auth = false`を加えたものです。これで、ChatGPTへのサインインなしで動きます。

#### 3. APIキーを入れる

1.で`~/.codex/zai.key`に置いたキーが、そのまま使われます。まだの場合は、initの途中で貼り付けるか（画面には表示されません）、案内されたファイルに入れてください。

#### 4. 起動する

```bash
codexSwitch -zai
```

初回は、3.のモデル一覧をZ.aiから取得し、Effortの段を広げてから起動します。モデルは`glm-5.3-flash`で起動します。別のモデルにしたいときは`codexSwitch -zai --model glm-5.3`のように指定します。次からは`codexSwitch`だけで、前回と同じ内容で起動します。

起動するときは、Z.aiのキーだけを確かめます。使っていないOpenRouterのキーを求めることはありません。キーが入っていなければ、キーのファイルの場所と入れ方を表示して止まります。

モデルピッカーに`glm-5.3`・`glm-5.3-flash`・`glm-5-turbo`が並びます。

本体のアプリと並べると次のようになります。左が2つ目のインスタンスで、左下にプロバイダ名の「Z.ai Coding Plan」、入力欄にモデルの`glm-5.3-flash`が出ています。右の本体は、ChatGPTの利用上限に達した状態でもそのまま残ります。

![macOSで、Z.ai Coding Planで動く2つ目のインスタンス（左）と本体のCodexアプリ（右）を並べて起動した画面](/images/blog/2026-09-23-codex-switch-zai-coding-plan/2026-09-23-codex-switch-zai-coding-plan/codex-app-two-instances-macos.png)

![Windows版のCodexアプリでも、Z.ai Coding Planの2つ目のインスタンス（左）と本体（右）を並べて起動できる](/images/blog/2026-09-23-codex-switch-zai-coding-plan/2026-09-23-codex-switch-zai-coding-plan/codex-app-two-instances-windows.png)

なお、1つのインスタンスで同時に使えるのはZ.aiかOpenRouterのどちらかで、`-zai` / `-openrouter`とモデルは起動時にしか読まれません。initは前記事のOpenRouterの定義も同時に作るので、OpenRouterのキーを入れておけば、アプリを終了してから指定し直すだけで切り替えられます。

```bash
codexSwitch -openrouter   # OpenRouter
codexSwitch -zai          # Z.ai Coding Plan
```

ウィンドウを閉じるだけでは、アプリは終了せずに動き続けます。macOSでは⌘Q、Windowsでは通知領域のアイコンを右クリックして「Exit」で終了してください。起動中に別のプロバイダを指定すると、codexSwitchはアプリを止めずに、終了のしかたを表示して止まります。

本体のアプリで進めていた会話を、Z.aiで続けることもできます。

```bash
codexSwitch handoff <チャット名/ID>
```

会話を2つ目のインスタンスへコピーし、Z.aiのモデルで続きを始めます。引き継いだ会話全体がモデルに送られるので、長い会話ほど利用枠を多く使います。詳しくはREADMEを参照してください。

## サブスク枠で動いていることの確認

「本当に定額枠を使っているのか、従量課金になっていないか」は気になるところです。対照実験で確認できます。

同じキーを、通常の従量課金エンドポイントに投げてみます。

```bash
curl -s https://api.z.ai/api/paas/v4/chat/completions \
  -H "authorization: Bearer $(cat ~/.codex/zai.key)" \
  -H 'content-type: application/json' \
  -d '{"model":"glm-5.3","messages":[{"role":"user","content":"hi"}],"max_tokens":4}'
```

```json
{"error":{"code":"1113","message":"Insufficient balance or no resource package. Please recharge."}}
```

従量課金の残高はゼロです。それでも`/api/v1`では正常に応答が返ってきます。つまり`/api/v1`はCoding Planのサブスク枠で動いている、ということになります。

## 落とし穴

### Claude Code用のbase_urlではCodexは動かない

私は最初、この設定で「Z.aiはCodexから使えない」と結論しました。Coding Planのドキュメントに出てくる`/api/coding/paas/v4`を起点に、Responses APIの経路を総当たりしたからです。

```text
/api/coding/paas/v4/responses        → 404 {"path":"/v4/responses"}
/api/coding/paas/v1/responses        → 404
/api/coding/paas/responses           → 404
/api/paas/v4/responses               → 404
/api/coding/paas/v4/openai/v1/responses → 404
```

どこにもありません。一方、同じキーで`/api/coding/paas/v4/chat/completions`は200を返します。**キーは有効なのにResponses APIだけが無い**、という状態です。

Codexは`wire_api = "chat"`を廃止しているので、chat形式しかないなら変換プロキシを書くしかない——というのが当時の結論でした。

実際には`/api/v1`という別系統があり、そこにResponses APIがありました。Z.aiは接続先のツールごとにエンドポイントを分けていて、Coding Planのドキュメントで目立つのはClaude CodeとOpenCode向けのものです。Codex向けは別ページに載っています。

**「Responses APIが無いから無理」と判断する前に、そのサービスのCodex向けドキュメントを探してください。**

### Coding Planのキーは従量エンドポイントでは使えない

前述のとおり、Coding Planのキーを`/api/paas/v4`に投げると残高不足で弾かれます。サブスク枠が使えるのはCoding Plan用のエンドポイントだけです。

これは、別のゲートウェイ（OpenRouterのBYOKなど）を経由してサブスク枠を使う、という構成が成立しないことも意味します。

### Effortスライダーが2段しか出ない

Z.aiのカタログをそのまま使うと、アプリのEffort選択が「低 / 高」の2段になります。`glm-5-turbo`は申告が空なので、そもそも選択肢が出ません。

原因は、**カタログの申告値とアプリ側の許可リストの積集合**が取られるためです。

```text
カタログの申告          low / high / max
アプリの既定の許可リスト  low / medium / high / xhigh / ultra / persistent
                        ↓ 積集合
UIに出る段               low / high        ← 2段
```

アプリには`enabled-reasoning-efforts`という内部設定があり、既定値が`["low","medium","high","xhigh","ultra","persistent"]`です。**ここに`max`が入っていません**。そのためZ.aiが申告する3段のうち`max`が落ちて、2段になります。

この設定はローカルには保存されておらず、内蔵の既定値がそのまま効いています。つまりアプリ側から直す手段はありません。

一方、**Z.ai側は8段すべてを受け付けます**。実際に`/api/v1/responses`へ各値を投げると、いずれも200が返ります。

```text
none / minimal / low / medium / high / xhigh / max / ultra  → すべて 200
```

つまりカタログの申告が実際の対応より狭いだけです。カタログを書き換えれば直ります。codexSwitchは、Z.aiからカタログを取得したときに次の書き換えを自動で行います。

```json
"supported_reasoning_levels": [
  {"effort": "low",    "description": "Light reasoning"},
  {"effort": "medium", "description": "Balanced reasoning"},
  {"effort": "high",   "description": "Enhanced reasoning"},
  {"effort": "xhigh",  "description": "Extended reasoning"},
  {"effort": "max",    "description": "Deep reasoning"}
],
"default_reasoning_level": "high"
```

これでスライダーは`低 / 中 / 高 / 最高`の4段になります。`max`は許可リストに無いのでUIには出ませんが、CLIからは指定できます。

```bash
codex -p zai-glm -c model_reasoning_effort="max"
```

`default_reasoning_level`を`high`にしているのは、UIで選べない`max`を既定にしておくと表示と実際がずれるためです。

:::message
カタログを手で取り直すと、この修正は消えます。codexSwitchで取り直すときは、`~/.codex-switch/zai_models.json`を消してから`codexSwitch -zai`で起動してください。取得と書き換えをやり直します。
:::

### アプリ側はプロバイダを起動時にしか読まない

`model_provider`は起動時に解決されます。設定を書き換えても、開いているウィンドウには反映されません。切り替えるときは一度終了してから起動し直してください。ウィンドウを閉じるだけでは終了しない点に注意してください（macOSでは⌘Q）。

## Q&A

### Claude Codeで使っているbase_urlをそのまま流用できますか

できません。Claude Code用は`/api/anthropic`（Anthropic Messages形式）で、Codexが要求するResponses APIとは別物です。Codexには`/api/v1`を指定してください。

### 従量課金が発生しませんか

`/api/v1`はCoding Planの枠で動きます。同じキーを従量エンドポイントに投げると残高不足で弾かれることから確認できます（前述）。

### model_catalog_jsonは自分で書く必要がありますか

不要です。`GET /api/v1/models`がCodex形式のカタログをそのまま返すので、保存して指定するだけです。codexSwitchを使えば、取得も自動です。モデルが増えたら、`~/.codex-switch/zai_models.json`を消して起動し直せば取り直します。

### OpenCodeやClaude Codeと併用できますか

できます。エンドポイントが違うだけで、キーは共通です。OpenCodeは`/api/coding/paas/v4`、Claude Codeは`/api/anthropic`、Codexは`/api/v1`を見ます。同じCoding Planの枠を共有します。

### 使えるモデルは何ですか

執筆時点で`glm-5.3`・`glm-5.3-flash`・`glm-5-turbo`の3つです。最新の一覧は`GET /api/v1/models`で取れます。

### Effortを「中」にしたいのに選択肢に出てきません

Z.aiのカタログが`low` / `high` / `max`しか申告しておらず、さらにアプリ側の許可リストが`max`を含まないため、2段だけになります。Z.ai自体は`medium`も`xhigh`も受け付けるので、カタログを書き換えれば4段になります。詳しくは落とし穴の「Effortスライダーが2段しか出ない」を参照してください。

### 同じ方法でClaude Proのサブスクも使えますか

使えません。理由は2つあります。

1つ目は技術的な理由です。Anthropicの公式APIにResponses APIがありません。

```text
https://api.anthropic.com/v1/responses         → 404 not_found_error
https://api.anthropic.com/v1/chat/completions  → 401（経路は存在する）
```

OpenAI互換の`/v1/chat/completions`はありますが、Codexが`chat`を拒否するため使えません。Z.aiのようなCodex専用エンドポイントも見当たりませんでした。

2つ目は規約上の理由です。Claude ProやMaxの枠を使うには、Claude Codeが持つOAuthトークンをCodexへ流すことになります。Anthropicのサブスクは自社クライアントでの利用を前提としているため、第三者クライアントへ転用するのはおすすめできません。ローカルプロキシを立てれば技術的には可能ですが、アカウント側の措置を招くリスクがあります。

AnthropicのAPIキー（従量課金）を使う場合も、Responses APIが無い以上、変換プロキシが別途必要になります。そしてそれは「サブスクを使う」ことにはなりません。

Claudeを使いたい場合は、Claude Code CLIをそのまま使うのが素直です。Codexのハーネスに統一したいという要求だけが満たせない、という整理になります。

## まとめ

- Z.ai Coding Planは、`base_url = "https://api.z.ai/api/v1"`・`wire_api = "responses"`でCodexから使える
- Claude Code用・OpenCode用とはエンドポイントが違う。ここを間違えると「使えない」と誤判断する
- モデルカタログはZ.aiがCodex形式で配信しているので自作不要。ただしEffortの申告が実際より狭く、そのままだとスライダーが2段になるので書き換える
- 定額枠で動く。従量エンドポイントでは同じキーが残高不足で弾かれることから確認できる
- Claude Proのサブスクは同じ方法では使えない

## 参考資料

- [Z.AI Developer Document — Codex](https://docs.z.ai/devpack/tool/codex)
- [Z.AI Developer Document — GLM Coding Plan](https://docs.z.ai/devpack/overview)
- [CodexにOpenRouterを足して、ChatGPT枠を保ったまま別モデルを使う](https://zenn.dev/ttokunaga-ja/articles/2026-09-22-codex-switch-openrouter)
