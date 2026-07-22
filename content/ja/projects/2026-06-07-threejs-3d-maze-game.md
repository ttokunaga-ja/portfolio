---
title: "3D Maze Game"
subtitle: "Three.js を使った授業成果物の3D迷路ゲーム"
abstract: "Three.js、TypeScript、Viteで実装した、ブラウザで遊べる3D迷路探索ゲームです。授業で扱った3D表現を、敵AI、アイテム、ミニマップ、HUDを備えた小さなゲームとしてまとめ、Cloudflare Pagesで公開しています。"
role: "3D実装・ゲームロジック・UI実装・デプロイ"
period: "2026"
startDate: "2026-06-07"
endDate: "2026-06-07"
updatedAt: "2026-06-07"
sortOrder: 15
featured: true
tags:
  - Three.js
  - TypeScript
  - Vite
  - Game
  - Cloudflare Pages
demoUrl: "https://3dmazegame.takumi-tokunaga.com/"
links:
  demo:
    label: "体験する"
    url: "https://3dmazegame.takumi-tokunaga.com/"
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/3D_Maze_Game"
  article:
    label: "Zenn記事"
    url: "https://zenn.dev/t_tokunaga/articles/2026-06-07-threejs-3d-maze-game-class-output"
---

## 概要

3D Maze Gameは、Three.jsを使った授業成果物として制作した3D迷路探索ゲームです。プレイヤーは迷路内を移動し、敵を避けたり攻撃したりしながら、制限時間内にゴールを目指します。

公開ページは [https://3dmazegame.takumi-tokunaga.com/](https://3dmazegame.takumi-tokunaga.com/) で、ブラウザからそのまま体験できます。

## 主な機能

- `W/S` による前進・後退、`A/D` による左右旋回
- Space、左クリック、モバイル用ボタンによる攻撃・壁破壊
- HP、残り時間、アイテム数を表示するHUD
- 探索済み範囲、敵、アイテムを表示するミニマップ
- 視線が通ったときに追跡する簡単な敵AI
- 壁破壊、HP回復、時間延長のアイテム

## 技術構成

フロントエンドはThree.js、TypeScript、Viteで構成しています。迷路の壁や床は3Dメッシュとして描画し、同じ形状の壁は `InstancedMesh` を使って描画負荷を抑えています。

ゲーム本体はブラウザだけで完結し、サーバー側APIは使っていません。Cloudflare Pagesで静的ファイルとして配信し、GitHub Actionsから `dist/` をdirect uploadする構成にしています。

## 設計で重視したこと

授業で学んだ3D表現を、単なる表示サンプルではなく、実際に操作できる成果物としてまとめることを重視しました。

3D画面だけでは現在位置や状態が分かりにくいため、ミニマップとHUDを用意しています。敵AI、アイテム、制限時間を入れることで、短時間でもゲームとして成立する体験を目指しました。

## 公開・運用

公開ページはCloudflare Pagesで配信しています。`main` ブランチへのpushを起点に、GitHub Actionsで型チェック、ビルド、Pagesへのデプロイを実行します。

関連する制作メモはZennにもまとめています。
