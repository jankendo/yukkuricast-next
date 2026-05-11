# YukkuriCast Next

LLM が生成した JSON 台本を読み込み、オリジナルゆっくり風キャラクター、字幕、Windows 標準音声合成 / AquesTalkPlayer、FFmpeg を使って解説動画 MP4 を生成する Windows デスクトップアプリです。

## 実装済み

- Electron + React + TypeScript の Windows アプリ
- `yukkuricast-script` JSON 1.0 のスキーマ、サンプル、ランタイム検証
- JSON 読み込み、編集、保存、シーン/ショット選択
- 再生/停止/シーク可能な 16:9 プレビュー、字幕強調、補助ビジュアル、素材プレースホルダー、インスペクター
- 映像/画像、キャラクター、音声、テロップ、効果を左から右の時間軸に並べる多層編集タイムライン
- オリジナルゆっくり風 SVG アセット 5 体 x 5 表情。霊夢/魔理沙プリセットを標準搭載
- 黒板教室、ニュース机、畳部屋、夜景、紙ノート、分析グリッドの背景アセット
- ユーザー持ち込みキャラクター素材の安全な取り込み、PNG 再エンコード、プレビュー/書き出し反映
- AquesTalkPlayer.exe を標準音声エンジンとして同期実行し、Windows SAPI も任意で利用可能
- AquesTalk の WAV 実尺を解析し、JSON の `duration` が短すぎてもプレビュー/MP4 書き出しを自動延長
- AquesTalk 音声を 48kHz/stereo WAV に正規化し、AAC 結合時に音声を再生成して短いカットの途切れを抑制
- NVIDIA NVENC / Intel Quick Sync / AMD AMF の H.264 GPU エンコーダーを自動検証し、利用可能なら書き出しに使用
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

`project.export.gpuAcceleration` は `auto` が標準です。GPU エンコーダーが使えない環境では CPU `libx264` にフォールバックします。画像や図解をあとで差し替える場合は `shots[].assets` に `type: "placeholder"`, `track: "video"`, `placeholder: true` を入れると、プレビュー/出力/タイムラインにダミー配置されます。

## AquesTalkPlayer

アプリ本体には AquesTalkPlayer を同梱しません。AquesTalkPlayer はライセンス上、無断再配布できないため、ユーザーが公式配布物を展開します。アプリは `AQUESTALK_PLAYER_PATH`、既定の Downloads 配置、Inspector の `Voice Studio` で選択した `AquesTalkPlayer.exe` の順に安全に参照します。

JSON では話者ごとに次のように指定できます。

```json
"voice": {
  "engine": "aquestalk-player",
  "aquestalkPreset": "まりさ"
}
```

標準サンプルは `れいむ` と `まりさ` を使います。`aquestalkPreset` に `霊夢` / `魔理沙` と書かれていても、実行時に `れいむ` / `まりさ` へ正規化します。

## JSON 背景プリセット

```json
"background": {
  "type": "asset",
  "asset": "classroom-board",
  "label": "黒板教室",
  "accent": "#2f8f70"
}
```

`asset` は `classroom-board`, `news-desk`, `tatami-room`, `night-city`, `paper-light`, `studio-grid` を指定できます。

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
- AquesTalkPlayer はユーザーが選択した `AquesTalkPlayer.exe` のみを保存し、ファイル名検証後に PowerShell `Start-Process -Wait` で同期実行します。引数は単一引用符でエスケープし、GUI サブシステム特有の非同期終了で WAV 未生成になる問題を避けています。
- packaged app は `file://` の相対 asset 参照で起動し、`yukkuri-asset://custom/<id>.png` の限定プロトコルだけで管理済み素材を表示します。
- `release`, `qa`, `dist`, `dist-electron`, `node_modules` は GitHub に公開しません。
