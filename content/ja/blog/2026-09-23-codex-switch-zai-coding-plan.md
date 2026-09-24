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

## 結論――codexSwitchで3ステップ

Z.aiのCoding Planは、Codexアプリからそのまま使えます。定額のサブスク枠で、GLMがCodexのエージェントループを回します。プロキシも変換レイヤも要りません。

準備と起動は、このために作ったツール[codexSwitch](https://github.com/ttokunaga-ja/codexSwitch)が行います（[前記事](https://zenn.dev/t_tokunaga/articles/2026-09-22-codex-switch-openrouter)と同じツールです。個人で作った非公式のツールで、OpenAIとは関係ありません）。本体のCodexアプリとは別に、Z.ai用の2つ目のインスタンスを立てるので、本体には一切触れません。

## 手順

### 1. codexSwitchを入れる

macOSでは次のとおりです（Rustが必要です）。Windowsは[README](https://github.com/ttokunaga-ja/codexSwitch#1-インストールする)を見てください。

```bash
git clone https://github.com/ttokunaga-ja/codexSwitch.git
cd codexSwitch
./install.sh
```

### 2. 準備する

Z.aiのダッシュボードでCoding Plan用のAPIキーを取得してから、次を実行します。

```bash
codexSwitch init
```

APIキーを聞かれたら、Z.ai Coding Planの欄に貼り付けます（画面には表示されません）。使わないOpenRouterの欄は、そのままEnterで飛ばします。すでにOpenCodeやClaude CodeでCoding Planを使っているなら、**同じキーがそのまま使えます**。

設定ファイルと、Z.aiが配信しているモデル一覧は、ここで自動的に用意されます。

### 3. 起動する

```bash
codexSwitch -zai
```

2つ目のウィンドウが`glm-5.3-flash`で開き、モデルピッカーに`glm-5.3`・`glm-5.3-flash`・`glm-5-turbo`が並びます。次からは`codexSwitch`だけで、前回と同じ内容で起動します。

本体のアプリと並べると次のようになります。左が2つ目のインスタンスで、左下に「Z.ai Coding Plan」、入力欄にモデルの`glm-5.3-flash`が出ています。右の本体は、ChatGPTの利用上限に達した状態でもそのまま残ります。

![macOSで、Z.ai Coding Planで動く2つ目のインスタンス（左）と本体のCodexアプリ（右）を並べて起動した画面](/images/blog/2026-09-23-codex-switch-zai-coding-plan/2026-09-23-codex-switch-zai-coding-plan/codex-app-two-instances-macos.png)

![Windows版のCodexアプリでも、Z.ai Coding Planの2つ目のインスタンス（左）と本体（右）を並べて起動できる](/images/blog/2026-09-23-codex-switch-zai-coding-plan/2026-09-23-codex-switch-zai-coding-plan/codex-app-two-instances-windows.png)

終了はアプリの画面から行います。macOSでは⌘Q、Windowsでは通知領域のアイコンを右クリックして「Exit」です。ウィンドウを閉じるだけでは終了しません。

本体で進めていた会話は、`codexSwitch handoff <チャット名/ID>`でZ.aiに引き継げます。引き継いだ会話全体がモデルに送られるので、長い会話ほど利用枠を多く使います。モデルの指定などの使い方は[README](https://github.com/ttokunaga-ja/codexSwitch#使い方)にあります。

## Codex用の接続先は`/api/v1`

Z.aiは、つなぐツールごとに別のエンドポイントを持っています。

| 用途 | エンドポイント | API形式 |
| --- | --- | --- |
| Claude Code | `https://api.z.ai/api/anthropic` | Anthropic Messages |
| OpenCode / Cline | `https://api.z.ai/api/coding/paas/v4` | OpenAI chat/completions |
| **Codex** | **`https://api.z.ai/api/v1`** | **OpenAI Responses** |

Coding Planのドキュメントでよく見るのは`/api/coding/paas/v4`のほうですが、ここにはCodexが必要とするResponses APIがありません。私も最初はここを起点に調べて、「Z.aiはCodexから使えない」と結論しかけました。Codex用は別系統の`/api/v1`で、codexSwitchもこちらにつなぎます。

**「Responses APIが無いから無理」と判断する前に、そのサービスのCodex向けドキュメントを探してください。**

## サブスク枠で動いていることの確認

「本当に定額枠を使っているのか、従量課金になっていないか」は気になるところです。同じキーを、通常の従量課金のエンドポイント（`/api/paas/v4`）に送ると、残高不足で弾かれました。

```json
{"error":{"code":"1113","message":"Insufficient balance or no resource package. Please recharge."}}
```

従量課金の残高はゼロです。それでも`/api/v1`では正常に応答が返ってきます。つまり`/api/v1`はCoding Planのサブスク枠で動いています。

## Effortスライダーの段数

Z.aiのモデル一覧をそのまま使うと、アプリのEffort選択が「低 / 高」の2段になります。`glm-5-turbo`は申告が空なので、選択肢そのものが出ません。

原因は、**モデル一覧の申告とアプリ側の許可リストが重なる部分だけが表示される**ためです。

```text
Z.aiの申告              low / high / max
アプリの既定の許可リスト  low / medium / high / xhigh / ultra / persistent
                        ↓ 重なる部分
UIに出る段               low / high        ← 2段
```

一方、Z.ai側は`medium`や`xhigh`も含めてすべての段を受け付けます。申告が実際の対応より狭いだけなので、codexSwitchはモデル一覧を取得するときに段を広げ、既定を`high`にします。これでスライダーは「低 / 中 / 高 / 最高」の4段になります。

## 注意点

1つのインスタンスで使えるのは、Z.aiかOpenRouterのどちらかです。`-zai` / `-openrouter`とモデルは起動時にしか読まれないので、切り替えるときはアプリを終了してから起動し直します。起動中に別の指定をすると、codexSwitchは終了のしかたを表示して止まります。

## Q&A

### 従量課金が発生しませんか

`/api/v1`はCoding Planの枠で動きます。同じキーを従量課金のエンドポイントに送ると残高不足で弾かれることから確認できます（前述）。

### OpenCodeやClaude Codeと併用できますか

できます。エンドポイントが違うだけで、キーは共通です。同じCoding Planの枠を共有します。

### 使えるモデルは何ですか

執筆時点で`glm-5.3`・`glm-5.3-flash`・`glm-5-turbo`の3つです。画像を受け取れるのは`glm-5.3-flash`だけです。

### 同じ方法でClaude Proのサブスクも使えますか

使えません。理由は2つあります。

1つ目は技術的な理由です。Anthropicの公式APIにはResponses APIがなく（`/v1/responses`は404）、Z.aiのようなCodex専用のエンドポイントも見当たりませんでした。

2つ目は規約上の理由です。Claude ProやMaxの枠を使うには、Claude Codeが持つOAuthトークンをCodexへ流すことになります。Anthropicのサブスクは自社クライアントでの利用を前提としているため、第三者クライアントへの転用はおすすめできません。アカウント側の措置を招くリスクがあります。

Claudeを使いたい場合は、Claude Codeをそのまま使うのが素直です。

## まとめ

- `codexSwitch init`で準備し、`codexSwitch -zai`で起動するだけで、CodexアプリがZ.aiのGLMで動く
- Codex用の接続先は`/api/v1`。Claude Code用・OpenCode用とは違い、ここを間違えると「使えない」と誤判断する
- 定額枠で動く。従量課金のエンドポイントでは同じキーが残高不足で弾かれることから確認できる
- Effortの段数は、codexSwitchがモデル一覧を取得するときに広げる

## 参考資料

- [codexSwitch](https://github.com/ttokunaga-ja/codexSwitch)
- [Z.AI Developer Document — Codex](https://docs.z.ai/devpack/tool/codex)
- [Z.AI Developer Document — GLM Coding Plan](https://docs.z.ai/devpack/overview)
- [CodexにOpenRouterを足して、ChatGPT枠を保ったまま別モデルを使う](https://zenn.dev/t_tokunaga/articles/2026-09-22-codex-switch-openrouter)
