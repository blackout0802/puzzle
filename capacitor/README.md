# Capacitor でアプリ化する手順（Android / iOS）

`dist/jigsaw-sticker-book.html`（1 ファイル版）をそのまま包んでアプリにします。通信は使わないので、ネットワーク権限も不要です。

## 準備（1 回だけ）
1. Node.js 20 以上を入れる。
2. `cd capacitor && npm install`
3. `capacitor.config.json` の **appId** を自分のものに変える（例: `jp.example.yourname.jigsaw`）。一度ストアに出すと変更できません。
4. `npm run sync:web`（`www/index.html` が作られる）
5. `npx cap add android`（Android Studio が必要）／`npx cap add ios`（Mac と Xcode が必要）

## アイコン
`../store/icon-1024.png` を使います。`@capacitor/assets` を使うと各サイズを自動生成できます:
```
npm i -D @capacitor/assets
mkdir -p assets && cp ../store/icon-1024.png assets/icon-only.png
npx capacitor-assets generate
```

## ビルドして提出
- Android: `npm run sync && npm run open:android` → Android Studio で **Build > Generate Signed App Bundle (AAB)**。署名キーは必ずバックアップ。
- iOS: `npm run sync && npm run open:ios` → Xcode で Archive → App Store Connect へアップロード。

## 変更したあとの更新
アプリ本体（`app/`）を直したら、`npm run sync` を実行すれば最新の 1 ファイル版が反映されます。

## 注意（申請に関わる点）
- **写真の選択**は、HTML の `<input type="file">` で動きます。iOS では、写真への権限の説明文（`NSPhotoLibraryUsageDescription`）が Info.plist に必要になる場合があります。文面例:「パズルにする写真を選ぶために使います。写真は端末の外へは送られません。」
- Android の Target API レベルは `android/variables.gradle` の `targetSdkVersion`。最新の要件は Play Console で確認してください（`../docs/research.md` 3-1 参照）。
- 実機で、**音・声（読み上げ）・写真取り込み・保存の保持**を必ず確認してください（デスクトップのブラウザでは再現できない挙動があります）。
