---
title: "A Seated Hand-Tapping Locomotion Technique for Running Horse Avatar Embodiment"
subtitle: "ACM VRST 2026"
abstract: "座った姿勢で手を交互にたたき、VR空間で馬アバタとして走るロコモーション手法を提案した共同研究です。ACM VRST 2026のデモセッションで発表され、論文集に掲載されました。"
role: "サーバー実装 / Unity開発PM・実装 / 進捗確認 / 品質保証 / 通信品質改善"
period: "ACM VRST 2026"
publishedAt: "2026-11-16"
featured: true
tags:
  - VR
  - Locomotion
  - Unity
  - WebSocket
  - UDP
links:
  paper:
    label: "ACM Digital Libraryで論文を見る"
    url: "https://dl.acm.org/doi/10.1145/3822517.3849971"
---

## 研究概要

座ったまま左右の手を交互にたたく動作を馬アバタの走行に結びつける、VR向けの移動手法です。馬アバタになって走る体験を、着座した状態で操作できるようにすることを目指しています。

共同研究では、この手法を多人数VR競馬システム「HandSlapRace」に組み込みました。人工芝付きの入力デバイスに触れる感覚と、走行速度に応じた風の提示を組み合わせ、複数の体験者とNPCが同じレースで競走できるようにしました。

## 私の担当

サーバー実装を担当するとともに、Unity開発ではPMとして実装、進捗確認、品質保証を担当しました。多人数で進行するリアルタイムゲームの通信品質改善にも取り組みました。

## システム全体の構成

レース開始やゴールなどのイベント共有にはWebSocket、位置・速度などの高頻度な状態共有にはUDPを使用しています。先行展示では5台のHMDを同一のレース管理サーバーへ接続しました。

## 先行展示での予備評価

2026年5月17日の先行展示で、研究システム全体について体験後アンケート39件を得ました。展示時の予備的な評価であり、一般的なコントローラ入力との比較評価は今後の課題です。通信改善の定量効果を示す評価ではありません。

## 発表・掲載

2026年11月18日に仙台で開催された ACM VRST 2026 のデモセッションで発表されました。私は論文の共著者です。

Tomoki Saito, Shoyo Kishino, Takumi Tokunaga, Ryota Isoe, Yoshito Maeda, Fumihiko Nakamura, Fumihisa Shibata, and Asako Kimura. 2026. A Seated Hand-Tapping Locomotion Technique for Running Horse Avatar Embodiment. In _Proceedings of the 32nd ACM Symposium on Virtual Reality Software and Technology_, pp. 1–3. DOI: 10.1145/3822517.3849971.
