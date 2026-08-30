# 香港・マカオ トリップしおり（2026/10/9〜10/12・5名）

合い言葉で保護した静的サイトです。GitHub Pages（無料）で配信し、URLと合い言葉を知っている5人だけが中身を見られます。

- **持ち物チェックリスト** … 各自の端末の `localStorage` にのみ保存（共有なし・変更なし）
- **みんなのおすすめ追加** … Firebase Realtime Database に保存し、URLを開いた全員に反映。未設定・接続失敗時は自動で「この端末内のみ」にフォールバック

---

## この構成でどこまで守られるか

| | 内容 |
|---|---|
| GitHub Pages の公開範囲 | 仕様上、サイト本体は「URLを知っていれば誰でも」アクセス可能。無料プランにパスワード制限機能はない |
| だからこうしている | **ページ全体を AES-256 で暗号化**（[StatiCrypt](https://github.com/robinmoisson/staticrypt)）。合い言葉を入れないと復号されず、ソースを見ても暗号文だけ。Firebase の URL も暗号文の中 |
| さらに | `noindex` + `robots.txt` で検索エンジンに載らないようにしている |
| GitHub 上のソース | 平文の `src/` と復号情報 `.staticrypt.json` は **push しない**（`.gitignore` 済み）。GitHub に上がるのは暗号化済みの `docs/` とビルド道具だけ |

> 合い言葉の初期値： **`honkon-macau-2026`** （変更方法は下記「合い言葉を変える」）

---

## フォルダ構成

```
hk-trip-plan/
├─ src/index.html        … 平文ソース（編集はここ。ローカルのみ・GitHubには上げない）
├─ scripts/postbuild.mjs … ビルド後処理（noindex 注入・robots.txt 生成）
├─ docs/                 … ビルド成果物。GitHub Pages が配信するのはここだけ
│   ├─ index.html        …   ↳ 暗号化済み（合い言葉ゲート付き）
│   ├─ robots.txt / .nojekyll
├─ package.json          … `npm run build` でビルド
├─ .staticrypt.json      … salt（ローカルのみ・gitignore）
└─ README.md
```

---

## セットアップ手順

### 0. 前提

- Node.js（v18+）が入っていること
- このフォルダで一度だけ： `npm install`

### 1. ビルドしてローカル確認

```bash
# Windows PowerShell
$env:STATICRYPT_PASSWORD="honkon-macau-2026"; npm run build

# macOS / Linux / Git Bash
STATICRYPT_PASSWORD="honkon-macau-2026" npm run build
```

```bash
npm run preview        # http://localhost:8080/ で docs/ を確認（合い言葉ゲートが出る）
```

`src/` を直接見たいとき（ゲートなしの素の状態）は `npm run preview:src` → http://localhost:8081/ 。
`file://` で直接開くと EventSource やフォントで一部制限が出るので、必ずローカルサーバー経由で。

### 2. 「みんなのおすすめ追加」の共有DB（Firebase Realtime Database）

身内5人だけで使う前提の **認証なし・最小構成**。所要5〜10分、**クレジットカード不要**（無料 Spark プラン）。

#### 2-1. プロジェクトを作る

1. <https://console.firebase.google.com/> に Google アカウントでログイン
2. **「プロジェクトを追加」** → 名前 `hk-trip` など → 続行
3. Google アナリティクスは **オフ** でよい → 「プロジェクトを作成」

#### 2-2. Realtime Database を作る

1. 左メニュー **「構築 > Realtime Database」** → **「データベースを作成」**
2. ロケーション … **シンガポール（asia-southeast1）** 推奨
3. セキュリティ ルール … いったん **「ロックモードで開始」**（次で上書き）
4. 作成後に表示される URL を控える。例：
   `https://hk-trip-xxxxx-default-rtdb.asia-southeast1.firebasedatabase.app`

#### 2-3. セキュリティ ルールを貼り替える

「ルール」タブを開き、全部消して下記を貼り付け → **「公開」**。

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

意味：`suggestions` の中だけ **誰でも読める / 新規追加だけできる**（既存項目の書換え・削除は不可＝誤操作でリストが消えない）。名前1〜80字必須、メモ200字・追加者40字まで。`suggestions` 以外は読み書き禁止。

> もっと簡単でよければ `{ "rules": { "suggestions": { ".read": true, ".write": true } } }` の2行でも動きます（バリデーションなし）。Firebase から「ルールが公開状態です」という警告メールが来ますが、5人利用なら実害はほぼありません。

#### 2-4. サイトに URL を教える

`src/index.html` の先頭近く、`window.HK_TRIP_CONFIG` の行を編集：

```js
window.HK_TRIP_CONFIG = {
  databaseURL: "https://hk-trip-xxxxx-default-rtdb.asia-southeast1.firebasedatabase.app",
  path: "suggestions"
};
```

**API キーや秘密鍵は書きません。** RTDB の URL はクライアント公開前提の値で、上のルールで「suggestions への追記」しかできません。しかも暗号化されるので URL 自体も表には出ません。

編集したら **必ず再ビルド**： `STATICRYPT_PASSWORD="honkon-macau-2026" npm run build` → `docs/` を commit & push。

### 3. GitHub Pages へデプロイ

> このリポジトリは `git init` 済み。`src/` と `.staticrypt.json` は `.gitignore` 済みなので、push されるのは暗号化済みの `docs/` とビルド道具だけ。**リポジトリは Private 推奨**（Public でも暗号文しか出ませんが、Private が無難）。

```bash
gh auth login          # GitHub.com / HTTPS / ブラウザ認証

cd /c/dev/hk-trip-plan
git add -A
git commit -m "encrypted build"

# private リポジトリを作成して push（名前は任意）
gh repo create hk-trip --private --source=. --remote=origin --push

# GitHub Pages を有効化（main ブランチの /docs を公開）
gh api -X POST repos/{owner}/hk-trip/pages -f "source[branch]=main" -f "source[path]=/docs"
#   すでに有効なら 409。無視してOK

# 公開URLを確認
gh api repos/{owner}/hk-trip/pages --jq .html_url
```

公開URLは通常 `https://<ユーザー名>.github.io/hk-trip/`（初回反映1〜3分）。
このURLと合い言葉 `honkon-macau-2026` を5人に共有すれば全員同じしおりを見られます。

### 更新のしかた

```bash
# src/index.html を編集したら
STATICRYPT_PASSWORD="honkon-macau-2026" npm run build
git add -A && git commit -m "update" && git push
```

push のたびに GitHub Pages が自動で再ビルドします。

### 合い言葉を変える

`STATICRYPT_PASSWORD` を変えて再ビルド → push するだけ。

```bash
STATICRYPT_PASSWORD="新しい合い言葉" npm run build
git add -A && git commit -m "rotate passphrase" && git push
```

`.staticrypt.json`（salt）はそのままでOK。変更後は「この端末で記憶する」がリセットされるので、5人に新しい合い言葉を再共有してください。

---

## 4. 動作確認

1. 公開URL（またはローカル `http://localhost:8080/`）を **2つのタブ**、できれば **2台の端末** で開き、合い言葉を入れて開く
2. 片方の「みんなのおすすめ追加」で店名を入れて「リストに追加」
3. もう片方の画面に数秒以内に同じ項目が増えれば成功
   - セクション上部のインジケータが **緑（共有中 — リアルタイム更新オン）** なら Firebase 接続OK
   - **黄色（この端末内のみ）** なら `databaseURL` 未設定か、ネットワーク／ルールの問題

### うまくいかないとき

| 症状 | 対処 |
|---|---|
| ずっと黄色「この端末内のみ」 | `src/index.html` の `databaseURL` を確認 → 再ビルド。`https://` で始まっているか |
| 追加時「共有サーバーに送れませんでした」 | ルールの `.write` を確認（2-3 を貼り直す）。項目名が80字以内か |
| 反映が数秒かかる | 一部環境で `EventSource` が張れず7秒ごとのポーリングに落ちています。正常です |
| 項目を消したい | 詳しいルールでは削除不可。Firebase コンソールの Realtime Database 画面で該当ノードを手動削除 |
| 合い言葉ゲートで先に進めない | 大文字小文字・ハイフンを確認。キャッシュが古い場合はスーパーリロード（Ctrl+Shift+R） |

---

## 5. 無料枠について（5人利用の見積もり）

Firebase Spark（無料）プラン Realtime Database：

| 項目 | 無料枠 | この用途の想定 |
|---|---|---|
| 保存容量 | 1 GB | おすすめ1件 ≒ 150バイト。500件でも約75 KB |
| ダウンロード量 | 10 GB / 月 | 1表示で全件（〜100 KB）＋更新ストリーム（数バイト）。5人 × 数十回/月でも数十 MB |
| 同時接続数 | 100 | 最大5 |

→ **5人利用では無料枠を使い切る余地がありません。** カード登録も不要。GitHub Pages も Private リポジトリで無料。

---

## 6. 別案：Google スプレッドシート + Apps Script（Firebase を使いたくない場合）

スプレッドシートを簡易DBにする構成も可能（本サイトは未対応。切り替えるなら実装が必要）。

1. スプレッドシートの1行目に `name / note / by / at`
2. 拡張機能 > Apps Script で `doGet`（全行をJSONで返す）/ `doPost`（`appendRow`）を実装
3. デプロイ > ウェブアプリ、アクセス「全員」
4. 発行URL `https://script.google.com/macros/s/XXXX/exec` を設定に入れる

**難点：** Apps Script Web アプリは CORS プリフライトに応答しないため `Content-Type: text/plain` での POST 等の回避が必要。リアルタイム更新は不可でポーリングのみ。今回は身内5人・無料・自己完結の条件から **Firebase Realtime Database を第一候補**にしています。
