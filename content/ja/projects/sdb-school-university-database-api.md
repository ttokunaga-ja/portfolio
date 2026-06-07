---
title: "sDB"
subtitle: "教育機関検索とSchool / University Database API"
abstract: "政府の公式公開情報をもとに、高校、大学、短大、高専、専門学校などの検索用データベースを再現できるようにした教育機関検索ページとAPIです。漢字、かな、カタカナ、ローマ字での検索とautocompleteに対応しています。"
role: "設計・データ加工スクリプト・API設計・フロントエンド実装・デプロイ"
period: "2026"
startDate: "2026-06-06"
endDate: "2026-06-07"
sortOrder: 10
featured: true
tags:
  - React
  - TypeScript
  - Go
  - PostgreSQL
  - Cloud Run
  - Cloudflare Pages
demoUrl: "https://sdb.takumi-tokunaga.com/"
links:
  demo:
    label: "公開ページ"
    url: "https://sdb.takumi-tokunaga.com/"
  api:
    label: "APIドキュメント"
    url: "https://sdb.takumi-tokunaga.com/api/"
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/sDB"
---

## 概要

sDBは、日本の教育機関を検索するためのWebページとAPIです。大学だけでなく、高校、大学院、大学、短大、高専、高専専攻科、専門学校など、複数の学校種別を対象にしています。

主眼は、政府が公開している公式情報をもとに、誰でも自社環境で同じ考え方の検索用DBを再現できるようにすることです。公開リポジトリには、データ取得・加工スクリプト、検索フロントエンド、APIドキュメントを置いています。

![sDBの検索フォーム](sdb-search-form.jpg)

## 主な機能

- 高校、大学、短大、高専、専門学校などの学校種別検索
- 都道府県、学校名、学部・研究科、学科の段階的な絞り込み
- 漢字、かな、カタカナ、ローマ字での候補検索
- autocompleteによる軽量な候補取得
- APIキーを使った公開APIアクセス
- Markdownで更新できる概要、APIドキュメント、注意事項ページ

![学部候補のautocomplete](sdb-autocomplete.png)

## 技術構成

フロントエンドはReact、TypeScript、Vite、MUIで構成し、Cloudflare Pagesで公開しています。APIはGoで実装し、Cloud Run上で動作します。データベースにはNeon PostgreSQLを利用しています。

検索候補には `/v1/suggest` を用意し、一覧検索用の `/v1/institutions` とは分けました。候補表示のたびに重い一覧処理を走らせず、入力途中でも扱いやすい検索体験になるようにしています。

## 設計で重視したこと

単に教育機関一覧を保持するのではなく、公式公開情報から同じ構造のDBを作り直せることを重視しました。データ取得、正規化、検索語生成、API仕様、検索UIを分けておくことで、公開情報の更新や自社環境での再構築に対応しやすくしています。

また、学校名は入力方法が人によって変わりやすいため、漢字表記だけでなく、かな、カタカナ、ローマ字の検索語も生成しています。利用者が覚えている表記で入力しても候補に到達しやすいようにしました。

![学校・学部・学科の選択結果](sdb-selection.png)

## 公開・運用

公開ページは [https://sdb.takumi-tokunaga.com/](https://sdb.takumi-tokunaga.com/) で提供しています。APIドキュメントは [https://sdb.takumi-tokunaga.com/api/](https://sdb.takumi-tokunaga.com/api/) に置いています。

公開リポジトリには、元データや生成済みCSV、DBダンプ、シークレットは含めていません。再現手順と公開ページを提供しつつ、出典、加工内容、免責は注意事項ページで明示しています。
