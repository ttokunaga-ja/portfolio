---
title: "中国系フロンティア公開重みLLMをセルフホストするのは経済的に合理的か"
abstract: "はじめに 結論を先に言うと、公開重みであることと、セルフホストが安いことは別問題です。2026年7月10日時点の中国系フロンティアモデル6種を、公式レシピに記載された起動可能なGPU構成へ机上で落とし込み、電力、初期投資、コロケーション、資本コスト、公式API価格を比較しました。 入力80%・出力20%、キャッシュなしの固定ケースでは、APIより安くするため"
publishedAt: "2026-07-10"
canonicalUrl: "https://zenn.dev/t_tokunaga/articles/2026-07-10-china-open-weight-self-host-economics"
tags:
  - "ai"
  - "llm"
  - "gpu"
  - "selfhost"
  - "china"
---

## はじめに

結論を先に言うと、**公開重みであることと、セルフホストが安いことは別問題**です。2026年7月10日時点の中国系フロンティアモデル6種を、公式レシピに記載された起動可能なGPU構成へ机上で落とし込み、電力、初期投資、コロケーション、資本コスト、公式API価格を比較しました。

入力80%・出力20%、キャッシュなしの固定ケースでは、APIより安くするために必要な月間需要は、Qwen3.6-27Bの単GPU構成でも約7.5億token、8GPU級では約81.6億〜543.8億tokenです。

![中国系フロンティア公開重みモデル6種について、公式APIより安くするために必要な月間token量と平均tok/sを比較した図](/images/blog/2026-07-10-china-open-weight-self-host-economics/2026-07-10-china-open-weight-self-host-economics/api-break-even-demand.png)

*図の棒は需要予測ではなく、内部利用TCOの損益分岐です。人件費、外部API運用、SLA用二重化は含みません。Qwenは単GPU、DeepSeek・Kimi・Hy3は8×H200、GLM・MiniMaxは8×B200の固定ケースです。DeepSeekの8×H200は公式recipe上800K contextに制限され、1M APIと機能同等ではありません。必要な平均tok/sは、保守や需要変動を含む暦時間平均であり、瞬間的なベンチマーク値ではありません。*

主な判断は次の通りです。

| 利用者・モデル | 今回の判断 |
| --- | --- |
| 個人、研究室、小規模チーム | 大型5モデルは、価格だけならAPIまたは短期クラウドが合理的。データ主権、オフライン利用、APIでは得られない制御性に別の価値がある場合を除く |
| Qwen3.6-27B | 単GPUへ収まるため、月約7.5億tokenを継続利用し、平均287 total tok/sをSLO内で出せるなら候補になる。絶対throughputの公式値がないので要実測 |
| GLM-5.2 | 公開済み8×B200ベンチマークとの比較では、今回もっともセルフホスト採算を説明しやすい。ただし高throughput測定を対話APIのgoodputと同一視できない |
| Kimi K2.6 | API単価が比較的高いため分岐点は低めだが、同条件のK2.6実測がなく未確定 |
| DeepSeek-V4-Pro | 公式APIが非常に安い。8×H200で平均9,274 total tok/sを常時販売できるかが条件で、小規模利用には厳しい |
| MiniMax-M3 | 公式8:1ベンチマークを主ケースの4:1へ機械換算すると、必要throughputを下回る。小売価格で調達する単一ノードのセルフホスト想定には厳しい |
| Tencent Hy3 | APIが最も安く、分岐に平均20,694 total tok/sが必要。少数ノードのセルフホスト想定には厳しい価格設定 |

したがって、現時点の答えは、**大量かつ安定した既知の需要があり、対象構成のベンチマークが分岐throughputを上回る場合にだけ合理的**です。需要を確認する前にセルフホスト設備を導入する想定では、稼働率の不足が電気代の差を簡単に上回ります。

:::message
この記事は2026年7月10日時点の公開価格・公式モデルカード・公式推論レシピに基づく机上試算です。機材の購入・設置や、6モデルを同一クラスタで動かす実測検証は行っていません。金額は導入検討前の比較用アンカーであり、税務・会計上の助言でもありません。
:::

## 比較するモデルを中国系各社のフロンティアモデルに限定する

比較対象は、中国系の主要開発企業から1モデルずつ、次の条件で選びました。

1. 2026年7月10日時点で、企業自身が配布する重みを取得できる
2. 汎用的な会話、推論、コーディング、Agent用途を狙う最新級モデルである
3. 公式または推論エンジン開発元の実行レシピがある
4. 同一企業の小型・旧世代・用途特化モデルを重複して入れない

Moonshotは、より新しいKimi K2.7 Codeではなく、汎用フロンティアモデルのKimi K2.6を使います。Qwenも閉じた最上位APIモデルではなく、公開重みのQwen3.6-27Bを対象にします。

| 開発元 | モデル | 公開日 | 総／active parameters | context | 公開checkpoint | license |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Alibaba / Qwen | [Qwen3.6-27B](https://huggingface.co/Qwen/Qwen3.6-27B) | 2026-04-22 | dense 27B | native 262,144 | BF16 55.6GB、FP8 30.9GB | Apache-2.0 |
| DeepSeek | [DeepSeek-V4-Pro](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro) | 2026-04-24 | 1.6T / 49B | 1M | native mixed FP4/FP8 864.7GB | MIT |
| Moonshot AI | [Kimi K2.6](https://huggingface.co/moonshotai/Kimi-K2.6) | 2026-04-20 | 1T / 32B | 262,144 | native INT4 595.2GB | Modified MIT |
| Z.ai / 智譜 | [GLM-5.2](https://huggingface.co/zai-org/GLM-5.2-FP8) | 2026-06-16 | 約744B / 約40B | 1M | FP8 755.6GB | MIT |
| MiniMax | [MiniMax-M3](https://huggingface.co/MiniMaxAI/MiniMax-M3-MXFP8) | 2026-06-01 | 約428B / 約23B | 1M | MXFP8 443.7GB | MiniMax Community License |
| Tencent | [Hy3](https://huggingface.co/tencent/Hy3-FP8) | 2026-07-02 | 295B / 21B、MTP 3.8B | 262,144 | FP8 299.9GB | Apache-2.0 |

ファイルサイズは各社のHugging Faceリポジトリにある`*.safetensors`を合計した値で、tokenizerや設定ファイルを含みません。GLM-5.2は資料によって約743B〜753Bと数え方が異なります。本文ではbackboneの公式説明に近い約744B／40B activeを使い、公開tensor inventoryにはMTP等が含まれる可能性があるものとして扱います。

また、公開重みでもライセンスは同じではありません。Kimi K2.6には大規模商用製品での表示条件、MiniMax-M3には表示、通知、一定規模以上での事前承認などの追加条件があります。API価格だけでなく、想定用途がライセンスへ適合するかも導入前に確認する必要があります。

## 「重みが載る」と「安く提供できる」を分ける

公式レシピから確認できる代表構成は次の通りです。

| モデル | 公式レシピで確認できる構成 | 今回の費用ケース |
| --- | --- | --- |
| Qwen3.6-27B | [SGLang cookbook](https://docs.sglang.io/cookbook/autoregressive/Qwen/Qwen3.6.md)はH100/H200/B200 × 1、vLLMはFP8なら40GB級 × 1 | 96GB級GPUを1枚積むワークステーション |
| DeepSeek-V4-Pro | [vLLM recipe](https://recipes.vllm.ai/deepseek-ai/DeepSeek-V4-Pro)に8×H200/B300級。8×H200はKV余力のため800K contextへ制限。DSparkのpublisher例は4×GB300 | 8×H200、800K上限 |
| Kimi K2.6 | [公式deployment guide](https://huggingface.co/moonshotai/Kimi-K2.6/blob/main/docs/deploy_guidance.md)は8×H200、TP8 | 8×H200 |
| GLM-5.2 | [vLLM recipe](https://recipes.vllm.ai/zai-org/GLM-5.2)はFP8を8×H200/H20、1M全長は8×B200 | 8×B200 |
| MiniMax-M3 | [vLLM recipe](https://recipes.vllm.ai/MiniMaxAI/MiniMax-M3)はBF16を8×H200、MXFP8を8×B200 | 8×B200 |
| Hy3 | [vLLM recipe](https://recipes.vllm.ai/tencent/Hy3)は8×H200/H20-3e。参考ベンチマークは4×GB300 | 8×H200 |

DeepSeekの費用ケースは公式APIの1M contextと機能同等ではありません。1M全長を必須にする場合はB300等の構成を別途見積もる必要があり、今回の8×H200分岐より不利になります。

ここで確認できるのは、checkpointがGPUメモリに収まり、推論サーバーを起動できることまでです。経済性を決めるのは、次の条件を満たす**販売可能goodput**です。

* 目標とする入力長・出力長で動く
* P95のTTFTとTPOTがサービス目標を満たす
* エラー、タイムアウト、再試行を除いたtokenだけを数える
* 突発負荷、保守、障害のための容量余力を残す
* その処理量に見合う実需要が存在する

モデルカードに「8GPUで動く」と書かれていても、この条件は証明されません。

## 初期投資を現在の完成サーバー価格から置く

完成8GPUサーバーの価格アンカーには、[ExxactのHGX製品一覧](https://www.exxactcorp.com/category/NVIDIA-HGX)に掲載された開始価格を使います。2026年7月10日のsnapshotでは、8×H200完成サーバーが299,890.80ドル、8×B200完成サーバーが383,707.50ドルです。為替は[日本銀行の2026年7月報告省令レート](https://www.boj.or.jp/about/services/tame/tame_rate/syorei/hou2607.htm)である1ドル158円へ固定します。

国内OEM、保守、輸送、設置、メモリ、ストレージ構成で実見積は変わります。そこで、完成サーバー価格へ据付、PDU、ケーブル、予備費として10%を加えます。

| 構成 | 完成サーバー価格 | 10%導入費込みの初期投資 | 主な対象 |
| --- | ---: | ---: | --- |
| 単GPUワークステーション | 固定シナリオ入力 | **300万円** | Qwen3.6-27B |
| 8×H200 | 約4,738万円 | **約5,212万円** | DeepSeek、Kimi、Hy3 |
| 8×B200 | 約6,063万円 | **約6,669万円** | GLM、MiniMax |

単GPUの300万円は完成機の公開見積ではありません。[RTX PRO 6000 Blackwell級の96GB GPU](https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-6000/)、CPU、RAM、SSD、電源、予備費をまとめた比較用の固定値です。Qwenの公式FP8 recipeは40GB級へ収まるため容量には余裕がありますが、このワークステーションで必要throughputが出ることは別途確認します。

## 月額TCOは電気代だけでは決まらない

セルフホスト設備の取得額を想定し、単純に36か月で割るのではなく、今回は4年、資本コスト5%の資本回収係数を使います。

```text
CRF = r(1+r)^n / ((1+r)^n - 1)
    = 5% × 1.05^4 / (1.05^4 - 1)
    ≈ 0.2820

年間TCO
= 初期投資 × CRF
+ 初期投資 × 保守率5%
+ コロケーション
+ 回線
```

コロケーションは高密度GPU施設の実見積ではなく、[クオリサイトの公開価格](https://www.qualysite.co.jp/services/data/housing/)を電力・空調込みの価格proxyとして使います。8×H200は4回路、8×B200は5回路相当と置きます。実際には、[IDCFの高負荷ハウジング](https://www.idcf.jp/datacenter/colocation/high-power/)などへ、受電容量、冗長回路、重量、冷却方式を指定して見積依頼する必要があります。

| 年間費用 | 単GPU | 8×H200 | 8×B200 |
| --- | ---: | ---: | ---: |
| 資本回収 | 84.6万円 | 約1,469.9万円 | 約1,880.7万円 |
| 保守・予備品 | 15.0万円 | 約260.6万円 | 約333.4万円 |
| 電力・空調・設置場所 | 13.9万円 | 約621.6万円 | 約762.0万円 |
| 回線・監視 | 12.0万円 | 60.0万円 | 60.0万円 |
| **年間TCO** | **約125.5万円** | **約2,412.1万円** | **約3,036.1万円** |
| **月額換算** | **約10.5万円** | **約201.0万円** | **約253.0万円** |

単GPUの電力・設置費13.9万円／年は、システム全体をidle 0.25kW、load 0.85kW、計算稼働率50%、PUE 1.2、24.07円/kWhと置いた固定シナリオです。実際に導入を検討する際は、対象構成のコンセント側電力へ差し替えます。

このTCOは、内部利用の推論基盤を比較するための値です。人件費、APIゲートウェイ、DDoS防御、課金、24時間オンコール、税金、モデル更新費、二重化を含みません。外部向けSLAを持つAPIなら、最低でも冗長ノードと運用費を追加する必要があります。

### クラウドなら低稼働率の設備を抱えずに済む

[Nebiusの公示価格](https://nebius.com/prices)はH200が4.50ドル、B200が7.15ドル／GPU時です。8×B200を1年間予約なしで連続使用すると約7,917万円となり、セルフホスト設備を保有する想定の年間TCO約3,036万円より高く見えます。

しかし、必要な時間だけ借りる場合の分岐は次の通りです。

* 8×B200の設備保有とオンデマンドの分岐は、暦時間稼働率約38%
* 最大35%のコミット割引を取れるなら、設備保有の分岐は約59%
* 8×H200も同様に、低稼働率やモデル更新リスクが大きい間はクラウドが有利

つまり、PoCの段階でセルフホスト設備の保有を正当化するのは難しく、最初にクラウドで実負荷を再生し、稼働率が分岐を越える見込みを確認してからセルフホストへ移行する順序が合理的です。

## 日本の電力価格を変えても、GPUの稼働率の方が効く

[東京電力の2026年高圧・関東「市場調整ゼロプラン」](https://www4.tepco.co.jp/ep/corporate/plan_h/pdf/2026minaoshisiryou.pdf)の電力量料金17.21円/kWh、計量期間の始期が毎月1日ではない場合の[2026年7月燃料費調整2.68円/kWh](https://www.tepco.co.jp/ep/private/fuelcost2/newlist/index-j.html)、[2026年度の再エネ賦課金4.18円/kWh](https://www.meti.go.jp/press/2025/03/20260319004/20260319004.html)を単純に足し、基準を24.07円/kWhとします。毎月1日起算の7月分は同日時点で未確定であり、別に需要基本料金も掛かります。

設備価格アンカーとしたExxact筐体には、公開された壁電力の実測がありません。そこで、同じ8×B200を積む[NVIDIA DGX B200の最大14.3kW](https://docs.nvidia.com/dgx/dgxb200-user-guide/introduction-to-dgxb200.html)を高ケースのproxyにします。また、[Vultrの実機ガイド](https://docs.vultr.com/inference-cookbook/cuda/getting-started/hardware-overview)が示す8GPU合計full load 5.6〜8.0kWへ、ホスト側1.2〜1.4kWをシナリオ入力として加え、システム約6.8〜9.4kWを実負荷の目安にします。導入検討時は[NVIDIAのRedfish API](https://docs.nvidia.com/dgx/dgxb200-user-guide/redfish-api-supp.html)またはPDUで得た対象構成の測定値へ置き換えます。

| ケース | IT負荷 | PUE | 電力単価 | 年間電力量費 |
| --- | ---: | ---: | ---: | ---: |
| 低 | 6.83kW | 1.3 | 20円/kWh | 約156万円 |
| 基準 | 8.0kW | 1.4 | 24.07円/kWh | 約236万円 |
| 高 | 14.3kW | 1.7 | 35円/kWh | 約745万円 |

この表はセルフホスト設備で電気を直接払う想定だけの感度分析です。電力費の高低に加え、6,000万円級の初期投資を低稼働率で抱える影響も別途評価する必要があります。

なお、上のTCO表ではコロケーション料金に電力・空調を含めています。そこへPUEを掛けた電気代を再度加えると二重計上です。自社設備ケースとコロケーションケースは別々に使います。

## 公式API価格を同じ入力・出力比へ直す

API価格は入力と出力で異なります。主ケースは入力:出力=4:1、cache hit=0%なので、100万課金token当たりの混合価格を次で計算します。

```text
混合価格 = 0.8 × input price + 0.2 × output price
```

ドル価格は1ドル158円、中国価格は同じ[日本銀行の2026年7月報告省令レート](https://www.boj.or.jp/about/services/tame/tame_rate/syorei/hou2607.htm)にある1元0.146ドルから、1元23.1円へ丸めます。Qwen、GLM、Hy3は中国国内の安い公式価格を主ケースに使うため、セルフホストに厳しい比較です。SingaporeまたはGlobal料金では分岐量が下がります。

| モデル | input / 1M | output / 1M | 混合価格 / 1M | 価格の地域 |
| --- | ---: | ---: | ---: | --- |
| Qwen3.6-27B | 3元 | 18元 | **約138.6円** | Alibaba中国内地 |
| DeepSeek-V4-Pro | $0.435 | $0.87 | **約82.5円** | DeepSeek標準 |
| Kimi K2.6 | $0.95 | $4.00 | **約246.5円** | Kimi Global |
| GLM-5.2 | 8元 | 28元 | **約277.2円** | Z.ai中国 |
| MiniMax-M3、512K以下 | $0.30 | $1.20 | **約75.8円** | 現行50%割引価格 |
| Hy3 | 1元 | 4元 | **約37.0円** | Tencent TokenHub広州 |

価格の出典は[Alibaba Model Studio](https://help.aliyun.com/zh/model-studio/model-pricing)、[DeepSeek API](https://api-docs.deepseek.com/quick_start/pricing)、[Kimi K2.6](https://www.kimi.com/resources/kimi-k2-6-pricing)、[Z.ai](https://open.bigmodel.cn/pricing)、[MiniMax PAYG](https://platform.minimax.io/docs/guides/pricing-paygo)、[Tencent TokenHub](https://cloud.tencent.com/product/tokenhub)です。

地域、税、長文tier、batch、契約割引、無料枠はそろっていません。これは標準価格を同じtoken比へ直した比較で、各社の平均実現単価ではありません。

## APIより安くなる分岐点を計算する

月間損益分岐量と、それを月730時間で処理するための平均total tok/sは次で求めます。

```text
月間分岐token = 月額TCO ÷ 混合価格 × 1,000,000
必要平均total tok/s = 月間分岐token ÷ (730 × 3,600)
```

| モデル | 費用構成 | 月額TCO | 月間分岐token | 必要平均total tok/s |
| --- | --- | ---: | ---: | ---: |
| Qwen3.6-27B | 単GPU | 約10.5万円 | **約7.55億** | **287** |
| DeepSeek-V4-Pro | 8×H200 | 約201.0万円 | **約243.7億** | **9,274** |
| Kimi K2.6 | 8×H200 | 約201.0万円 | **約81.6億** | **3,103** |
| GLM-5.2 | 8×B200 | 約253.0万円 | **約91.3億** | **3,473** |
| MiniMax-M3 | 8×B200 | 約253.0万円 | **約333.6億** | **12,695** |
| Hy3 | 8×H200 | 約201.0万円 | **約543.8億** | **20,694** |

この平均値には停止時間も含まれます。可用性99%、販売可能容量60%と置くなら、ベンチマーク時の生throughputは、この値を`0.99 × 0.60`で割った水準を上回る必要があります。たとえばGLM-5.2なら、単純な最低線は約5,847 total tok/sです。

## 公開ベンチマークでどこまで判定できるか

6モデルすべてについて、同じGPU、精度、入力長、出力長、同時実行数、SLOの公式結果はありません。したがって、公開値は分岐throughputの妥当性確認にだけ使い、欠けた値をactive parameter数から補間しません。

| モデル | 公開値から分かること | 経済性の判定 |
| --- | --- | --- |
| Qwen | GPU版の絶対throughput結果なし | 平均287 tok/sを対象構成で確認するまで未確定 |
| DeepSeek | [DSpark論文](https://arxiv.org/abs/2607.05147)は従来speculative構成に対する改善率を示すが、絶対throughputや負荷条件は非公開 | 平均9,274 tok/sを満たす証拠にはならない |
| Kimi | [SGLang recipe](https://docs.sglang.io/cookbook/autoregressive/Moonshotai/Kimi-K2.6.md)に8×H200、8K→1Kの参考値があるが、測定対象は同一architectureのK2.5 | K2.6の採算判定には使えない |
| GLM | [SGLang recipe](https://docs.sglang.io/cookbook/autoregressive/GLM/GLM-5.2.md)に8×B200の絶対値がある。[以前の記事で使ったMTPなしの固定commit](https://github.com/sgl-project/sglang/blob/b86466d54b2ff3f7d1635fd9a856a95ab3dba9b6/docs_new/src/snippets/configs/zai-org/glm-5.2-benchmarks.jsx)では4:1換算18,040 total tok/s | 必要3,473 tok/sは生値の約19%。60%容量・99%可用性の算術値に対して約32%で、候補になり得る |
| MiniMax | [SGLang recipe](https://docs.sglang.io/cookbook/autoregressive/MiniMax/MiniMax-M3.md)は8×B200、2K→256で合計約19,080 total tok/s | 測定は入力:出力=8:1。出力throughputを固定して4:1へ機械換算すると約10,600 total tok/sとなり、必要12,695を下回る。4:1負荷で再測定が必要 |
| Hy3 | [vLLM recipe](https://recipes.vllm.ai/tencent/Hy3)は4×GB300、8K→1Kで約8,408 total tok/s | 今回の8×H200構成と異なり、必要20,694 tok/sとの直接比較不可。分岐は厳しい |

GLM-5.2の高throughput測定も、そのまま対話APIの販売可能量ではありません。以前の記事で参照した測定点はTTFTが長く、低遅延の対話SLOを課すとgoodputが落ちます。今回の「GLMは候補」という判断も、同じ4:1ワークロードでP95 TTFT・TPOTを固定した再測定が条件です。

## キャッシュが効くほど、APIがさらに有利になる

主ケースでcache hitを0%としたのは、Qwen3.6-27Bに比較可能なcache価格がなく、全社をそろえるためです。実際には、DeepSeek、Kimi、GLM、MiniMax、Hy3がcache hitへ大きな割引を設けています。

cache hit率を`h`とすると、1リクエストのAPI費用は次です。

```text
API費用
= input tokens × ((1-h) × miss価格 + h × hit価格)
+ output tokens × output価格
```

長いsystem prompt、コードベース、会話履歴を繰り返す用途では、API側のcache hitが上がり、セルフホストの損益分岐token量はさらに増えます。一方、セルフホスト推論でもprefix cacheを使えますが、削減できるのは計算量であって、保有GPUの固定費ではありません。需要が少ない状態では、キャッシュで空いた時間を別の有料処理へ埋められなければTCOは下がりません。

## セルフホストが合理的になる4条件

今回の比較から、セルフホスト設備の保有を合理化できる条件は次の4つです。

1. **需要が既にある**：将来の期待ではなく、APIログから月間token量と時間帯分布を確認できる
2. **SLO付きgoodputが分岐を超える**：最大throughputではなくP95遅延を守ったaccepted tokenで測る
3. **稼働率がクラウドとの分岐を超える**：B200ならオンデマンド比で約38%、割引クラウド比では約59%が目安
4. **設備を3〜5年使える**：新モデルが別precision、別GPU、より大きなHBMを要求しても資産が陳腐化しない

逆に、次の用途はAPIまたは短期クラウドが合理的です。

* 月ごとの需要が大きく変動する
* 最新モデルへ数か月ごとに乗り換える
* 1M contextをたまにしか使わない
* 24時間対応やGPU故障の予備機をセルフホスト環境として用意できない
* APIのbatch、cache、年間契約割引を利用できる

データを外部へ出せない、閉域・オフラインで動かす必要がある、モデル内部へ手を入れる必要がある場合は、価格以外の便益を金額へ置き換えるべきです。その便益が年間TCO差より大きければ、token単価だけで負けてもセルフホストは合理的になり得ます。

## セルフホスト導入判断前に行うクラウド検証

最終判断には、セルフホスト候補と同じGPU構成をクラウドで借り、少なくとも次を測ります。

| 検証 | 固定する条件 | 取得する値 |
| --- | --- | --- |
| 短文 | 2K input → 256 output | P50/P95 TTFT、P95 TPOT、goodput |
| 標準 | 8K → 1K | 同上 |
| 長文 | 32K → 4K | 同上、KV cache使用量、OOM率 |
| cache | hit率0%／50% | goodputと電力の差 |
| concurrency sweep | 1、8、32、64、128… | SLOを超える直前の同時実行数 |
| 電力 | idle、model loaded、prefill、decode、飽和 | PDUまたはRedfishの平均・P95 kW |
| 安定性 | 72時間以上 | error、再起動、thermal throttling、回復時間 |

比較に使うtoken数は、クライアントへ正常返却できたinput＋output tokenです。`ignore_eos`を使った合成負荷の最大値だけで導入判断をしません。

実測後は、次の式へ置き換えます。

```text
自己ホスト原価（円 / 1M token）
= 年間TCO × 1,000,000
  ÷ 年間のSLO適合input+output token
```

この原価が、cache、batch、契約割引を反映した実際のAPI請求単価を十分に下回り、需要の下振れと故障を加えても差が残る場合にだけセルフホスト設備の保有を選択します。

## 結論

2026年7月時点の中国系フロンティア公開重みモデルは、単GPUから8GPUまで公式レシピ上の実行構成があります。しかし、経済性の中心は電力単価ではなく、**GPUの初期投資、稼働率、コロケーション、SLO付きthroughput、そして実需要**でした。

今回の固定ケースでは、Qwen3.6-27Bは月約7.5億token、GLM-5.2は約91.3億tokenからセルフホストが公式API価格へ並びます。GLMは公開ベンチマーク上その分岐を越え得ますが、対話SLOと需要は未検証です。DeepSeek、MiniMax、Hy3はAPIが安く、少数ノードで対抗するには非常に高い利用率が必要です。

したがって実務上の順序は、**APIログで需要を確認する → 同じGPUを短期レンタルする → 実負荷goodputと壁電力を測る → 分岐を越えた後にセルフホストへ移行する**、となります。公開重みはセルフホストする権利を与えますが、セルフホストすべき理由までは与えません。

次の記事では、このセルフホストTCOと必要throughputを、中国系各社の公式API価格、技術発表、財務開示へ照らし合わせ、推論販売そのものに利益が出ているとどこまで推定できるかを検討します。

## 主な一次資料

* [Qwen3.6-27B model card](https://huggingface.co/Qwen/Qwen3.6-27B)
* [DeepSeek-V4-Pro model card](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro)
* [Kimi K2.6 model card](https://huggingface.co/moonshotai/Kimi-K2.6)
* [GLM-5.2 FP8 model card](https://huggingface.co/zai-org/GLM-5.2-FP8)
* [MiniMax-M3 model card](https://huggingface.co/MiniMaxAI/MiniMax-M3)
* [Tencent Hy3 model card](https://huggingface.co/tencent/Hy3)
* [Exxact NVIDIA HGXサーバー価格一覧](https://www.exxactcorp.com/category/NVIDIA-HGX)
* [NVIDIA DGX B200 User Guide](https://docs.nvidia.com/dgx/dgxb200-user-guide/introduction-to-dgxb200.html)
* [Nebius GPU pricing](https://nebius.com/prices)
* [東京電力 2026年高圧料金](https://www4.tepco.co.jp/ep/corporate/plan_h/pdf/2026minaoshisiryou.pdf)
