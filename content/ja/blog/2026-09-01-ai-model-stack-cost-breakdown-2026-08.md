---
title: "個人開発のAI利用構成と2026年8月の課金額(API換算)を公開する"
abstract: "こんにちは、個人開発者のttokunagaです。 今回は、個人開発で利用しているAIサービスの構成と、2026年8月の利用量をAPI料金に換算した金額を公開します。 8月のCodexとClaude Codeで確認できた月間トークン使用量は、合計 約424.75億トークン でした。従来の集計に基づくAPI換算額は \\$41,932.91（約629.0万円） で"
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

8月のCodexとClaude Codeで確認できた月間トークン使用量は、合計 **約424.75億トークン** でした。従来の集計に基づくAPI換算額は **\$41,932.91（約629.0万円）** で、サブスクリプションの支出はAPI換算額に対して **約98.99%OFF相当** でした。

---

## 🤖 AI利用構成

| サービス | サブスク支出 |
| --- | ---: |
| ChatGPT Pro 20X（会社用） | 30,000円 |
| ChatGPT Pro 20X（個人用） | 30,000円 |
| Claude Pro | \$22.00（税込） |

---

## 📊 Codexの月間使用量

Codexの利用総量は **36,146,861,348トークン** です。

9月のGPT-5.6 Solの詳細ログにおける入出力の構成比は、次のとおりです。

| 区分 | 割合 |
| --- | ---: |
| 通常入力 | 2.4033% |
| キャッシュ読み取り | 97.3691% |
| キャッシュ書き込み | 0.0000% |
| 出力 | 0.2276% |
| **合計** | **100.0000%** |

月間総量はCodexの公式APIの日別値を合計しました。記事内のAPI換算額は、従来の集計にGPT-5.6 Solの単価を適用した参考値です。

API換算額は「通常入力×通常単価＋キャッシュ読み取り×キャッシュ単価＋キャッシュ書き込み×書込単価＋出力×出力単価」を合計し、100万で割って計算しています。[OpenAIの公式料金表](https://developers.openai.com/api/docs/pricing)の2026年10月3日時点のStandard単価を使用しています。

| 価格適用モデル | 通常入力 | キャッシュ読み取り | キャッシュ書き込み | 出力 |
| --- | ---: | ---: | ---: | ---: |
| gpt-5.6-sol | \$4.00 | \$0.40 | \$5.00 | \$20.00 |

単価は100万トークンあたりのUSDです。日本円では **約568.1万円** です。

### 利用状況の画像

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

## 📉 API換算額と実支払額

比較用レートは1 USD = 150円です。API換算額は実際の請求額ではありません。

| サービス | API換算額 | 実支払額 | 差額 | OFF相当率 |
| --- | ---: | ---: | ---: | ---: |
| ChatGPT Pro 20X（2契約） | \$37,874.67 | 60,000円 | \$37,474.67 | 98.94% |
| Claude | \$4,058.24 | \$22.00（税込） | \$4,036.24 | 99.46% |
| **合計** | **\$41,932.91** | **60,000円＋\$22.00** | **\$41,510.91** | **98.99%** |

API換算額に対して、実支払額は **約98.99%OFF相当** です。OFF相当率は「（1 − 実支払額 ÷ API換算額）× 100」で計算しています。

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

8月のCodexの月間使用量は**約361.47億トークン**、API換算額は **\$37,874.67（約568.1万円）** でした。ClaudeのAPI換算額 **\$4,058.24** と合わせると、 **\$41,932.91（約629.0万円）** です。サブスク支出60,000円と\$22.00との差額は **\$41,510.91** です。

## 参考資料

* [OpenAI APIの料金表](https://developers.openai.com/api/docs/pricing)
* [OpenAI APIの変更履歴](https://developers.openai.com/api/docs/changelog)
* [Claudeのモデル別API料金](https://platform.claude.com/docs/en/about-claude/pricing)
* [Claude Proの料金](https://support.claude.com/en/articles/8325606-what-is-the-pro-plan)
* [Claude Maxの料金](https://support.claude.com/en/articles/11049741-what-is-the-max-plan)
