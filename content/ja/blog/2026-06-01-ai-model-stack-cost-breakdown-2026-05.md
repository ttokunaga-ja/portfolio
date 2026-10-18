---
title: "個人開発のAI利用構成と2026年5月の課金額(API換算)を公開する"
abstract: "こんにちは、個人開発者のttokunagaです。 2026年5月のAI利用量と、API料金に換算した金額を公開します。 Codexの月間使用量は 約42.9億トークン、API換算額は \\$2,896.98（約43.5万円） でした。 CodexはChatGPT Proを利用しました。 🤖 AI利用構成 | サービス | サブスク支出 | API換算額 | "
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

Codexの月間使用量は **約42.9億トークン**、API換算額は **\$2,896.98（約43.5万円）** でした。

CodexはChatGPT Proを利用しました。

---

## 🤖 AI利用構成

| サービス | サブスク支出 | API換算額 |
| --- | ---: | ---: |
| Codex（ChatGPT Pro） | \$200 | \$2,896.98 |

比較用レートは1 USD = 150円です。API換算額は実際の請求額ではありません。

---

## 📊 Codexの月間使用量

| 区分 | トークン数 | 総量に占める割合 | API換算額 |
| --- | ---: | ---: | ---: |
| 通常入力 | 103,103,225 | 2.4033% | \$515.52 |
| キャッシュ読み取り | 4,177,133,702 | 97.3691% | \$2,088.57 |
| キャッシュ書き込み | 0 | 0.0000% | \$0.00 |
| 出力 | 9,763,073 | 0.2276% | \$292.89 |
| **合計** | **4,290,000,000** | **100.0000%** | **\$2,896.98** |

月間総量は使用状況画面の週別表示を合計し、内訳は9月のGPT-5.6 Sol詳細ログの比率（通常入力約2.40%、キャッシュ読み取り約97.37%、出力約0.23%、書き込み0%）で推定しました。API換算には、当月の比較用モデルとしてGPT-5.5の単価を一律に適用しています。

API換算額は「通常入力×通常単価＋キャッシュ読み取り×キャッシュ単価＋キャッシュ書き込み×書込単価＋出力×出力単価」を合計し、100万で割って計算しています。[OpenAIの公式料金表](https://developers.openai.com/api/docs/pricing)の2026年10月3日時点のStandard単価を使用しています。

| 価格適用モデル | 通常入力 | キャッシュ読み取り | キャッシュ書き込み | 出力 |
| --- | ---: | ---: | ---: | ---: |
| gpt-5.5 | \$5.00 | \$0.50 | — | \$30.00 |

単価は100万トークンあたりのUSDです。日本円では **約43.5万円** です。

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
| Codex | \$2,896.98 | \$200.00 | \$2,696.98 | 93.10% |
| **合計** | **\$2,896.98** | **\$200.00** | **\$2,696.98** | **93.10%** |

API換算額に対して、実支払額は **約93.10%OFF相当** です。OFF相当率は「（1 − 実支払額 ÷ API換算額）× 100」で計算しています。

差額はAPI換算額とサブスク支出の比較値です。

---

## 💡 まとめ

5月のCodexの月間使用量は**約42.9億トークン**、API換算額は **\$2,896.98（約43.5万円）** でした。サブスク支出\$200.00との差額は **\$2,696.98** です。

## 参考資料

* [GPT-5.5のモデル仕様とAPI料金](https://developers.openai.com/api/docs/models/gpt-5.5)
* [Introducing GPT-5.5](https://openai.com/index/introducing-gpt-5-5/)
* [ChatGPT Proの料金とCodex利用](https://help.openai.com/en/articles/9793128-about-chatgpt-pro-plans)
