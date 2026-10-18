---
title: "HandSlapRace"
subtitle: "手の動きで走る多人数VR競馬"
abstract: "人工芝付きの入力デバイスを左右交互に操作し、馬アバタとして競走するVRシステムの共同研究。サーバー実装と、Unity開発のPMとして実装・進捗確認・品質保証を担当し、リアルタイム通信の品質改善に取り組みました。"
role: "サーバー実装 / Unity開発PM・実装 / 進捗確認 / 品質保証 / 通信品質改善"
period: "HIS 2026 展示発表・共著"
publishedAt: "2026-09-16"
sortOrder: 5
featured: true
tags:
  - VR
  - Unity
  - WebSocket
  - UDP
  - Research
links:
  paper:
    label: "公開論文PDF"
    url: "https://www.rm2c.ise.ritsumei.ac.jp/papers/2026/HIS2026_HandSlapRace_final.pdf"
  publication:
    label: "研究室の展示発表一覧"
    url: "https://www.rm2c.ise.ritsumei.ac.jp/demonstrations.html"
---

## 概要

手の左右交互動作を馬アバタの走行に対応させ、人工芝への接触感覚と速度に応じた風提示を組み合わせたVRロコモーションシステムの共同研究です。複数の体験者とNPCが、同じレースで競走できるアプリケーションとして構築しました。

## 私の担当

サーバー実装を担当するとともに、Unity開発ではPMとして実装、進捗確認、品質保証を担当しました。多人数で進行するリアルタイムゲームの通信品質改善にも取り組みました。

## システム全体の構成

レース開始やゴールなどのイベント共有にはWebSocket、位置・速度などの高頻度な状態共有にはUDPを使用しています。先行展示では5台のHMDを同一のレース管理サーバーへ接続しました。

## 展示・発表

2026年5月17日の先行展示で、研究システム全体について体験後アンケート39件を得ました。展示時の予備的な評価であり、一般的なコントローラ入力との比較評価は今後の課題です。通信改善の定量効果を示す評価ではありません。

HIS 2026で展示発表され、共著者として論文集に掲載されています。

岸野聖耀、齋藤智輝、徳永拓未、磯江亮太、前田佳澄、中村文彦、柴田史久、木村朝子．馬アバタ走行体験のための手を用いたVRロコモーションシステム．ヒューマンインタフェースシンポジウム2026論文集，1T-D16W，2026年9月16日．

[公開論文PDF](https://www.rm2c.ise.ritsumei.ac.jp/papers/2026/HIS2026_HandSlapRace_final.pdf) / [研究室の展示発表一覧](https://www.rm2c.ise.ritsumei.ac.jp/demonstrations.html)
