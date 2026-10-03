---
title: "個人開発のAI利用構成と2026年8月の課金額(API換算)を公開する"
abstract: "こんにちは、個人開発者のttokunagaです。 2026年8月のAI利用量と、API料金に換算した金額を公開します。 Codexの月間使用量は 約5.1兆トークン、API換算額は \\$981,820.19（約1億4,727万円） でした。ClaudeのAPI換算額は \\$4,058.24 で、合計 \\$985,878.42（約1億4,788万円） です。 "
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

2026年8月のAI利用量と、API料金に換算した金額を公開します。

Codexの月間使用量は **約5.1兆トークン**、API換算額は **\$981,820.19（約1億4,727万円）** でした。ClaudeのAPI換算額は **\$4,058.24** で、合計 **\$985,878.42（約1億4,788万円）** です。

Codexは会社用・個人用の2契約、ClaudeはProプランを利用しました。

---

## 🤖 AI利用構成

| サービス | サブスク支出 | API換算額 |
| --- | ---: | ---: |
| Codex（会社用30,000円・個人用30,000円） | 60,000円（\$400相当） | \$981,820.19 |
| Claude Pro | \$22.00（税込） | \$4,058.24 |

比較用レートは1 USD = 150円です。API換算額は実際の請求額ではありません。

---

## 📊 Codexの月間使用量

| 区分 | トークン数 |
| --- | ---: |
| 通常入力 | 199,510,201,765 |
| キャッシュ読み取り | 4,885,880,023,016 |
| キャッシュ書き込み | 113,452,604 |
| 出力 | 14,132,000,369 |
| **合計** | **5,099,635,677,754** |

価格適用モデルごとの内訳は次のとおりです。

| 価格適用モデル | トークン数 | API換算額 |
| --- | ---: | ---: |
| gpt-5.6-luna | 2,204,163,879,310 | \$68,926.66 |
| gpt-6-astra | 50,485,023 | \$66.70 |
| gpt-5.6-sol | 214,714,881,872 | \$114,040.52 |
| gpt-5.6-terra | 2,680,706,431,549 | \$798,786.30 |
| **合計** | **5,099,635,677,754** | **\$981,820.19** |

入出力・一部モデルは推定し、2026年10月3日の標準API単価で換算しています。日本円では **約1億4,727万円** です。

### 週別の利用記録

使用状況画面の週別表示です。

| 集計週 | 個人用 | 会社用 | 合計 |
| --- | ---: | ---: | ---: |
| 8月2日の週 | 5,490,000,000 | 0 | 5,490,000,000 |
| 8月9日の週 | 10,480,000,000 | 7,890,000,000 | 18,370,000,000 |
| 8月16日の週 | 3,670,000,000 | 229,000 | 3,670,229,000 |
| 8月23日の週 | 10,990,000,000 | 15,970,000,000 | 26,960,000,000 |
| 8月30日の週 | 4,970,000,000 | 11,850,000,000 | 16,820,000,000 |
| **週別合計** | **35,600,000,000** | **35,710,229,000** | **71,310,229,000** |

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

---

## 🤖 Claude：約63.28億トークン、API換算約60.9万円

![Claudeの使用状況](/images/blog/2026-09-01-ai-model-stack-cost-breakdown-2026-08/2026-09-01-ai-model-stack-cost-breakdown-2026-08/claude-monthly-model-token-usage-2026-08.png)

8月1日〜31日の保存ログを応答日時で集計しました。通常入力・出力・キャッシュ読み取り・書き込みの内訳は次のとおりです。

| モデル | 通常入力 | 出力 | キャッシュ読み取り | 書き込み（5分） | 書き込み（1時間） | 合計トークン数 | API換算額 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Opus 5 | 118,419 | 11,777,552 | 6,045,049,471 | 7,176,090 | 52,050,759 | 6,116,172,291 | \$3,882.91 |
| Sonnet 5 | 99,796 | 1,668,216 | 168,943,866 | 6,835,196 | 1,343,173 | 178,890,247 | \$73.13 |
| Fable 5 | 50,791 | 698,519 | 29,397,767 | 2,069,746 | 574,386 | 32,791,209 | \$102.19 |
| **合計** | **269,006** | **14,144,287** | **6,243,391,104** | **16,081,032** | **53,968,318** | **6,327,853,747** | **\$4,058.24** |

### モデル別API単価

[Anthropicの公式料金表](https://platform.claude.com/docs/en/about-claude/pricing)を参照し、2026年10月3日の標準API単価で換算します。単位は100万トークンあたりUSDです。

| モデル | 通常入力 | 出力 | キャッシュ読み取り | 書き込み（5分） | 書き込み（1時間） |
| --- | ---: | ---: | ---: | ---: | ---: |
| Opus 5 | \$5 | \$25 | \$0.50 | \$6.25 | \$10 |
| Sonnet 5 | \$2 | \$10 | \$0.20 | \$2.50 | \$4 |
| Fable 5 | \$10 | \$50 | \$1 | \$12.50 | \$20 |

各区分のトークン数に単価を掛け、100万で割った金額を合計しています。キャッシュ読み取りは約62.43億トークンで、総量の約98.7%を占めました。

1ドル150円で換算すると **約60.9万円** です。

---

## 📉 API換算額とサブスク支出

| サービス | API換算額 | サブスク支出 | 差額（参考） |
| --- | ---: | ---: | ---: |
| Codex | \$981,820.19 | \$400.00 | \$981,420.19 |
| Claude | \$4,058.24 | \$22.00（税込） | \$4,036.24 |
| **合計** | **\$985,878.42** | **\$422.00** | **\$985,456.42** |

差額はAPI換算額とサブスク支出の比較値です。

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

8月のCodexの月間使用量は**約5.1兆トークン**、API換算額は **\$981,820.19（約1億4,727万円）** でした。ClaudeのAPI換算額 **\$4,058.24** と合わせると、 **\$985,878.42（約1億4,788万円）** です。サブスク支出\$422.00との差額は **\$985,456.42** です。

## 参考資料

* [OpenAI APIの料金表](https://developers.openai.com/api/docs/pricing)
* [OpenAI APIの変更履歴](https://developers.openai.com/api/docs/changelog)
* [Claudeのモデル別API料金](https://platform.claude.com/docs/en/about-claude/pricing)
* [Claude Proの料金](https://support.claude.com/en/articles/8325606-what-is-the-pro-plan)
* [Claude Maxの料金](https://support.claude.com/en/articles/11049741-what-is-the-max-plan)
