---
title: "個人開発のAI利用構成と2026年5月の利用額をAPI換算する"
abstract: "こんにちは、個人開発者のttokunagaです。 今回は、個人開発で利用しているAIサービスの構成と、2026年5月の利用量をAPI料金に換算した金額を公開します。 5月のCodexで確認できた月間トークン使用量は 約34.20億トークン でした。API参考換算額は \\$2,896.98 で、サブスクリプションの支出は、この換算額に対して 約93.10%OF"
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

今回は、個人開発で利用しているAIサービスの構成と、2026年5月の利用量をAPI料金に換算した金額を公開します。

5月のCodexで確認できた月間トークン使用量は **約34.20億トークン** でした。API参考換算額は **\$2,896.98** で、サブスクリプションの支出は、この換算額に対して **約93.10%OFF相当** でした。

## 🤖 2026年5月のAI利用構成

| サービス | サブスク支出 |
| --- | ---: |
| ChatGPT Pro 20X | 30,000円 |

## 💸 API換算の前提条件

Codexの月間総量は公式APIから集計しました。モデル別・入出力別の構成には保存ログを使っています。

## 📊 Codexの利用量：約34億トークン、API参考換算額:約2,897ドル、割引率:93.1パーセント

Codexの確認できた利用量は **3,419,978,099トークン** です。

### モデル別API換算

モデル別のAPI参考換算は **\$2,896.98** です。

| モデル | トークン数 | API参考換算 |
| --- | ---: | ---: |
| GPT-5.5 | 4,290,000,000 | \$2,896.98 |
| **合計** | **4,290,000,000** | **\$2,896.98** |

### 入出力・キャッシュの割合

ローカルログからCodexの入出力・キャッシュの割合を計算しました。

| 区分 | 割合 |
| --- | ---: |
| 通常入力 | 2.40% |
| キャッシュ入力 | 97.37% |
| 出力 | 0.23% |
| キャッシュ出力 | 0.00% |

### 利用状況の画像

![Codexのトークン使用状況（2026年5月3日の週）](/images/blog/2026-06-01-ai-model-stack-cost-breakdown-2026-05/2026-06-01-ai-model-stack-cost-breakdown-2026-05/codex-weekly-token-usage-2026-05-03.png)

![Codexのトークン使用状況（2026年5月10日の週）](/images/blog/2026-06-01-ai-model-stack-cost-breakdown-2026-05/2026-06-01-ai-model-stack-cost-breakdown-2026-05/codex-weekly-token-usage-2026-05-10.png)

![Codexのトークン使用状況（2026年5月17日の週）](/images/blog/2026-06-01-ai-model-stack-cost-breakdown-2026-05/2026-06-01-ai-model-stack-cost-breakdown-2026-05/codex-weekly-token-usage-2026-05-17.png)

![Codexのトークン使用状況（2026年5月24日の週）](/images/blog/2026-06-01-ai-model-stack-cost-breakdown-2026-05/2026-06-01-ai-model-stack-cost-breakdown-2026-05/codex-weekly-token-usage-2026-05-24.png)

![Codexのトークン使用状況（2026年5月31日の週）](/images/blog/2026-06-01-ai-model-stack-cost-breakdown-2026-05/2026-06-01-ai-model-stack-cost-breakdown-2026-05/codex-weekly-token-usage-2026-05-31.png)

![Codexの累計トークン使用量（2026年5月31日の週まで）](/images/blog/2026-06-01-ai-model-stack-cost-breakdown-2026-05/2026-06-01-ai-model-stack-cost-breakdown-2026-05/codex-cumulative-token-usage-2026-05-31.png)

---

## 📉 API換算額とサブスク支出

| サービス | API参考換算 | サブスク支出 |
| --- | ---: | ---: |
| ChatGPT Pro 20X | \$2,896.98 | 30,000円 |
| **合計** | **\$2,896.98** | **30,000円** |

:::details 今回使用したモデルのAPI単価（100万トークンあたり、USD）

| モデル | 入力 | キャッシュ入力 | 出力 | キャッシュ出力 |
| --- | ---: | ---: | ---: | ---: |
| GPT-5.5 | \$5 / \$10 | \$0.50 / \$1 | \$30 / \$45 | — |

GPTの2値は通常／長文の順です。
:::

---

## 💡 まとめ

5月はChatGPT Pro 20Xを **30,000円** で利用しました。Codexの確認できた利用量は **約34.20億トークン** でした。

## 参考資料

* [GPT-5.5のモデル仕様とAPI料金](https://developers.openai.com/api/docs/models/gpt-5.5)
* [Introducing GPT-5.5](https://openai.com/index/introducing-gpt-5-5/)
* [ChatGPT Proの料金とCodex利用](https://help.openai.com/en/articles/9793128-about-chatgpt-pro-plans)
