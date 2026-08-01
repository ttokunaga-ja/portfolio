---
title: "中国系LLM APIは推論で利益が出ているのか"
abstract: "はじめに 中国系LLM APIの価格を見ると、100万token当たり数十円というモデルがあります。この価格で、高価なGPUを動かして本当に利益が出るのでしょうか。 では、Qwen、DeepSeek、Kimi、GLM、MiniMax、Tencent Hy3の公開重みを、公式レシピに沿ってセルフホストする費用を試算しました。本稿では、そのTCOと必要throu"
publishedAt: "2026-07-10"
canonicalUrl: "https://zenn.dev/t_tokunaga/articles/2026-07-10-china-llm-api-inference-economics"
tags:
  - "ai"
  - "llm"
  - "api"
  - "economics"
  - "china"
---

## はじめに

中国系LLM APIの価格を見ると、100万token当たり数十円というモデルがあります。この価格で、高価なGPUを動かして本当に利益が出るのでしょうか。

[前編](https://zenn.dev/ttokunaga-ja/articles/2026-07-10-china-open-weight-self-host-economics)では、Qwen、DeepSeek、Kimi、GLM、MiniMax、Tencent Hy3の公開重みを、公式レシピに沿ってセルフホストする費用を試算しました。本稿では、そのTCOと必要throughputを、各社の公式API価格、技術発表、財務開示へ照らし合わせます。

まず、入力80%・出力20%、cache hitなしの公式標準価格を、同じ8×B200ノードの利用量別コストと並べます。

![中国系LLM6モデルの公式API混合価格と、8×B200ノードを月100億・300億・600億token処理した場合の基準原価を比較した図](/images/blog/2026-07-10-china-llm-api-inference-economics/2026-07-10-china-llm-api-inference-economics/official-price-vs-node-cost-reference.png)

*縦線は、前編で試算した8×B200のセルフホスト想定TCO（月額約16,013ドル）を、月100億・300億・600億tokenで割っただけです。各社のGPU、実効throughput、契約割引を知らないため、プロバイダの実原価を示す線ではありません。Qwenは単GPU構成が可能なので、この共通ノード線の直接比較対象外です。*

結論は、次の3段階に分ける必要があります。

1. **推論設備込み採算**：高稼働率なら正になり得る。GLMは公開ベンチマークから参考値を作れ、DeepSeekにも旧世代のGPU費proxyがある
2. **API事業の粗利**：智譜は2025年のOpen Platform/APIで18.9%の正の粗利を開示。MiniMaxもAPIを含む企業向け区分で69.4%だったが、API単独ではない
3. **会社全体の利益**：学習、研究者、販促を差し引くと別問題。智譜とMiniMaxは大幅な研究開発費と調整後赤字を計上している

したがって、**「中国系LLM APIは全部原価割れ」という証拠も、「現行フロンティアモデルは全社黒字」という証拠もありません**。公開資料から強く言えるのは、少なくとも智譜では過年度のAPI/Open Platform販売自体が正の粗利だったこと、しかし現行GLM-5.2固有の採算までは開示されていないことです。

:::message
財務開示は2025年または2026年第1四半期、現行6モデルの公開は2026年4〜7月です。決算期間とモデル世代が一致しないため、本稿は現行モデル固有の利益を断定しません。金額は2026年7月10日時点の価格snapshotです。
:::

## 「利益」を3種類に分ける

推論APIの議論では、次の3つが混同されがちです。

```text
API売上
  − 推論GPUの償却・リース
  − 推論電力・データセンター・回線・推論運用
= serving margin proxy / 推論設備込み採算

  − APIゲートウェイ・サポート・企業向け提供費
= API事業の粗利

  − 事前学習・post-training・研究者・販促・一般管理
= 会社の営業損益
```

モデル開発会社が赤字でも、API事業の粗利が正であることはあります。逆に、推論ノード単体の表計算が黒字でも、学習費と研究開発費まで回収できるとは限りません。

本稿で「推論原価」と呼ぶのは、特に断らない限り最上段のserving costです。前編TCOには資本回収、コロケーション、回線などの固定費も含むため、ここで計算するmarginは会計上の粗利でも、厳密な限界利益でもない便宜的な**serving margin proxy**です。学習費をtokenへ無理に配賦しません。

## 現行6モデルの公式価格

主ケースは入力:出力=4:1、cache hit=0%です。

| 開発元／モデル | Cache miss input | Cache hit | Output | 4:1混合価格 |
| --- | ---: | ---: | ---: | ---: |
| Alibaba / Qwen3.6-27B、中国内地 | 3元 | 別価格なし | 18元 | **6元 / 約138.6円** |
| DeepSeek / V4-Pro | $0.435 | $0.003625 | $0.87 | **$0.522 / 約82.5円** |
| Moonshot / Kimi K2.6 | $0.95 | $0.16 | $4.00 | **$1.56 / 約246.5円** |
| Z.ai / GLM-5.2、中国 | 8元 | 2元 | 28元 | **12元 / 約277.2円** |
| MiniMax / M3、512K以下 | $0.30 | $0.06 | $1.20 | **$0.48 / 約75.8円** |
| Tencent / Hy3、広州 | 1元 | 0.25元 | 4元 | **1.6元 / 約37.0円** |

換算は1ドル158円、[日本銀行の2026年7月報告省令レート](https://www.boj.or.jp/about/services/tame/tame_rate/syorei/hou2607.htm)にある1元0.146ドルから1元23.1円へ丸めます。Qwen、GLM、Hy3は安い中国国内価格を使います。QwenのSingaporeは$0.60/$3.60、GLMのGlobalは$1.40/$4.40なので、海外価格で見ればセルフホストとの価格差は広がります。

価格の出典は[Alibaba Model Studio](https://help.aliyun.com/zh/model-studio/model-pricing)、[DeepSeek API](https://api-docs.deepseek.com/quick_start/pricing)、[Kimi K2.6](https://www.kimi.com/resources/kimi-k2-6-pricing)、[Z.ai](https://open.bigmodel.cn/pricing)、[MiniMax PAYG](https://platform.minimax.io/docs/guides/pricing-paygo)、[Tencent TokenHub](https://cloud.tencent.com/product/tokenhub)です。中国内地、広州、Globalが混在し、税、利用可能地域、長文tierも統一されていません。これは同一地域で利用できる6モデルの横並び比較ではなく、各社の公式標準価格を観測する表です。

また、これはリスト価格です。batch、年間契約、無料枠、販促、Coding Plan、企業個別契約を使うと実現単価は下がります。cache hitも入力価格を大きく下げます。したがって、リスト価格から計算する売上は平均販売単価の上限寄りです。

## 推論原価をどのように推測するか

プロバイダのGPU調達価格、稼働率、ルーティング、障害率、実トラフィックは非公開です。そこで、原価推測を3段階に分けます。

| 推測方法 | 使えるもの | 強み | 限界 |
| --- | --- | --- | --- |
| A：同一モデルの絶対throughput | 公開ベンチマーク × セルフホストTCO | token原価を直接計算できる | SLO、負荷、GPUが本番と違う |
| B：開発元の過去運用開示 | GPU-hours、処理token、計算費 | provider運用に近い | 旧モデル、自己申告、監査なし |
| C：相対効率・必要分岐 | 「従来比40%削減」、損益分岐tok/s | 採算に必要な条件を示せる | 絶対原価は分からない |

active parameter数だけからthroughputを比例計算する方法は使いません。attention、expert routing、precision、MTP、通信、入力長で結果が大きく変わるためです。

## Alibaba / Qwen：専有デプロイ価格はあるが、容量が分からない

Qwen3.6-27Bはdense 27Bで、公式FP8 checkpointは約30.9GBです。[vLLM recipe](https://recipes.vllm.ai/Qwen/Qwen3.6-27B)では40GB級GPU1枚へ収まるため、6モデルの中で設備規模が大きく異なります。

前編の単GPU固定ケースは年間TCO約125.5万円、月約10.5万円でした。中国APIの4:1混合価格約138.6円／100万tokenと比べると、分岐は月約7.55億token、暦時間平均287 total tok/sです。

Alibabaは別に、Qwen3.6-27Bの[専有モデルデプロイ](https://help.aliyun.com/zh/model-studio/model-training-and-deployment-billing)を24,600元／月で販売しています。Pay-as-you-goの混合価格6元／100万tokenとの分岐は次です。

```text
24,600元 ÷ 6元 × 1M
= 41億token / 月
= 暦時間平均 約1,560 total tok/s
```

これは興味深い価格差ですが、専有インスタンスの保証throughputが公開されていないため、Alibabaの原価は逆算できません。24,600元は原価ではなく、専有サービスの小売価格です。

AlibabaのFY2026 [Cloud Intelligence売上は1,581.32億元、adjusted EBITAは142.65億元](https://www.hkexnews.hk/listedco/listconews/sehk/2026/0618/2026061800844.pdf)で、算術上のmarginは約9.0%です。最終四半期には外部クラウド売上の30%がAI関連でした。ただし、IaaS、PaaS、Model Studio、企業契約が混在し、Qwen APIの粗利ではありません。

**判断：Qwenは単GPUに収まり固定費を小さくしやすい一方、必要な平均287 tok/sをSLO内で満たす公式実測はありません。セルフホスト採算もAlibabaのQwen3.6 API固有の利益率も未確定です。**

## DeepSeek：旧世代の自己開示ではGPU費proxyが約$0.112/M

DeepSeekは6社の中で、過去の推論運用を最も具体的に公開しています。2025年の[DeepSeek-V3/R1推論システム概要](https://github.com/deepseek-ai/open-infra-index/blob/main/202502OpenSourceWeek/day_6_one_more_thing_deepseekV3R1_inference_system_overview.md)では、24時間平均226.75ノード、1ノード8×H800、608B input tokenと168B output tokenを処理した例を示しました。

同社が置いたH800 1GPU時2ドルを使うと、GPU費proxyは1日87,072ドルです。

```text
$87,072 ÷ (608B + 168B)
≈ $0.112 / 1M total token
```

同じ開示は、当時のcache構成と価格を使った理論売上を1日562,027ドルと置いています。同一開示内だけで比較すると、GPU費proxyを引いたmarginは約84.5%です。

```text
($562,027 − $87,072) ÷ $562,027 ≈ 84.5%
```

同社が記した545%は`(売上 − GPU費) ÷ GPU費`であり、売上に対する粗利率ではありません。この84.5%もV3/R1の理論売上に対するGPU費だけの比率で、実現粗利ではありません。

* 対象はV3/R1で、V4-Proではない
* 2ドル／H800時は同社の仮定で、実際の調達費ではない
* GPU費proxyには通信、ストレージ、非GPU設備、運用を含まない
* 同社自身も、理論売上より実売上は大幅に少ないと明記している

V4-Proは1.6T total／49B active、native mixed FP4/FP8です。[公式モデルカード](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro)では、V3.2と比べ1M contextでsingle-token FLOPsを27%、KV cacheを10%に抑えたとしています。DSparkもspeculative decodingの改善率を公表していますが、絶対throughput条件が欠けるため、現行原価へ更新できません。

**判断：DeepSeekの過去開示は、高稼働率の旧世代システムでGPU費proxyが理論売上を下回り得た例です。V4-Proの現行原価、実現売上、会社利益の証拠にはなりません。**

## Moonshot / Kimi：高いAPI単価だけでは黒字を証明できない

Kimi K2.6は1T total／32B active、native INT4で、公式の代表構成は8×H200です。前編の8×H200ケースでは年間TCO約2,412.1万円、月約201.0万円でした。

4:1混合価格は約246.5円／100万tokenなので、セルフホスト分岐は月約81.6億token、平均3,103 total tok/sです。価格だけ見れば大型モデルの中では分岐が低い一方、[SGLangのK2.6 recipe](https://docs.sglang.io/cookbook/autoregressive/Moonshotai/Kimi-K2.6.md)に載る絶対値は、同一architectureのK2.5を測った参考値です。K2.6の原価計算には使えません。

Moonshotは監査済みのAPI区分財務を公開していません。native INT4、8×H200配備、[batch価格が標準の60%](https://platform.kimi.com/docs/pricing/batch)であることは分かりますが、GPU調達費、稼働率、API販売量がありません。

**判断：同じ8×H200固定ケースでは大型モデル中の分岐量が比較的低いものの、K2.6自身の絶対throughputがないため、Moonshotの推論採算は公開資料だけでは判定不能です。**

## Z.ai / 智譜：技術推計とAPI区分粗利の両方がある

GLM-5.2は、現行モデルで最も推論原価を具体化しやすい例です。前編で使った8×B200の年間TCOは約3,036.1万円、月約253.0万円です。

以前の記事で参照したSGLangの固定commitでは、8×B200、FP8、8,192 input→1,024 output、MTPなしの測定から、4:1へ機械換算した生容量を月約474.1億tokenと置きました。60%の容量余力と99%の可用性を掛けた暫定容量は月約281.6億tokenです。

この2点から推論原価の参考レンジを作ると、次のようになります。

| ケース | 月間token | セルフホスト原価 / 1M | GLM中国混合価格277.2円に対する計算上のmargin |
| --- | ---: | ---: | ---: |
| 生ベンチマーク換算 | 474.1億 | 約53円 | 約81% |
| 60%容量・99%可用性 | 281.6億 | 約90円 | 約68% |

生ベンチマークはTTFTの長いthroughput測定で、販売可能goodputではありません。それでも、必要分岐が月91.3億tokenであるため、GLMは今回もっとも正の推論設備込み採算を説明しやすいモデルです。

財務面でも、智譜の[2025年年次業績](https://www1.hkexnews.hk/listedco/listconews/sehk/2026/0331/2026033101549.pdf)はOpen Platform/APIを区分開示しています。

| 智譜 2025年 | 金額 |
| --- | ---: |
| Open Platform/API売上 | 1.90379億元 |
| 同粗利 | 0.36000億元 |
| 同粗利率 | **18.9%** |
| 全社売上 | 7.24334億元 |
| R&D | 31.80443億元 |
| 調整後赤字 | 31.81972億元 |

2024年の同区分粗利率3.3%から18.9%へ改善し、API/Open Platform販売自体は正の粗利でした。一方、推計したGLM-5.2のserving margin proxy 68〜81%より大幅に低くなっています。

この差は矛盾ではありません。財務区分にはCoding Plan等を含み、実現単価、クラウド調達費、低稼働、提供運用が反映されます。さらに、2025年の区分は2026年6月公開のGLM-5.2より前です。

**判断：6社の中で、APIに近い区分が正の粗利だったことを最も強く確認できるのは智譜です。ただし、GLM-5.2の粗利率は不明で、全社は巨額R&Dのため赤字です。**

## MiniMax：公開ベンチマークと過年度区分粗利の見え方が逆になる

MiniMax-M3は約428B total／約23B active、MXFP8で約443.7GBです。[公式SGLang recipe](https://docs.sglang.io/cookbook/autoregressive/MiniMax/MiniMax-M3.md)は、8×B200、2,048 input→256 output、concurrency 64で、合計約19,080 total tok/sを示しています。

この測定は入力:出力=8:1で、本稿の価格主ケースは4:1です。GLMと同じ方法で、測定時のoutput throughputを`19,080 ÷ 9 = 2,120 tok/s`と置き、4:1へ機械換算すると`2,120 × 5 = 10,600 total tok/s`です。月約278.6億token、60%容量・99%可用性では約165.5億tokenとなります。

| ケース | セルフホスト原価 / 1M | M3混合価格約75.8円に対する計算上のmargin |
| --- | ---: | ---: |
| 4:1機械換算、生ベンチマーク | 約91円 | **約-20%** |
| 4:1機械換算、60%容量・99%可用性 | 約153円 | **約-102%** |

つまり、公開リスト価格は、8×B200を小売価格で調達する単一ノードのセルフホスト想定にはかなり厳しい水準です。入力比率を変えたときに同じoutput throughputが維持される保証はないため、この値も方向を見る参考に限られ、最終判定には4:1の直接測定が必要です。

一方、MiniMaxの[IPO目論見書](https://www1.hkexnews.hk/listedco/listconews/sehk/2025/1231/2025123100025.pdf)では、2025年1〜9月の「Open Platform and other AI-based enterprise services」が売上1,541.7万ドル、粗利1,070.2万ドル、粗利率69.4%でした。

ただし、この区分にはAPIだけでなく、専用推論プール、カスタム案件、モデルライセンスが含まれます。M3公開前でもあり、「M3 APIの粗利率は69.4%」とは言えません。

[IPO目論見書](https://www1.hkexnews.hk/listedco/listconews/sehk/2025/1231/2025123100025.pdf)では、2025年1〜9月の売上原価の92.7%が推論クラウド費でした。2025年通期の[全社売上は7,903.8万ドル、全社粗利率25.4%、R&Dは2億5,277.1万ドル、調整後赤字は2億5,085.6万ドル](https://www1.hkexnews.hk/listedco/listconews/sehk/2026/0302/2026030202837.pdf)で、通期資料はR&D増加を基盤モデルの学習関連クラウド費などで説明しています。

**判断：MiniMaxはAPIを含む企業向け販売で正の粗利を作った実績があります。ただしM3の安い現行価格が単独で黒字か、他の企業向け売上が粗利を押し上げたかは分かりません。**

## Tencent / Hy3：価格は最安だが、絶対原価は開示されていない

Hy3は295B total／21B active、MTP layer 3.8Bです。Tencent TokenHubの4:1混合価格は1.6元、約37.0円／100万tokenで、今回の6モデル中もっとも安くなります。

8×H200のセルフホスト想定でこの価格へ並ぶには、月約543.8億token、平均20,694 total tok/sが必要です。公式vLLM recipeには4×GB300で約8,408 total tok/sの測定がありますが、GPUも費用も異なるため、Hy3の原価へ直接使えません。

Tencentは2026年6月の会社資料で、Hy3 previewの推論費を従来モデル比で40%以上削減したと説明しています。相対改善は価格設定を支える方向ですが、比較元の絶対原価がないため37.0円／100万tokenを下回ったとは証明できません。

Tencentの[2026年第1四半期](https://static.www.tencent.com/uploads/2026/05/13/59cf8219adbb046153f69387479350ac.pdf)では、FinTech and Business Services売上598.85億元、粗利311.76億元、粗利率52%です。しかし、決済、資産運用、EC技術、クラウドが混在します。AI投資と無料製品も一体で、Hy3 APIの推論粗利ではありません。

**判断：Hy3は小規模セルフホストが追随しにくい価格です。Tencentの規模、内部需要、相対効率改善は説明要因になりますが、現行APIの正負は非開示です。**

## 開示のAPI採算への近さを並べる

6社の開示範囲を同じものとして扱うことはできません。

| API採算への近さ | 会社 | 開示から言えること | 言えないこと |
| --- | --- | --- | --- |
| A：API近似 | 智譜 | 2025 Open Platform/APIは粗利率18.9%で正の粗利 | GLM-5.2固有の粗利、全社黒字 |
| B+：企業向け混合 | MiniMax | 2025年1〜9月のAPIを含む企業向け区分は粗利率69.4% | API単独、M3固有の粗利 |
| B：広いクラウド | Alibaba | FY2026 Cloud Intelligenceのadjusted EBITA marginは約9.0% | Qwen APIの粗利 |
| B-：さらに広い混合 | Tencent | FinTech & Business Services全体は正の粗利 | Cloud、Hy3 APIの単独採算 |
| C：技術・価格のみ | DeepSeek | 旧世代の日次計算proxy、現行価格、相対効率 | 監査済み粗利、V4-Pro固有採算 |
| C：技術・価格のみ | Moonshot | 現行価格、INT4、配備構成 | 監査済み粗利、K2.6固有採算 |

重要なのは、**現行6モデル固有の黒字を財務開示から証明できる会社はゼロ**という点です。財務数値がある智譜、MiniMax、Alibaba、Tencentでも対象モデルは開示期間後に登場し、DeepSeekとMoonshotには監査済みAPI区分財務がありません。

## 実現単価とprovider原価は、どちらも公開比較からずれる

推定には、売上側と原価側の両方に逆向きの誤差があります。

### 売上を下げる要因

* cache hit価格
* batch割引
* Coding Planやtoken plan
* 無料Web・アプリ利用
* 大口契約、販促、無料枠
* 思考tokenの計上方法と出力長の違い

### 原価を下げる要因

* GPUの大量調達割引
* 既存クラウド設備との共用
* 複数モデル間の需要平準化
* native FP4/INT4、MTP、sparse attention
* 高いbatching効率とprefix cache
* 内部トラフィックを含む高稼働率

### 原価を上げる要因

* 複数地域と冗長化
* peakに備えた遊休容量
* GPU故障、保守、モデル切替
* moderation、ログ、課金、サポート
* 長context、画像・動画入力、失敗した生成

そのため、小売GPU価格で作ったセルフホスト原価を「provider原価」と呼ぶのも、リスト価格を「平均売価」と呼ぶのも不適切です。本稿の推計は、黒字化に必要な桁と、公式発表・財務開示の整合性を確認するものです。

## どこまで結論できるか

公開資料から支持できる主張は、次の通りです。

* 高稼働率の推論ノードでは、現在のAPI価格でも正のserving margin proxyを作り得る
* 智譜では2025年のAPI/Open Platform区分が実際に正の粗利だった
* MiniMaxでもAPIを含む企業向け区分は正の粗利だった
* DeepSeekの旧世代自己開示は、自己申告throughputへ仮定GPU単価を当てた低いGPU費proxyを示す
* Alibaba Cloudは正のadjusted EBITA、Tencentの広域区分は正の粗利だが、LLM API単独の証拠ではない
* 会社全体の赤字は、推論tokenを追加販売するたび赤字になることを意味しない

一方、次は断定できません。

* DeepSeekとMoonshotの現行APIが黒字である
* GLM-5.2とMiniMax-M3の過年度区分粗利が現在も同じである
* Hy3の約37.0円／100万tokenが販促ではなく恒常的な完全原価を回収している
* 各社が学習費までAPI売上だけで回収している
* 現行6モデルのモデル別粗利率

## 結論

中国系LLMプロバイダについて、**過年度のAPI近似区分で正の粗利を開示した例があり、智譜ではOpen Platform/APIの粗利率が18.9%でした**。しかし、現行フロンティアモデルごとの推論原価と販売量は非公開であり、全社を一括して黒字・原価割れと判定することはできません。

技術面では、GLM-5.2は公開throughputとセルフホストTCOから正のserving margin proxyを説明しやすく、DeepSeekの過去運用開示には仮定GPU単価による低い費用proxyがあります。MiniMax-M3とHy3の価格は小売設備を使うセルフホスト想定には非常に厳しく、provider側の調達力、稼働率、量子化、batching、他事業との混合が重要になります。

財務面では、推論販売の粗利と会社全体の利益を分ける必要があります。智譜とMiniMaxは推論販売を含む区分で正の粗利を示しながら、巨額の学習・R&Dによって会社全体では赤字です。これは矛盾ではなく、**推論を売る経済と、フロンティアモデルを作り続ける経済が別である**ことを示しています。

現時点のもっとも正確な答えは、次の一文です。

> 中国系LLM APIは、高稼働率の推論設備では設備込み採算が正になり得て、過年度のAPI近似区分が正の粗利だった開示例もある。ただし、2026年の現行フロンティアモデルごとの完全原価、販売量、粗利は公開されておらず、各社の黒字を一律には証明できない。

## 主な一次資料

* [Alibaba FY2026 Results](https://www.hkexnews.hk/listedco/listconews/sehk/2026/0618/2026061800844.pdf)
* [DeepSeek V3/R1 Inference System Overview](https://github.com/deepseek-ai/open-infra-index/blob/main/202502OpenSourceWeek/day_6_one_more_thing_deepseekV3R1_inference_system_overview.md)
* [智譜 2025 Annual Results](https://www1.hkexnews.hk/listedco/listconews/sehk/2026/0331/2026033101549.pdf)
* [MiniMax IPO Prospectus](https://www1.hkexnews.hk/listedco/listconews/sehk/2025/1231/2025123100025.pdf)
* [MiniMax 2025 Annual Results](https://www1.hkexnews.hk/listedco/listconews/sehk/2026/0302/2026030202837.pdf)
* [Tencent 2026 Q1 Results](https://static.www.tencent.com/uploads/2026/05/13/59cf8219adbb046153f69387479350ac.pdf)
* [Tencent Company Presentation, June 2026](https://static.www.tencent.com/uploads/2026/06/17/8bc964b385a06fabaecb8b6ce0bffff4.pdf)
