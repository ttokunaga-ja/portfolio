---
title: "Three.js を使った授業成果物として 3D 迷路ゲームを公開した"
abstract: "Three.js を使った授業成果物として、ブラウザで遊べる 3D 迷路ゲームを公開しました。 公開 URL: GitHub リポジトリ: 何を作ったか 作ったのは、迷路内を探索してゴールを目指す 3D ゲームです。 プレイヤーは W/S で前進・後退、A/D で左右旋回します。敵に追跡されながら、アイテムを拾い、制限時間内にゴールへ到達することを目標にして"
publishedAt: "2026-06-07"
canonicalUrl: "https://zenn.dev/t_tokunaga/articles/2026-06-07-threejs-3d-maze-game-class-output"
tags:
  - "threejs"
  - "typescript"
  - "vite"
  - "cloudflare"
  - "game"
---

Three.js を使った授業成果物として、ブラウザで遊べる 3D 迷路ゲームを公開しました。

公開 URL: [https://3dmazegame.takumi-tokunaga.com/](https://3dmazegame.takumi-tokunaga.com/)

GitHub リポジトリ: [ttokunaga-ja/3D_Maze_Game](https://github.com/ttokunaga-ja/3D_Maze_Game)

## 何を作ったか

作ったのは、迷路内を探索してゴールを目指す 3D ゲームです。

プレイヤーは `W/S` で前進・後退、`A/D` で左右旋回します。敵に追跡されながら、アイテムを拾い、制限時間内にゴールへ到達することを目標にしています。

主な要素は以下です。

- Three.js による 3D 描画
- TypeScript + Vite による静的サイト構成
- 迷路生成と 3D メッシュ化
- ミニマップ、HP、残り時間、アイテム数の HUD
- 視線が通ったときに追跡する簡単な敵 AI
- 壁破壊、HP 回復、時間延長のアイテム

授業で扱った 3D 表現を、単なるサンプル表示ではなく「実際に操作できる小さなゲーム」としてまとめることを意識しました。

## 実装で意識したこと

### 静的サイトとして完結させる

ゲーム本体はブラウザだけで動作します。サーバー側 API は使わず、Vite で生成した `dist/` を Cloudflare Pages に配信する構成にしました。

これにより、成果物を URL として共有しやすくなります。授業の提出物やポートフォリオ用途では、「リポジトリを見てください」だけでなく、すぐ動かせる公開 URL があることが重要だと感じました。

### 描画負荷を抑える

迷路の壁や床は数が多くなりやすいため、描画回数が増えすぎないようにしました。特に壁の描画では `InstancedMesh` を使い、同じ形状のオブジェクトをまとめて扱うようにしています。

小規模なゲームでも、3D ではオブジェクト数が増えるとすぐに描画負荷が目立ちます。授業成果物としても、見た目だけでなく「ブラウザで安定して動かす」ことを意識しました。

### 操作と情報表示を分ける

3D 画面だけでは現在位置や残り時間が分かりにくいため、ミニマップと HUD を用意しました。

プレイヤーの状態、敵やアイテムの位置、探索済み範囲を画面上に出すことで、迷路探索として遊びやすくしています。

## 公開の流れ

公開は Cloudflare Pages を使いました。`main` ブランチに push すると GitHub Actions が次の処理を実行します。

```bash
npm ci
npm run typecheck
npm run build
npx wrangler@latest pages deploy dist --project-name 3d-maze-game
```

カスタムドメインとして `3dmazegame.takumi-tokunaga.com` を割り当て、Cloudflare DNS の CNAME から Pages プロジェクトへ向けています。

## まとめ

Three.js は、授業内で学んだ 3D 表現をブラウザ上の成果物として公開しやすい技術だと感じました。

今回は迷路探索ゲームという小さな題材ですが、3D 描画、入力処理、当たり判定、UI、デプロイまでを一通り扱えたため、授業成果物として公開するにはちょうどよい規模でした。
