---
title: "VS Code で main からブランチを安全に切る最小手順"
abstract: "VS Code で main を元にブランチを作るときの最短ルートと、事故を防ぐための注意点をまとめました。画像はすべて VS Code のステータスバーを使った操作です。 手順（6 ステップ） 必ず先に Pull して最新化 ソース管理ビューやコマンドパレットから Git: Pull を実行し、手元の main をリモートと揃えます。 左下が main に"
publishedAt: "2025-12-25"
canonicalUrl: "https://zenn.dev/t_tokunaga/articles/2025-12-25-git-branch-splitting"
tags:
  - "Git"
  - "VSCode"
---

VS Code で main を元にブランチを作るときの最短ルートと、事故を防ぐための注意点をまとめました。画像はすべて VS Code のステータスバーを使った操作です。

---

## 手順（6 ステップ）

1. **必ず先に Pull して最新化**  
   ソース管理ビューやコマンドパレットから `Git: Pull` を実行し、手元の main をリモートと揃えます。  
   ![Git Pull で最新化](/images/blog/2025-12-25-git-branch-splitting/2025-12-25-git-branch-splitting/1.png)

2. **左下が `main` になっていることを確認しクリック**  
   ここを押してブランチメニューを開きます。  
   ![現在のブランチが main か確認](/images/blog/2025-12-25-git-branch-splitting/2025-12-25-git-branch-splitting/2.png)

3. **メニューで「Create new branch...」を選ぶ**  
   ![Create new branch を選択](/images/blog/2025-12-25-git-branch-splitting/2025-12-25-git-branch-splitting/3.png)

4. **ブランチ名を入力する**（例: `feature/update-docs`）  
   ![ブランチ名を入力](/images/blog/2025-12-25-git-branch-splitting/2025-12-25-git-branch-splitting/4.png)

5. **Enter で確定する**  
   ![Enter で確定](/images/blog/2025-12-25-git-branch-splitting/2025-12-25-git-branch-splitting/5.png)

6. **左下の表示が新しいブランチ名に変わったら完了**  
   ![新しいブランチ名に変わったことを確認](/images/blog/2025-12-25-git-branch-splitting/2025-12-25-git-branch-splitting/6.png)

---

## 最低限の注意点

- ブランチを切る前に必ず `main` を最新にする（Pull を忘れない）。  
- 起点は常に `origin/main` に合わせる。ローカルの main が進んでいる場合はリモートを追従させてから分岐。  
- ブランチ名は `feature/`・`fix/` などチームの命名規則に合わせる。  
- 作成後すぐ `git push -u origin <branch>` でリモートにも作成し、誰の作業かを共有する。  
- PR 前に `main` を再度取り込む（`git pull --rebase origin main` など）と差分がきれいになる。
