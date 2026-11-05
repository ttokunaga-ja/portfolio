---
title: "個人開発のAI利用構成と2026年4月の課金額(API換算)を公開する"
abstract: "こんにちは、個人開発者のttokunagaです。 今回は、個人開発で利用しているAIサービスの構成と、2026年4月の利用量をAPI料金に換算した金額を公開します。 4月のCodexで確認できた月間トークン使用量は、合計 約15.44億トークン でした。従来の集計に基づくAPI換算額は \\$911.64（約13.7万円） で、サブスクリプションの支出はAPI"
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

今回は、個人開発で利用しているAIサービスの構成と、2026年4月の利用量をAPI料金に換算した金額を公開します。

4月のCodexで確認できた月間トークン使用量は、合計 **約15.44億トークン** でした。従来の集計に基づくAPI換算額は **\$911.64（約13.7万円）** で、サブスクリプションの支出はAPI換算額に対して **約78.06%OFF相当** でした。

---

## 🤖 AI利用構成

| サービス | 支出 |
| --- | ---: |
| ChatGPT Pro 20X | 30,000円 |

---

## 📊 Codexの月間使用量

Codexの利用総量は **1,543,600,273トークン** です。

9月のGPT-5.6 Solの詳細ログにおける入出力の構成比は、次のとおりです。

| 区分 | 割合 |
| --- | ---: |
| 通常入力 | 2.4033% |
| キャッシュ読み取り | 97.3691% |
| キャッシュ書き込み | 0.0000% |
| 出力 | 0.2276% |
| **合計** | **100.0000%** |

月間総量はCodexの公式APIの日別値を合計しました。記事内のAPI換算額は、従来の集計にGPT-5.5の単価を適用した参考値です。

API換算額は「通常入力×通常単価＋キャッシュ読み取り×キャッシュ単価＋キャッシュ書き込み×書込単価＋出力×出力単価」を合計し、100万で割って計算しています。[OpenAIの公式料金表](https://developers.openai.com/api/docs/pricing)の2026年10月3日時点のStandard単価を使用しています。

| 価格適用モデル | 通常入力 | キャッシュ読み取り | キャッシュ書き込み | 出力 |
| --- | ---: | ---: | ---: | ---: |
| gpt-5.5 | \$5.00 | \$0.50 | — | \$30.00 |

単価は100万トークンあたりのUSDです。日本円では **約13.7万円** です。

### 利用状況の画像

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

OpenAI APIの実際の請求額は\$4.48で、ChatGPT Proと合わせた支出は30,000円と\$4.48です。

---

## 📉 API換算額と実支払額

比較用レートは1 USD = 150円です。API換算額は実際の請求額ではありません。

| サービス | API換算額 | 実支払額 | 差額 | OFF相当率 |
| --- | ---: | ---: | ---: | ---: |
| ChatGPT Pro 20X | \$911.64 | 30,000円 | \$711.64 | 78.06% |
| OpenAI API | \$4.48 | \$4.48 | \$0.00 | 0.00% |
| **合計** | **\$916.12** | **30,000円＋\$4.48** | **\$711.64** | **77.68%** |

API換算額に対して、実支払額は **約77.68%OFF相当** です。OFF相当率は「（1 − 実支払額 ÷ API換算額）× 100」で計算しています。

OpenAI APIの実請求\$4.48も含めた比較です。

---

## 💡 まとめ

4月のCodexの月間使用量は**約15.44億トークン**、API換算額は **\$911.64（約13.7万円）** でした。サブスク支出30,000円との差額は **\$711.64** です。OpenAI APIの実際の請求額は別途\$4.48でした。

## 参考資料

* [GPT-5.5のモデル仕様とAPI料金](https://developers.openai.com/api/docs/models/gpt-5.5)
* [ChatGPT Proの料金とCodex利用](https://help.openai.com/en/articles/9793128-about-chatgpt-pro-plans)
