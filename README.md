# YukkuriCast Next

LLM が生成した JSON 台本を読み込み、オリジナルゆっくり風キャラクター、字幕、Windows 標準音声合成、FFmpeg を使って解説動画 MP4 を生成する Windows デスクトップアプリです。

## 実装済み

- Electron + React + TypeScript の Windows アプリ
- `yukkuricast-script` JSON 1.0 のスキーマ、サンプル、ランタイム検証
- JSON 読み込み、編集、保存、シーン/ショット選択
- 16:9 プレビュー、字幕強調、補助ビジュアル、タイムライン、インスペクター
- オリジナルゆっくり風 SVG アセット 3 体 x 5 表情
- ユーザー持ち込みキャラクター素材の安全な取り込み、PNG 再エンコード、プレビュー/書き出し反映
- Windows SAPI による WAV 生成
- sharp によるフレーム生成と FFmpeg による MP4 書き出し
- Electron packaged 黒画面対策として Vite asset を relative base で生成
- CSP、sandbox、contextIsolation、nodeIntegration 無効、permission 全拒否、外部遷移拒否
- NSIS Windows インストーラー生成

## コマンド

```bash
npm install
npm run dev
npm run lint
npm run build
npm run dist
```

`npm run dist` の成果物は `release/YukkuriCast Next-0.1.0-Setup.exe` です。

## JSON 仕様

- 仕様: `docs/json-format.md`
- JSON Schema: `schema/yukkuricast-script.schema.json`
- サンプル: `examples/explainer.sample.json`

## 書き出し検証

開発用 CLI として packaged 前後のレンダーエンジンを直接叩けます。

```bash
npx electron . --render-sample qa/sample-output.mp4
npx electron . --render-json examples/explainer.sample.json qa/from-json-output.mp4
"release/win-unpacked/YukkuriCast Next.exe" --render-sample qa/packaged-output.mp4
```

通常利用ではアプリ内の `MP4 書出` ボタンから保存先を選択します。

## セキュリティ

- Renderer に Node.js API を直接公開しません。
- IPC は `preload` の `contextBridge` 経由の限定 API だけです。
- ユーザー素材は任意 SVG/画像を直接表示せず、20MB 以下の許可拡張子だけを PNG に再エンコードします。
- packaged app は `file://` の相対 asset 参照で起動し、`yukkuri-asset://custom/<id>.png` の限定プロトコルだけで管理済み素材を表示します。
- `release`, `qa`, `dist`, `dist-electron`, `node_modules` は GitHub に公開しません。
