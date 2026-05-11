# YukkuriCast Next

LLM が生成した JSON 台本を読み込み、オリジナルゆっくり風キャラクター、字幕、Windows 標準音声合成 / AquesTalkPlayer、FFmpeg を使って解説動画 MP4 を生成する Windows デスクトップアプリです。

## 実装済み

- Electron + React + TypeScript の Windows アプリ
- `yukkuricast-script` JSON 1.0 のスキーマ、サンプル、ランタイム検証
- JSON 読み込み、編集、保存、シーン/ショット選択
- 再生/停止/シーク可能な 16:9 プレビュー、字幕強調、補助ビジュアル、追従タイムライン、インスペクター
- オリジナルゆっくり風 SVG アセット 3 体 x 5 表情
- ユーザー持ち込みキャラクター素材の安全な取り込み、PNG 再エンコード、プレビュー/書き出し反映
- Windows SAPI またはユーザー指定 AquesTalkPlayer.exe による WAV 生成
- アプリ内プレビュー音声生成と、再生中ショットに合わせたキャラクター簡易リップモーション
- AI に JSON 台本を作らせるための仕様付きテンプレートプロンプト表示/コピー
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

## AquesTalkPlayer

アプリ本体には AquesTalkPlayer を同梱しません。AquesTalkPlayer はライセンス上、無断再配布できないため、ユーザーが公式配布物を展開し、Inspector の `Voice Studio` から `AquesTalkPlayer.exe` を選択します。

JSON では話者ごとに次のように指定できます。

```json
"voice": {
  "engine": "aquestalk-player",
  "aquestalkPreset": "まりさ"
}
```

`aquestalkPreset` は AquesTalkPlayer 側に登録済みのプリセット名です。未指定時は AquesTalkPlayer の最後の設定が使われます。

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
- クリップボード操作は AI テンプレートコピー用の文字列書き込み API だけに限定しています。
- ユーザー素材は任意 SVG/画像を直接表示せず、20MB 以下の許可拡張子だけを PNG に再エンコードします。
- AquesTalkPlayer はユーザーが選択した `AquesTalkPlayer.exe` のみを保存し、shell を使わず引数配列で実行します。
- packaged app は `file://` の相対 asset 参照で起動し、`yukkuri-asset://custom/<id>.png` の限定プロトコルだけで管理済み素材を表示します。
- `release`, `qa`, `dist`, `dist-electron`, `node_modules` は GitHub に公開しません。
