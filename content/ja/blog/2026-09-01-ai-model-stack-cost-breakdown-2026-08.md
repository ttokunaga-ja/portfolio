---
title: "個人開発のAI利用構成と2026年8月の課金額(API換算)を公開する"
abstract: "こんにちは、個人開発者のttokunagaです。 今回は、個人開発で利用しているAIサービスの構成と、2026年8月の利用量をAPI料金に換算した金額を公開します。 8月は会社用・個人用の2契約でCodexを利用し、ClaudeはProプランを利用しました。Codexの利用量は、2アカウント合計で約713.1億トークンです。Claudeの月間の入力・出力は、"
publishedAt: "2026-09-01"
canonicalUrl: "https://zenn.dev/t_tokunaga/articles/2026-09-01-ai-model-stack-cost-breakdown-2026-08"
tags:
  - "ai"
  - "openai"
  - "codex"
  - "claude"
  - "個人開発"
---

こんにちは、個人開発者のttokunagaです。

今回は、個人開発で利用しているAIサービスの構成と、2026年8月の利用量をAPI料金に換算した金額を公開します。

8月は会社用・個人用の2契約でCodexを利用し、ClaudeはProプランを利用しました。Codexの利用量は、2アカウント合計で**約713.1億トークン**です。Claudeの月間の入力・出力は、合計 **157.0849Mトークン（約1.57億トークン）** でした。

CodexをGPT-5.6 Sol、Claudeを各モデルの標準API料金に当てはめた参考換算は、 **合計\$125,107.30（約1,876.6万円）** です。Codexの2契約分60,000円と、Claude Proの税込\$22を1ドル150円で換算した月額63,300円との差額は、 **\$124,685.30（約1,870.3万円）** になります。

:::message
API換算額は、サブスクで利用したトークンを従量課金APIで処理したと仮定した参考値です。

集計対象は、Codexが8月2日・9日・16日・23日・30日の5週分、Claudeが9月5日時点の月間データです。
:::

---

## 🤖 2026年8月のAI利用構成

| 利用形態 | サービス | この記事での扱い | 支出 |
| --- | --- | --- | ---: |
| サブスク | Codex（会社用） | GPT-5.6 Solを主試算にし、Terra・Luna換算も併記 | 30,000円 |
| サブスク | Codex（個人用） | GPT-5.6 Solを主試算にし、Terra・Luna換算も併記 | 30,000円 |
| サブスク | Claude Pro | Opus 5、Sonnet 5、Fable 5を各API単価で換算 | \$22（税込） |
| **合計** | — | — | **63,300円相当** |

Codexは会社用・個人用をそれぞれ月額30,000円として計上します。Claude Proは税抜\$20に日本の消費税10%を含めた**税込\$22**です。過去に利用したClaude Max 20xは税込\$220でしたが、今期はProプランです。

1ドル150円の比較用レートでは、月額の合計は**63,300円**です。追加クレジットや別途のAPI従量課金は含めていません。

---

## 💸 API換算の前提条件

- 1 USD = 150円
- Codexは総量を通常入力20%・キャッシュ読み出し77%・出力3%へ仮配分
- Codexの主試算には8月末のGPT-5.6 Sol単価を全量へ適用
- Claudeは月間表示の入力を通常入力、出力を通常出力として換算
- キャッシュ書き込み、長いコンテキストへの追加料金、Fast mode、ツール利用料、API側の税金は含めない

---

## 📊 Codex：約713.1億トークン、API換算約1,827.0万円

個人用・会社用の週別利用量は、次のとおりです。

| 集計週 | 個人用 | 会社用 | 合計 |
| --- | ---: | ---: | ---: |
| 8月2日の週 | 54.9億 | 0トークン | 54.9億 |
| 8月9日の週 | 104.8億 | 78.9億 | 183.7億 |
| 8月16日の週 | 36.7億 | 22.9万 | 36.70229億 |
| 8月23日の週 | 109.9億 | 159.7億 | 269.6億 |
| 8月30日の週 | 49.7億 | 118.5億 | 168.2億 |
| **合計** | **356.0億** | **357.10229億** | **713.10229億** |

![個人用の8月2日の週](/images/blog/2026-09-01-ai-model-stack-cost-breakdown-2026-08/2026-09-01-ai-model-stack-cost-breakdown-2026-08/codex-account-a-weekly-2026-08-02.png)
*個人用の8月2日の週は54.9億トークンでした*

![個人用の8月9日の週](/images/blog/2026-09-01-ai-model-stack-cost-breakdown-2026-08/2026-09-01-ai-model-stack-cost-breakdown-2026-08/codex-account-a-weekly-2026-08-09.png)
*個人用の8月9日の週は104.8億トークンでした*

![個人用の8月16日の週](/images/blog/2026-09-01-ai-model-stack-cost-breakdown-2026-08/2026-09-01-ai-model-stack-cost-breakdown-2026-08/codex-account-a-weekly-2026-08-16.png)
*個人用の8月16日の週は36.7億トークンでした*

![個人用の8月23日の週](/images/blog/2026-09-01-ai-model-stack-cost-breakdown-2026-08/2026-09-01-ai-model-stack-cost-breakdown-2026-08/codex-account-a-weekly-2026-08-23.png)
*個人用の8月23日の週は109.9億トークンでした*

![個人用の8月30日の週](/images/blog/2026-09-01-ai-model-stack-cost-breakdown-2026-08/2026-09-01-ai-model-stack-cost-breakdown-2026-08/codex-account-a-weekly-2026-08-30.png)
*個人用の8月30日の週は49.7億トークンでした*

![会社用の8月9日の週](/images/blog/2026-09-01-ai-model-stack-cost-breakdown-2026-08/2026-09-01-ai-model-stack-cost-breakdown-2026-08/codex-account-b-weekly-2026-08-09.png)
*会社用の8月9日の週は78.9億トークンでした*

![会社用の8月16日の週](/images/blog/2026-09-01-ai-model-stack-cost-breakdown-2026-08/2026-09-01-ai-model-stack-cost-breakdown-2026-08/codex-account-b-weekly-2026-08-16.png)
*会社用の8月16日の週は22.9万トークンでした*

![会社用の8月23日の週](/images/blog/2026-09-01-ai-model-stack-cost-breakdown-2026-08/2026-09-01-ai-model-stack-cost-breakdown-2026-08/codex-account-b-weekly-2026-08-23.png)
*会社用の8月23日の週は159.7億トークンでした*

![会社用の8月30日の週](/images/blog/2026-09-01-ai-model-stack-cost-breakdown-2026-08/2026-09-01-ai-model-stack-cost-breakdown-2026-08/codex-account-b-weekly-2026-08-30.png)
*会社用の8月30日の週は118.5億トークンでした*

### GPT-5.6 Sol換算では\$121,797.87

[OpenAIのAPI料金表](https://developers.openai.com/api/docs/pricing)にある8月末のGPT-5.6 Sol標準API料金は、通常入力100万トークンあたり **\$4**、キャッシュ読み出し **\$0.40**、出力 **\$20** です。

713.10229億トークンを、通常入力20%・キャッシュ読み出し77%・出力3%として計算します。

| 区分 | トークン数 | API単価 | 試算額 |
| --- | ---: | ---: | ---: |
| 通常入力（20%） | 14,262.0458 MTok | \$4 / MTok | \$57,048.18 |
| キャッシュ入力（77%） | 54,908.87633 MTok | \$0.40 / MTok | \$21,963.55 |
| 出力（3%） | 2,139.30687 MTok | \$20 / MTok | \$42,786.14 |
| **合計** | **71,310.229 MTok** | — | **\$121,797.87** |

丸める前の合計を1ドル150円で換算すると、**18,269,681円**、およそ**1,827.0万円**です。

### Terra・Lunaならどこまで下がるか

同じ713.10229億トークンをSol・Terra・Lunaそれぞれの単価で換算すると、次のようになります。

| GPT-5.6 | 通常入力 / キャッシュ入力 / 出力（1 MTok） | API換算額 | 日本円換算 |
| --- | --- | ---: | ---: |
| Sol | \$4 / \$0.40 / \$20 | \$121,797.87 | 約1,827.0万円 |
| Terra | \$2 / \$0.20 / \$12 | \$65,177.55 | 約977.7万円 |
| Luna | \$0.20 / \$0.02 / \$1.20 | \$6,517.75 | 約97.8万円 |

---

## 🤖 Claude：約1.57億トークン、API換算約49.6万円

![Claudeの2026年8月モデル別使用状況](/images/blog/2026-09-01-ai-model-stack-cost-breakdown-2026-08/2026-09-01-ai-model-stack-cost-breakdown-2026-08/claude-monthly-model-token-usage-2026-08.png)
*Claudeの月間表示におけるモデル別の入力・出力トークン数です*

| モデル | 入力 | 出力 | 合計 |
| --- | ---: | ---: | ---: |
| Opus 5 | 0.4849M | 55.8M | 56.2849M |
| Sonnet 5 | 20.5M | 46.6M | 67.1M |
| Fable 5 | 7M | 26.7M | 33.7M |
| **合計** | **27.9849M** | **129.1M** | **157.0849M** |

入力・出力の合計では、出力が**129.1Mトークン**で、総量の約82.2%を占めます。

### モデル別API換算額

[Anthropicの公式料金表](https://platform.claude.com/docs/en/about-claude/pricing)にある標準料金を使います。Opus 5は通常入力 **\$5**、出力 **\$25**、Sonnet 5は **\$2 / \$10**、Fable 5は **\$10 / \$50** です。入力はすべて通常入力として計算します。

| モデル | 通常入力 | 出力 | 計算 | API換算額 |
| --- | ---: | ---: | --- | ---: |
| Opus 5 | 0.4849M | 55.8M | 0.4849×\$5 + 55.8×\$25 | \$1,397.42 |
| Sonnet 5 | 20.5M | 46.6M | 20.5×\$2 + 46.6×\$10 | \$507.00 |
| Fable 5 | 7M | 26.7M | 7×\$10 + 26.7×\$50 | \$1,405.00 |
| **合計** | **27.9849M** | **129.1M** | — | **\$3,309.42** |

合計額は各行を丸める前の値から計算しています。

丸める前の合計を1ドル150円で換算すると、**496,414円**、およそ**49.6万円**です。

---

## 📉 サブスク支出との差額（参考）

CodexはGPT-5.6 Sol換算を使い、サブスク料金と比較します。API換算額は税抜、Claudeの月額料金は日本の消費税10%込みです。

| サービス | API相当額（税抜） | サブスク支出 | 参考差額 |
| --- | ---: | ---: | ---: |
| Codex（2契約） | \$121,797.87 | 60,000円（\$400相当） | \$121,397.87 |
| Claude Pro | \$3,309.42 | \$22（税込） | \$3,287.42 |
| **合計** | **\$125,107.30** | **63,300円（\$422相当）** | **\$124,685.30** |

合計額は各行を丸める前の値から計算しています。

日本円では、API相当額が**18,766,094円**、サブスク支出が**63,300円**、参考差額が **18,702,794円（約1,870.3万円）** です。

---

## 📰 2026年8月のAIニュース

### 1位：OpenAI・Anthropicが開発・評価を一時停止

安全性問題を受け、学習やサイバー評価の一部を一時停止し、隔離・監視を強化しました。([OpenAI](https://openai.com/index/pacing-model-development-cyber-capabilities/)、[Anthropic](https://www.anthropic.com/news/improving-alignment-security-efforts))

### 2位：EU AI Actの透明性要件・執行体制が本格適用

8月2日から、AIとの対話の通知や生成コンテンツの識別など、透明性確保の要件が適用されました。([欧州委員会](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai))

### 3位：NVIDIA、5,000億ドル超のAIインフラ金融構想

8月10日、金融大手6社と、AIインフラへ5,000億ドル超の第三者資金を動員する構想を発表しました。([NVIDIA](https://nvidianews.nvidia.com/news/nvidia-partners-with-apollo-blackrock-blackstone-brookfield-goldman-sachs-and-kkr-to-establish-ai-compute-infrastructure-financing-platforms-to-mobilize-over-500-billion-of-third-party-capital))

### 4位：テキサス州、新規データセンターの接続承認を停止

8月3日、電力・水使用などの監査が完了するまで、新たな接続承認を進めない方針を示しました。([テキサス州知事室](https://gov.texas.gov/news/post/governor-abbott-directs-comprehensive-data-center-audit))

### 5位：SpaceX／Cursor、NVIDIA／Hugging Faceの買収・統合

8月14日にSpaceXのCursor買収が完了し、27日にはNVIDIAのHugging Face買収合意が報じられました。([Cursor](https://cursor.com/blog/joining-spacex)、[Reuters](https://www.reuters.com/technology/nvidia-talks-acquire-hugging-face-13-billion-deal-business-insider-reports-2026-08-27/))

---

## 💡 まとめ

2026年8月は、会社用・個人用の2契約でCodexを利用し、合計**約713.1億トークン**を使用しました。Claudeの月間の入力・出力は合計**157.0849Mトークン**でした。

CodexをGPT-5.6 Sol、Claudeを各モデルの税抜標準API料金で換算すると、合計は **\$125,107.30（約1,876.6万円）** です。月額63,300円（\$422相当）との差額は、 **\$124,685.30（約1,870.3万円）** になりました。

## 参考資料

* [OpenAI APIの料金表](https://developers.openai.com/api/docs/pricing)
* [OpenAI APIの変更履歴](https://developers.openai.com/api/docs/changelog)
* [Claudeのモデル別API料金](https://platform.claude.com/docs/en/about-claude/pricing)
* [Claude Proの料金](https://support.claude.com/en/articles/8325606-what-is-the-pro-plan)
* [Claude Maxの料金](https://support.claude.com/en/articles/11049741-what-is-the-max-plan)
