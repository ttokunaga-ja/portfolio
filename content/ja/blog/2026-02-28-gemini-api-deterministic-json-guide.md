---
title: "Gemini APIで出力を固定化し、綺麗なJSON配列を取得する完全ガイド"
abstract: "LLM（大規模言語モデル）のAPIをシステムに組み込む際、多くの開発者が直面する壁があります。それは 「LLMの出力が毎回変わってしまうこと」 と 「余計な挨拶文が含まれてプログラムでパース（解析）できないこと」 です。 この記事では、Gemini API（特に gemini-3-flash-preview などの最新モデル）を用いて、出力を完全に固定化（決"
publishedAt: "2026-02-28"
canonicalUrl: "https://zenn.dev/t_tokunaga/articles/2026-02-28-gemini-api-deterministic-json-guide"
tags:
  - "gemini"
  - "api"
  - "json"
  - "llm"
  - "googlecloud"
---

LLM（大規模言語モデル）のAPIをシステムに組み込む際、多くの開発者が直面する壁があります。それは **「LLMの出力が毎回変わってしまうこと」** と **「余計な挨拶文が含まれてプログラムでパース（解析）できないこと」** です。

この記事では、Gemini API（特に `gemini-3-flash-preview` などの最新モデル）を用いて、**出力を完全に固定化（決定論的出力）しつつ、純粋なJSONデータのみを抽出する実践的な手法とその原理**を解説します。

---

## 0. 前提：APIキーの安全な設定 (export)

本記事のコードを実行する前に、APIキーを環境変数 `GEMINI_API_KEY` として設定します。これにより、コマンド内に直接キーを書き込む必要がなくなり、安全かつ手軽に実行できるようになります。

### 一時的に設定する場合（現在のターミナルのみ有効）
ターミナルを開き、以下のコマンドを実行してください。`AIza` から始まるご自身のAPIキーを代入します。

```bash:terminal
# 注意: "=" の前後にスペースを入れないでください
export GEMINI_API_KEY="AIzaSy_あなたの実際のAPIキー"
```

### 永続的に設定する場合（Mac / Linux）
毎回設定するのが面倒な場合、シェルの設定ファイル（`.zshrc` や `.bashrc`）に書き込んでおくと便利です。Mac（zsh）の場合は以下のように設定します。

```bash:terminal
# 設定ファイルに追記
echo 'export GEMINI_API_KEY="AIzaSy_あなたの実際のAPIキー"' >> ~/.zshrc

# 設定を反映
source ~/.zshrc
```

:::message alert
**よくあるミス：スペースの混入**
`export GEMINI_API_KEY = "..."` のように、`=` の前後にスペースを入れるとエラーになります。必ず詰めて記述してください。
:::

### 設定の確認
正しく設定されたか、以下のコマンドで確認できます。キーが表示されれば準備完了です。

```bash:terminal
echo $GEMINI_API_KEY
# 出力例: AIzaSy_...
```

---

## 1. 結論：出力を固定化する完全なリクエスト

まずは実際のコードを見てみましょう。「1から50までの数字の中から、ランダムに5つ選ぶ」というプロンプトに対して、**何度実行しても全く同じJSON配列を返す** `curl` コマンドです。

```bash:request.sh
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}" \
    -H 'Content-Type: application/json' \
    -X POST \
    -d '{
      "contents": [{
        "parts":[{
          "text": "1から50までの数字の中から、ランダムに5つ選んでください。"
        }]
      }],
      "generationConfig": {
        "temperature": 0.0,
        "seed": 2026,
        "thinkingConfig": {
          "thinkingLevel": "minimal"
        },
        "responseMimeType": "application/json",
        "responseSchema": {
          "type": "ARRAY",
          "items": {
            "type": "INTEGER"
          },
          "description": "1から50までのランダムな5つの数字のリスト"
        }
      }
    }'
```

:::details Click to expand: 実際のレスポンス（何度実行しても同じ結果になります）
```json:response.json
{
  "candidates":[
    {
      "content": {
        "parts": [
          {
            "text": "[12,27,5,41,33]",
            "thoughtSignature": "EjQKMgG+Pvb7KgLOutcf5JlNlbZGqOeo3zJAs0a132BUih5xoIdTMBzXCj7zXCroM4hl6z/H"
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP",
      "index": 0
    }
  ],
  // ...省略
}
```
※ `thoughtSignature`（内部の推論プロセスの署名）は実行ごとに変化することがありますが、最終的な出力である `text` フィールドは `[12,27,5,41,33]` に完全に固定されます。
:::

---

## 2. なぜ結果が固定されるのか？（決定論的出力の原理）

LLMは本質的に「次にくる確率が高い単語（トークン）」を確率分布の中からサイコロを振って選ぶシステムです。この「サイコロのブレ」を完全に排除し、決定論的（Deterministic）な挙動をさせるために、以下の2つのパラメータを組み合わせています。

### ① `temperature: 0.0`（貪欲法の強制）
Temperature（温度）は、生成のランダム性を制御するパラメータです。これを `0.0` に設定すると、モデルは常に「最も確率が高いトークン」を100%の確率で選ぶようになります（Greedy Decoding / 貪欲法）。

:::message
**【数式で見るTemperatureの原理】**
LLMの最終層では、各トークンのスコア（ロジット $z_i$）を確率 $P(x_i)$ に変換するためにSoftmax関数が使われます。Temperature $T$ はこの分母に組み込まれています。

$$
P(x_i) = \frac{\exp(z_i / T)}{\sum_j \exp(z_j / T)}
$$

$T \to 0$ に近づくと、最大のロジットを持つトークンの確率がほぼ $1.0$ に収束し、他のトークンが選ばれる確率が $0$ になります。これがランダム性が消える数学的な理由です。
:::

### ② `seed: 2026`（乱数シードの固定）
`temperature: 0.0` だけでもほぼ結果は固定されますが、GPUの浮動小数点演算の丸め誤差や内部の並列処理のタイミングによって、極稀に微小な確率の揺らぎが生じることがあります。
乱数生成の初期値（シード）を固定値（例：`2026`）に設定することで、GoogleのAPIサーバー側に対して「ベストエフォートで全く同じ計算過程を再現する」ように強制できます。

---

## 3. JSONのみを強制する Structured Outputs

さらに上記のペイロードでは、モデルに「余計な言葉を喋らせず、プログラムで処理できるJSON配列だけを返す」ことを強制しています。

```json:schema.json
"responseMimeType": "application/json",
"responseSchema": {
  "type": "ARRAY",
  "items": { "type": "INTEGER" }
}
```

*   **`responseMimeType`**: これを `application/json` に設定すると、Markdownのバッククォート（````json ````）などが一切つかない、純粋なJSON文字列が返却されます。
*   **`responseSchema`**: 出力すべきデータ構造をOpenAPIスキーマ形式で定義します。今回は「整数の配列」を定義したため、挨拶文が排除され `[12,27,5,41,33]` という完璧なリスト形式が担保されました。

---

## 4. ⚠️ Gemini API利用時のよくある落とし穴

特にGemini 3系のモデルで推論能力を制御するパラメータを使用する場合、**JSONの階層と命名規則（キャメルケース）** に注意が必要です。

:::message alert
**エラーになる書き方（スネークケースや階層間違い）**
Python等のSDKの癖で、`generationConfig` の直下に `"thinking_level": "minimal"` とスネークケースで書いてしまうと、`400 Invalid JSON payload` エラーで弾かれます。
:::

**正しい書き方：**
`thinkingConfig` というオブジェクトの中にネストし、キャメルケースで記述します。
```json:correct_config.json
"generationConfig": {
  "thinkingConfig": {
    "thinkingLevel": "minimal"
  }
}
```
※ `thinkingLevel: "minimal"` は、Gemini 3 Flashなどで推論コストとレイテンシを最小化したい場合に非常に有効な設定です。

---

## 5. 決定論的出力の主な用途（ユースケース）

この「出力を固定化し、JSONで取得する」テクニックは、本番環境のアプリケーション開発において極めて強力です。

1.  **自動テスト（CI/CD）の安定化**
    LLMを組み込んだ機能のユニットテストを行う際、出力が毎回変わるとアサーション（テストの成否判定）が書けません。シードと温度を固定することで、冪等性（何度実行しても同じ結果になる性質）を担保したテストが可能になります。
2.  **データ抽出・スクレイピングパイプライン**
    非構造化テキスト（請求書やウェブサイトのテキスト）から、特定フォーマットのJSONを抽出するバッチ処理に最適です。パースエラーによるシステムクラッシュを未然に防ぎます。
3.  **プロンプトのデバッグとA/Bテスト**
    「プロンプトの文言を少し変えた時に、出力がどう変化するか」を純粋に比較したい場合、ランダム性がノイズになります。出力を決定論的にしておくことで、プロンプトの改善効果を正確に測定できます。

---

## まとめ

LLMは「創造的で自由なテキスト生成」が得意な一方で、システム連携においては「厳格で予測可能な動作」が求められます。

*   `temperature: 0.0` と `seed` で**ランダム性を殺す**
*   `responseSchema` で**出力型を強制する**

この2つを組み合わせることで、Gemini APIを「頼りになる確実なデータ変換モジュール」としてアプリケーションに組み込むことができます。ぜひご自身のプロジェクトでも試してみてください！