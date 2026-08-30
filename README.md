# 香港・マカオ トリップしおり（2026/10/9〜10/12・5名）

`index.html` 1ファイルで完結する静的サイトです。GitHub Pages / Netlify / Cloudflare Pages など、
どの無料静的ホスティングにそのまま置いても動きます。

```
hk-trip-plan/
├─ index.html          … しおり本体（HTML/CSS/JS すべて内蔵）
├─ firebase-config.js  … 「みんなのおすすめ追加」の共有先URLを書く小さな設定ファイル
├─ .nojekyll           … GitHub Pages で _ 始まりを無視させない用の空ファイル
├─ .gitignore
└─ README.md           … このファイル
```

- **持ち物チェックリスト** … 各自の端末の `localStorage` にのみ保存。共有されません（変更不要のまま）。
- **みんなのおすすめ追加** … 下記の Firebase Realtime Database に保存し、URLを開いた全員に反映。
  未設定・接続失敗時は自動で「この端末内のみ」モードにフォールバックします。

---

## 1. まず動かす（バックエンドなしでも開ける）

`firebase-config.js` の `databaseURL` が空でも、サイトは普通に開けます。
その場合「みんなのおすすめ追加」は **その端末のブラウザ内だけ** に保存されます
（同じブラウザの別タブ同士は同期しますが、他の人・他の端末には反映されません）。

ローカルで確認するには、このフォルダで簡易サーバーを立てて `http://localhost:8080/` を開きます
（`file://` で直接開くと `EventSource` やフォントで一部制限が出ます）。

```bash
npx --yes serve -l 8080 .
# または: python -m http.server 8080
```

---

## 2. 共有バックエンド（Firebase Realtime Database）のセットアップ

身内5人だけで使う前提の、**認証なし・最小構成** です。所要 5〜10分。**クレジットカード不要**（無料の Spark プラン）。

### 2-1. プロジェクトを作る

1. <https://console.firebase.google.com/> に Google アカウントでログイン
2. **「プロジェクトを追加」** → 名前は `hk-trip` など任意 → 続行
3. 「Google アナリティクス」は **オフ** でよい → 「プロジェクトを作成」

### 2-2. Realtime Database を作る

1. 左メニュー **「構築 > Realtime Database」** → **「データベースを作成」**
2. ロケーション … **シンガポール（asia-southeast1）** を推奨（日本から近い）
3. セキュリティ ルール … 一旦 **「ロックモードで開始」** を選んで作成（次で上書きします）
4. 作成後、画面上部に出る URL を控える。次のどちらかの形です：
   - `https://hk-trip-xxxxx-default-rtdb.asia-southeast1.firebasedatabase.app`
   - `https://hk-trip-xxxxx-default-rtdb.firebaseio.com`（us-central1 の場合）

### 2-3. セキュリティ ルールを貼り替える

Realtime Database の **「ルール」** タブを開き、中身を全部消して下記を貼り付け → **「公開」**。

```json
{
  "rules": {
    "suggestions": {
      ".read": true,
      "$item": {
        ".write": "!data.exists() && newData.hasChildren(['name'])",
        ".validate": "newData.child('name').isString() && newData.child('name').val().length > 0 && newData.child('name').val().length <= 80 && newData.child('note').val().length <= 200 && newData.child('by').val().length <= 40 && newData.child('at').val().length <= 40",
        "name": { ".validate": true },
        "note": { ".validate": true },
        "by":   { ".validate": true },
        "at":   { ".validate": true },
        "$other": { ".validate": false }
      }
    },
    "$catchall": { ".read": false, ".write": false }
  }
}
```

このルールの意味：

- `suggestions` の中だけ **誰でも読める / 新規追加だけできる**（既存項目の書き換え・削除は不可＝誤操作でリストが消えない）
- 名前は1〜80字必須、メモ200字・追加者40字まで。想定外のフィールドは弾く
- `suggestions` 以外のパスは読み書き禁止

> **もっと簡単でよければ** 次の2行だけでも動きます（バリデーションなし・削除も可）。
> ```json
> { "rules": { "suggestions": { ".read": true, ".write": true } } }
> ```
> Firebase から「ルールが公開状態です」という警告メールが来ますが、5人利用なら実害はほぼありません。
> 気になる場合は上の詳しいルールを使ってください。

### 2-4. サイトに URL を教える

`firebase-config.js` を開き、`databaseURL` に 2-2 で控えた URL を貼ります（末尾スラッシュは付けても付けなくてもOK）。

```js
window.HK_TRIP_CONFIG = {
  databaseURL: "https://hk-trip-xxxxx-default-rtdb.asia-southeast1.firebasedatabase.app",
  path: "suggestions"
};
```

**API キーや秘密鍵は書きません。** Realtime Database の URL はクライアント公開前提の値で、
上のルールで「suggestions への追記」しかできないため、URL が見えても問題ありません。

コミットして push すれば、数十秒〜数分で公開サイトに反映されます。

---

## 3. GitHub Pages へデプロイ

> このリポジトリはすでに `git init` 済みです。GitHub 側は未接続。

```bash
# 1. GitHub CLI にログイン（ブラウザが開きます）
gh auth login          # GitHub.com / HTTPS / ブラウザ認証 を選ぶ

# 2. このフォルダで
cd /c/dev/hk-trip-plan
git add -A
git commit -m "香港・マカオ トリップしおり（静的サイト版）"

# 3. リポジトリ作成 & push（public。名前は好きに）
gh repo create hk-trip --public --source=. --remote=origin --push

# 4. GitHub Pages を有効化（main ブランチのルートを公開）
gh api -X POST repos/{owner}/hk-trip/pages -f "source[branch]=main" -f "source[path]=/" 
#   すでに有効なら 409 が返るだけなので無視してOK

# 5. 公開URLを確認
gh api repos/{owner}/hk-trip/pages --jq .html_url
```

公開URLは通常 `https://<ユーザー名>.github.io/hk-trip/` です（反映に初回1〜3分）。
このURLを5人に共有すれば全員同じしおりを見られます。

### 更新のしかた

`index.html` や `firebase-config.js` を編集したら：

```bash
git add -A && git commit -m "update" && git push
```

push するたびに GitHub Pages が自動で再ビルドします。

---

## 4. 動作確認（共有できているかのテスト）

1. 公開URL（またはローカルの `http://localhost:8080/`）を **2つのタブ**、できれば **2台の端末** で開く
2. 片方の「みんなのおすすめ追加」で店名を入れて「リストに追加」
3. もう片方の画面に、数秒以内に同じ項目が増えれば成功
   - セクション上部のインジケータが緑（「共有中 — リアルタイム更新オン」）なら Firebase 接続OK
   - 黄色（「この端末内のみ」）なら `databaseURL` 未設定か、ネットワーク／ルールの問題

### うまくいかないとき

| 症状 | 対処 |
|---|---|
| ずっと黄色「この端末内のみ」 | `firebase-config.js` の `databaseURL` を確認。`https://` で始まっているか、コピペミスがないか |
| 追加すると「共有サーバーに送れませんでした」 | ルールの `.write` を確認（2-3 を貼り直す）。項目名が80字以内か |
| 反映が遅い（数秒かかる） | 一部環境で `EventSource` が張れず7秒ごとのポーリングに落ちています。正常動作の範囲です |
| リストから項目を消したい | 詳しいルールでは削除不可。Firebase コンソールの Realtime Database 画面で該当ノードを手動削除 |

---

## 5. 無料枠について（5人利用の見積もり）

Firebase Spark（無料）プランの Realtime Database 上限と、この用途の実使用：

| 項目 | 無料枠 | この用途の想定 |
|---|---|---|
| 保存容量 | 1 GB | おすすめ1件 ≒ 150バイト。500件でも約75 KB |
| ダウンロード量 | 10 GB / 月 | 1回のページ表示で全件（〜100 KB）＋更新ストリーム（keep-alive 数バイト）。5人 × 数十回/月でも数十 MB |
| 同時接続数 | 100 | 最大5 |
| 書き込み | 実質制限なし（帯域内） | 旅行前に数十件 |

→ **5人程度の利用では無料枠を使い切る余地がまったくありません。** クレジットカード登録も不要です。

---

## 6. 別案：Google スプレッドシート + Apps Script（Firebase を使いたくない場合）

Firebase の代わりに、スプレッドシートを簡易DBにする構成も可能です（本サイトは未対応。切り替えるなら実装が必要）。

1. スプレッドシートを新規作成し、1行目に `name / note / by / at` の見出し
2. 拡張機能 > Apps Script で以下のような Web アプリを作成
   ```js
   function doGet(e){
     const sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
     const [head, ...rows] = sh.getDataRange().getValues();
     const data = rows.map(r => Object.fromEntries(head.map((h,i)=>[h, r[i]])));
     return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
   }
   function doPost(e){
     const sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
     const b = JSON.parse(e.postData.contents);
     sh.appendRow([b.name, b.note||"", b.by||"", new Date().toISOString()]);
     return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
   }
   ```
3. デプロイ > 新しいデプロイ > 種類「ウェブアプリ」、アクセスできるユーザー「全員」
4. 発行された `https://script.google.com/macros/s/XXXX/exec` を設定に入れる

**難点：** Apps Script の Web アプリは CORS プリフライトに応答しないため、`Content-Type: text/plain` での POST や
`no-cors` 回避などの工夫が必要。リアルタイム更新はできず数秒ごとのポーリングになります。
今回は身内5人・無料・自己完結という条件から **Firebase Realtime Database を第一候補** としています。
