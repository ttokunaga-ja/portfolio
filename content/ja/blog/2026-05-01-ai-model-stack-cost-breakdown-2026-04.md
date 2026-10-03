---
title: "個人開発のAI利用構成と2026年4月の課金額(API換算)を公開する"
abstract: "こんにちは、個人開発者のttokunagaです。 2026年4月のAI利用量と、API料金に換算した金額を公開します。 Codexの月間使用量は 約7.83億トークン、API換算額は \\$310.86（約4.7万円） でした。 CodexはChatGPT Proを利用しました。 🤖 AI利用構成 | サービス | 支出 | API換算額 | | --- |"
publishedAt: "2026-05-01"
canonicalUrl: "https://zenn.dev/t_tokunaga/articles/2026-05-01-ai-model-stack-cost-breakdown-2026-04"
tags:
  - "ai"
  - "openai"
  - "codex"
  - "gpt5"
  - "個人開発"
---

こんにちは、個人開発者のttokunagaです。

2026年4月のAI利用量と、API料金に換算した金額を公開します。

Codexの月間使用量は **約7.83億トークン**、API換算額は **\$310.86（約4.7万円）** でした。

CodexはChatGPT Proを利用しました。

---

## 🤖 AI利用構成

| サービス | 支出 | API換算額 |
| --- | ---: | ---: |
| Codex（ChatGPT Pro） | \$200 | \$310.86 |
| OpenAI API | \$4.48 | 実際の請求額 |

比較用レートは1 USD = 150円です。API換算額は実際の請求額ではありません。

---

## 📊 Codexの月間使用量

| 区分 | トークン数 |
| --- | ---: |
| 通常入力 | 18,820,074 |
| キャッシュ読み取り | 762,478,117 |
| キャッシュ書き込み | 0 |
| 出力 | 1,782,113 |
| **合計** | **783,080,304** |

価格適用モデルごとの内訳は次のとおりです。

| 価格適用モデル | トークン数 | API換算額 |
| --- | ---: | ---: |
| gpt-5.4 | 645,472,567 | \$217.94 |
| gpt-5.5 | 137,607,737 | \$92.92 |
| **合計** | **783,080,304** | **\$310.86** |

入出力・一部モデルは推定し、2026年10月3日の標準API単価で換算しています。日本円では **約4.7万円** です。

### 週別の利用記録

使用状況画面の週別表示です。

| 集計週 | トークン数 |
| --- | ---: |
| 4月5日の週 | 630,000,000 |
| 4月12日の週 | 370,000,000 |
| 4月19日の週 | 160,000,000 |
| 4月26日の週 | 190,000,000 |
| **週別合計** | **1,350,000,000** |

![Codexのトークン使用状況（2026年4月5日の週）](/images/blog/2026-05-01-ai-model-stack-cost-breakdown-2026-04/2026-05-01-ai-model-stack-cost-breakdown-2026-04/codex-token-usage-2026-04-05.png)
*4月5日の週は6.3億トークンでした*

![Codexのトークン使用状況（2026年4月12日の週）](/images/blog/2026-05-01-ai-model-stack-cost-breakdown-2026-04/2026-05-01-ai-model-stack-cost-breakdown-2026-04/codex-token-usage-2026-04-12.png)
*4月12日の週は3.7億トークンでした*

![Codexのトークン使用状況（2026年4月19日の週）](/images/blog/2026-05-01-ai-model-stack-cost-breakdown-2026-04/2026-05-01-ai-model-stack-cost-breakdown-2026-04/codex-token-usage-2026-04-19.png)
*4月19日の週は1.6億トークンでした*

![Codexのトークン使用状況（2026年4月26日の週）](/images/blog/2026-05-01-ai-model-stack-cost-breakdown-2026-04/2026-05-01-ai-model-stack-cost-breakdown-2026-04/codex-token-usage-2026-04-26.png)
*4月26日の週は1.9億トークンでした*

---

## 🔌 実際のOpenAI API利用

Codexのサブスク利用とは別に、2026年4月はOpenAI APIを**約1,325万トークン、120リクエスト**利用し、実際の課金額は **\$4.48** でした。

![OpenAI PlatformのUsageダッシュボードスクリーンショット](/images/blog/2026-05-01-ai-model-stack-cost-breakdown-2026-04/2026-05-01-ai-model-stack-cost-breakdown-2026-04/openai-usage.png)
*2026年4月のOpenAI API利用実績です*

OpenAI APIの実際の請求額は\$4.48で、ChatGPT Proと合わせた支出は\$204.48です。

---

## 📉 API換算額と実支払額

| サービス | API換算額 | 実支払額 | 差額 | OFF相当率 |
| --- | ---: | ---: | ---: | ---: |
| Codex | \$310.86 | \$200.00 | \$110.86 | 35.66% |
| OpenAI API | \$4.48 | \$4.48 | \$0.00 | 0.00% |
| **合計** | **\$315.34** | **\$204.48** | **\$110.86** | **35.16%** |

API換算額に対して、実支払額は **約35.16%OFF相当** です。OFF相当率は「（1 − 実支払額 ÷ API換算額）× 100」で計算しています。

OpenAI APIの実請求\$4.48も含めた比較です。

---

## 💡 まとめ

4月のCodexの月間使用量は**約7.83億トークン**、API換算額は **\$310.86（約4.7万円）** でした。サブスク支出\$200.00との差額は **\$110.86** です。OpenAI APIの実際の請求額は別途\$4.48でした。

## 参考資料

* [GPT-5.5のモデル仕様とAPI料金](https://developers.openai.com/api/docs/models/gpt-5.5)
* [ChatGPT Proの料金とCodex利用](https://help.openai.com/en/articles/9793128-about-chatgpt-pro-plans)
