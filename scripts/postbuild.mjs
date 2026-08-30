// ビルド後処理:
//  1. 暗号ゲートページ（docs/index.html の外側シェル）に noindex を注入
//  2. docs/robots.txt / docs/.nojekyll を用意
// これで「検索エンジンに載らない」状態にする（＝リンクを知らないと辿り着けない）。
// 本当のアクセス制限は合い言葉による暗号化のほう。
import { readFileSync, writeFileSync } from "node:fs";

const p = "docs/index.html";
let html = readFileSync(p, "utf8");

const meta = '<meta name="robots" content="noindex, nofollow, noarchive" />';
if (!html.includes('name="robots"')) {
  html = html.replace(/<head>/i, `<head>\n        ${meta}`);
  writeFileSync(p, html);
  console.log("postbuild: injected noindex meta");
} else {
  console.log("postbuild: noindex meta already present");
}

writeFileSync("docs/robots.txt", "User-agent: *\nDisallow: /\n");
writeFileSync("docs/.nojekyll", "");
console.log("postbuild: wrote docs/robots.txt and docs/.nojekyll");
