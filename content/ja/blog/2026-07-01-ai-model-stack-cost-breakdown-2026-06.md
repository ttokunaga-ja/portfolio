---
title: "個人開発のAI利用構成と2026年6月の課金額(API換算)を公開する"
abstract: "こんにちは、個人開発者のttokunagaです。 2026年6月のAI利用量と、API料金に換算した金額を公開します。 Codexの月間使用量は 約47.68億トークン、API換算額は \\$3,189.31（約47.8万円） でした。ClaudeのAPI換算額は \\$377.25 で、合計 \\$3,566.56（約53.5万円） です。 CodexはChat"
publishedAt: "2026-07-01"
canonicalUrl: "https://zenn.dev/t_tokunaga/articles/2026-07-01-ai-model-stack-cost-breakdown-2026-06"
tags:
  - "ai"
  - "openai"
  - "codex"
  - "claude"
  - "個人開発"
---

こんにちは、個人開発者のttokunagaです。

2026年6月のAI利用量と、API料金に換算した金額を公開します。

Codexの月間使用量は **約47.68億トークン**、API換算額は **\$3,189.31（約47.8万円）** でした。ClaudeのAPI換算額は **\$377.25** で、合計 **\$3,566.56（約53.5万円）** です。

CodexはChatGPT Pro、ClaudeはMax 20xを利用しました。

---

## 🤖 AI利用構成

| サービス | サブスク支出 | API換算額 |
| --- | ---: | ---: |
| Codex（ChatGPT Pro） | \$200 | \$3,189.31 |
| Claude Max 20x | \$220.00（税込） | \$377.25 |

比較用レートは1 USD = 150円です。API換算額は実際の請求額ではありません。

---

## 📊 Codexの月間使用量

| 区分 | トークン数 |
| --- | ---: |
| 通常入力 | 114,593,731 |
| キャッシュ読み取り | 4,642,660,915 |
| キャッシュ書き込み | 0 |
| 出力 | 10,851,116 |
| **合計** | **4,768,105,762** |

価格適用モデルごとの内訳は次のとおりです。

| 価格適用モデル | トークン数 | API換算額 |
| --- | ---: | ---: |
| gpt-5.4 | 90,408,800 | \$30.53 |
| gpt-5.5 | 4,677,696,962 | \$3,158.78 |
| **合計** | **4,768,105,762** | **\$3,189.31** |

入出力・一部モデルは推定し、2026年10月3日の標準API単価で換算しています。日本円では **約47.8万円** です。

### 週別の利用記録

使用状況画面の週別表示です。

| 集計週 | 使用トークン数 |
| --- | ---: |
| 6月7日の週 | 2,200,000,000 |
| 6月14日の週 | 2,190,000,000 |
| 6月21日の週 | 890,000,000 |
| 6月28日の週 | 930,000,000 |
| **週別合計** | **6,210,000,000** |

![Codexのトークン使用状況（2026年6月7日の週）](/images/blog/2026-07-01-ai-model-stack-cost-breakdown-2026-06/2026-07-01-ai-model-stack-cost-breakdown-2026-06/codex-weekly-token-usage-2026-06-07.png)
*6月7日の週は22.0億トークンでした*

![Codexのトークン使用状況（2026年6月14日の週）](/images/blog/2026-07-01-ai-model-stack-cost-breakdown-2026-06/2026-07-01-ai-model-stack-cost-breakdown-2026-06/codex-weekly-token-usage-2026-06-14.png)
*6月14日の週は21.9億トークンでした*

![Codexのトークン使用状況（2026年6月21日の週）](/images/blog/2026-07-01-ai-model-stack-cost-breakdown-2026-06/2026-07-01-ai-model-stack-cost-breakdown-2026-06/codex-weekly-token-usage-2026-06-21.png)
*6月21日の週は8.9億トークンでした*

![Codexのトークン使用状況（2026年6月28日の週）](/images/blog/2026-07-01-ai-model-stack-cost-breakdown-2026-06/2026-07-01-ai-model-stack-cost-breakdown-2026-06/codex-weekly-token-usage-2026-06-28.png)
*6月28日の週は9.3億トークンでした*

### 月末時点のCodex累計は143.4億トークン

![Codexの累計トークン使用量（2026年6月28日の週まで）](/images/blog/2026-07-01-ai-model-stack-cost-breakdown-2026-06/2026-07-01-ai-model-stack-cost-breakdown-2026-06/codex-cumulative-token-usage-2026-06-28.png)

---

## 🤖 Claude：約1.77億トークン、API換算約5.7万円

6月のClaudeの利用記録は、合計**約1.77億トークン** で、主に**Opus 4.8**を利用しました。

| 指標 | 2026年6月の利用記録 |
| --- | ---: |
| セッション数 | 619 |
| メッセージ数 | 107,872 |
| 合計トークン数 | 176,700,000 |
| アクティブ日数 | 29日 |
| よく使うモデル | Opus 4.8 |

![Claudeの使用状況](/images/blog/2026-07-01-ai-model-stack-cost-breakdown-2026-06/2026-07-01-ai-model-stack-cost-breakdown-2026-06/claude-usage-overview-2026-06.png)

### Opus 4.8換算では\$377.25

[Anthropicの公式料金表](https://platform.claude.com/docs/en/about-claude/pricing)では、Claude Opus 4.8の標準API料金は、通常入力100万トークンあたり **\$5**、キャッシュ読み出し **\$0.50**、出力 **\$25** です。同じ比率で計算します。

| 区分 | トークン数 | API単価 | 試算額 |
| --- | ---: | ---: | ---: |
| 通常入力（総量の20%） | 35,340,000 | \$5 / MTok | \$176.7000 |
| キャッシュ入力（総量の77%） | 136,059,000 | \$0.50 / MTok | \$68.0295 |
| 出力（総量の3%） | 5,301,000 | \$25 / MTok | \$132.525 |
| **合計** | **176,700,000** | — | **\$377.25** |

日本円では **約5.7万円** です。

---

## 📉 API換算額とサブスク支出

| サービス | API換算額 | サブスク支出 | 差額（参考） |
| --- | ---: | ---: | ---: |
| Codex | \$3,189.31 | \$200.00 | \$2,989.31 |
| Claude | \$377.25 | \$220.00（税込） | \$157.25 |
| **合計** | **\$3,566.56** | **\$420.00** | **\$3,146.56** |

差額はAPI換算額とサブスク支出の比較値です。

---

## 💡 まとめ

6月のCodexの月間使用量は**約47.68億トークン**、API換算額は **\$3,189.31（約47.8万円）** でした。ClaudeのAPI換算額 **\$377.25** と合わせると、 **\$3,566.56（約53.5万円）** です。サブスク支出\$420.00との差額は **\$3,146.56** です。

## 参考資料

* [GPT-5.5のモデル仕様とAPI料金](https://developers.openai.com/api/docs/models/gpt-5.5)
* [ChatGPT Proの料金とCodex利用](https://help.openai.com/en/articles/9793128-about-chatgpt-pro-plans)
* [Claude Opus 4.8のAPI料金](https://platform.claude.com/docs/en/about-claude/pricing)
* [Claude Maxの料金](https://support.claude.com/ja/articles/11049741-max-%E3%83%97%E3%83%A9%E3%83%B3%E3%81%A8%E3%81%AF%E4%BD%95%E3%81%A7%E3%81%99%E3%81%8B)
