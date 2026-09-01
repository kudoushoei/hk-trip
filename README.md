# 香港・マカオ トリップしおり（2026/10/9〜10/12・5名）

**公開URL** … https://kudoushoei.github.io/hk-trip/

`index.html` 1ファイルで完結する静的サイト。5人にこのURLを送るだけ。

- 合い言葉なし・リンクを知っていれば開ける（検索エンジンには載せない設定 = `noindex` + `robots.txt`）
- 搭乗者はファーストネームのみ記載。玄関の解錠番号などは載せていない
- **持ち物チェック**は各自の端末に保存（共有なし）
- **みんなのおすすめ追加**は各自の端末内のみ保存（共有バックエンド未設定）

## 直したいとき

`index.html` を編集して push するだけ。ビルド不要。

```bash
cd /c/dev/hk-trip-plan
# index.html を編集
git add -A && git commit -m "update" && git push
```

GitHub Pages（`main` ブランチのルート）が1〜3分で反映します。

## みんなのおすすめ追加を5人で共有したいとき（任意・未設定）

`index.html` 内の `window.HK_TRIP_CONFIG` に Firebase Realtime Database の URL を1行入れると、
URLを開いた全員に反映されるようになります（無料・カード不要）。未設定でもサイトは普通に開けます。
