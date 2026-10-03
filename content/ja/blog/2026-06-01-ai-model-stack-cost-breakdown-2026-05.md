---
title: "個人開発のAI利用構成と2026年5月の課金額(API換算)を公開する"
abstract: "こんにちは、個人開発者のttokunagaです。 2026年5月のAI利用量と、API料金に換算した金額を公開します。 Codexの月間使用量は 約22.87億トークン、API換算額は \\$1,541.38（約23.1万円） でした。 CodexはChatGPT Proを利用しました。 🤖 AI利用構成 | サービス | サブスク支出 | API換算額 |"
publishedAt: "2026-06-01"
canonicalUrl: "https://zenn.dev/t_tokunaga/articles/2026-06-01-ai-model-stack-cost-breakdown-2026-05"
tags:
  - "ai"
  - "openai"
  - "codex"
  - "gpt5"
  - "個人開発"
---

こんにちは、個人開発者のttokunagaです。

2026年5月のAI利用量と、API料金に換算した金額を公開します。

Codexの月間使用量は **約22.87億トークン**、API換算額は **\$1,541.38（約23.1万円）** でした。

CodexはChatGPT Proを利用しました。

---

## 🤖 AI利用構成

| サービス | サブスク支出 | API換算額 |
| --- | ---: | ---: |
| Codex（ChatGPT Pro） | \$200 | \$1,541.38 |

比較用レートは1 USD = 150円です。API換算額は実際の請求額ではありません。

---

## 📊 Codexの月間使用量

| 区分 | トークン数 |
| --- | ---: |
| 通常入力 | 55,088,949 |
| キャッシュ読み取り | 2,227,118,736 |
| キャッシュ書き込み | 129 |
| 出力 | 5,206,513 |
| **合計** | **2,287,414,327** |

価格適用モデルごとの内訳は次のとおりです。

| 価格適用モデル | トークン数 | API換算額 |
| --- | ---: | ---: |
| gpt-5.5 | 2,282,322,115 | \$1,541.22 |
| gpt-5.6-luna | 5,092,212 | \$0.16 |
| **合計** | **2,287,414,327** | **\$1,541.38** |

入出力・一部モデルは推定し、2026年10月3日の標準API単価で換算しています。日本円では **約23.1万円** です。

### 週別の利用記録

使用状況画面の週別表示です。

| 集計週 | 使用トークン数 |
| --- | ---: |
| 5月3日の週 | 230,000,000 |
| 5月10日の週 | 1,840,000,000 |
| 5月17日の週 | 1,010,000,000 |
| 5月24日の週 | 250,000,000 |
| 5月31日の週 | 960,000,000 |
| **週別合計** | **4,290,000,000** |

![Codexのトークン使用状況（2026年5月3日の週）](/images/blog/2026-06-01-ai-model-stack-cost-breakdown-2026-05/2026-06-01-ai-model-stack-cost-breakdown-2026-05/codex-weekly-token-usage-2026-05-03.png)
*5月3日の週は2.3億トークンでした*

![Codexのトークン使用状況（2026年5月10日の週）](/images/blog/2026-06-01-ai-model-stack-cost-breakdown-2026-05/2026-06-01-ai-model-stack-cost-breakdown-2026-05/codex-weekly-token-usage-2026-05-10.png)
*5月10日の週は18.4億トークンでした*

![Codexのトークン使用状況（2026年5月17日の週）](/images/blog/2026-06-01-ai-model-stack-cost-breakdown-2026-05/2026-06-01-ai-model-stack-cost-breakdown-2026-05/codex-weekly-token-usage-2026-05-17.png)
*5月17日の週は10.1億トークンでした*

![Codexのトークン使用状況（2026年5月24日の週）](/images/blog/2026-06-01-ai-model-stack-cost-breakdown-2026-05/2026-06-01-ai-model-stack-cost-breakdown-2026-05/codex-weekly-token-usage-2026-05-24.png)
*5月24日の週は2.5億トークンでした*

![Codexのトークン使用状況（2026年5月31日の週）](/images/blog/2026-06-01-ai-model-stack-cost-breakdown-2026-05/2026-06-01-ai-model-stack-cost-breakdown-2026-05/codex-weekly-token-usage-2026-05-31.png)
*5月31日の週は9.6億トークンでした*

### 月末時点のCodex累計は86.2億トークン

![Codexの累計トークン使用量（2026年5月31日の週まで）](/images/blog/2026-06-01-ai-model-stack-cost-breakdown-2026-05/2026-06-01-ai-model-stack-cost-breakdown-2026-05/codex-cumulative-token-usage-2026-05-31.png)

---

## 📉 API換算額と実支払額

| サービス | API換算額 | 実支払額 | 差額 | OFF相当率 |
| --- | ---: | ---: | ---: | ---: |
| Codex | \$1,541.38 | \$200.00 | \$1,341.38 | 87.02% |
| **合計** | **\$1,541.38** | **\$200.00** | **\$1,341.38** | **87.02%** |

API換算額に対して、実支払額は **約87.02%OFF相当** です。OFF相当率は「（1 − 実支払額 ÷ API換算額）× 100」で計算しています。

差額はAPI換算額とサブスク支出の比較値です。

---

## 💡 まとめ

5月のCodexの月間使用量は**約22.87億トークン**、API換算額は **\$1,541.38（約23.1万円）** でした。サブスク支出\$200.00との差額は **\$1,341.38** です。

## 参考資料

* [GPT-5.5のモデル仕様とAPI料金](https://developers.openai.com/api/docs/models/gpt-5.5)
* [Introducing GPT-5.5](https://openai.com/index/introducing-gpt-5-5/)
* [ChatGPT Proの料金とCodex利用](https://help.openai.com/en/articles/9793128-about-chatgpt-pro-plans)
