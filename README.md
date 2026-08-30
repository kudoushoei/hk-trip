# 香港・マカオ トリップしおり（2026/10/9〜10/12・5名）

**公開URL** … https://kudoushoei.github.io/hk-trip/
**合い言葉** … `honkon-macau-2026` （URLと一緒に5人へ共有）

- ページ全体を合い言葉で暗号化（[StatiCrypt](https://github.com/robinmoisson/staticrypt)）。合い言葉を知らないと中身は読めない。検索避け（`noindex` + `robots.txt`）済み。
- このリポジトリに置いているのは **配信用の `docs/` だけ**（暗号文）。実名・ホテル情報は含まれない。
- **持ち物チェック**は各自の端末に保存（共有なし）。
- **みんなのおすすめ追加**は、いまは各自の端末内のみ保存（5人で共有したい場合は Firebase を設定。手順は下記）。

## 中身を直したいとき

平文ソースとビルド道具は作者PCの `C:\dev\hk-trip-plan\` にあります（このリポジトリには入れていない）。

```bash
cd /c/dev/hk-trip-plan
# src/index.html を編集
STATICRYPT_PASSWORD="honkon-macau-2026" npm run build   # docs/ を作り直す
git add -A && git commit -m "update" && git push          # 反映（1〜3分）
```

## みんなのおすすめ追加を5人で共有したいとき（任意）

1. <https://console.firebase.google.com/> で無料プロジェクト＋Realtime Database を作成（カード不要、5人利用は無料枠で余裕）
2. ルールを `{ "rules": { "suggestions": { ".read": true, ".write": true } } }` にする
3. 表示された `https://xxxx.firebasedatabase.app` を `src/index.html` の `window.HK_TRIP_CONFIG.databaseURL` に入れる
4. 上の「中身を直したいとき」の手順でビルド＆push

未設定でもサイトは普通に開けます（おすすめ追加が端末ごとになるだけ）。
