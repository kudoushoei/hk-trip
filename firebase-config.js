/* ============================================================
   香港・マカオ トリップしおり — 共有バックエンド設定
   「みんなのおすすめ追加」を5人で共有するための設定です。
   ここに Firebase Realtime Database の URL を1行入れるだけ。
   （APIキーやパスワードは不要です。手順は README.md を参照）

   例:
   window.HK_TRIP_CONFIG = {
     databaseURL: "https://hk-trip-xxxxx-default-rtdb.asia-southeast1.firebasedatabase.app",
     path: "suggestions"
   };

   databaseURL を空のままにすると「この端末内のみ保存」モードで動きます
   （サイトは問題なく開けます）。
   ============================================================ */
window.HK_TRIP_CONFIG = {
  databaseURL: "",
  path: "suggestions"
};
