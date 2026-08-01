---
title: "WindowsでQuest 3Sのログを取得する方法（adb + logcat）"
abstract: "Unity や VR アプリ開発で Quest 3S の動作ログを取りたいときは、adb logcat が手軽です。ここでは Windows 環境で Platform Tools をセットアップし、adb を使って Quest のログを取得する手順 をまとめます。 方法A：Platform Tools をインストールして PATH を通す 1. SDK Pl"
publishedAt: "2025-12-01"
canonicalUrl: "https://zenn.dev/t_tokunaga/articles/2025-12-01-quest3s-logcat-windows"
tags:
  - "Quest"
  - "VR"
  - "adb"
  - "logcat"
  - "Windows"
---

Unity や VR アプリ開発で Quest 3S の動作ログを取りたいときは、`adb logcat` が手軽です。ここでは **Windows 環境で Platform Tools をセットアップし、adb を使って Quest のログを取得する手順** をまとめます。

---

## 方法A：Platform Tools をインストールして PATH を通す

### 1. SDK Platform Tools をダウンロード

公式サイトから **「SDK Platform-Tools for Windows」** をダウンロードします。

- [Android SDK Platform-Tools ダウンロードページ](https://developer.android.com/studio/releases/platform-tools)

### 2. ZIP を展開

1. ダウンロードした ZIP ファイルを右クリック → **「すべて展開…」**  
2. 展開先フォルダを `C:\platform-tools` に変更  
3. 展開したフォルダの中に `adb.exe` があることを確認

![ZIP 展開後のフォルダ構成](/images/blog/2025-12-01-quest3s-logcat-windows/2025-12-01-quest3s-logcat-windows/1.jpg)
*ZIP 展開後のフォルダ構成*

### 3. 環境変数 PATH に追加

1. Windows キー → 「環境変数」と検索 → **「システム環境変数の編集」** を開く  
2. **環境変数(N)…** → ユーザーの `Path` → 編集  
3. **新規** → `C:\platform-tools` を追加  
4. OK を連打して閉じる

### 4. PowerShell で動作確認

```powershell
adb version
```

---

## 5. 接続されているデバイスを確認

```powershell
adb devices -l
```

- Quest 3S のシリアル番号を確認  
- 例：

```
340YC10G7P0CNR         device product:panther model:Quest_3S device:panther transport_id:1
```

---

## 6. ログ取得コマンド（PID 不要）

確認したシリアル番号を変数にセットし、ログを取得します。

```powershell
$device = "340YC10G7P0CNR"  # adb devices -l で確認したシリアル番号
adb -s $device logcat -v time Unity:D AdrenoVK-0:D OVRPlugin:D Ripc*:I ActivityManager:I WindowManager:I *:S > log.txt
```

- `$device` に人間が確認したシリアル番号を入力  
- `-s $device` で特定デバイスを指定  
- `logcat -v time` で時刻付きログを取得  
- タグフィルタで必要なログだけを抽出  
- PID 指定は不要なのでアプリが未起動でもログ取得可能

---

## まとめ

- Windows でも簡単に adb + logcat で Quest 3S のログを取得可能  
- PID 指定は必須ではなく、タグフィルタだけで十分な場合が多い  
- シリアル番号を明示的に指定することで、複数デバイス接続時も安定してログ取得可能
