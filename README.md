# YukkuriCast Next

LLM が生成した JSON 台本を読み込み、オリジナルゆっくり風キャラクター、字幕、Windows 標準音声合成 / AquesTalkPlayer、FFmpeg を使って解説動画 MP4 を生成する Windows デスクトップアプリです。

## 実装済み

- Electron + React + TypeScript の Windows アプリ
- `yukkuricast-script` JSON 1.0 のスキーマ、サンプル、ランタイム検証
- JSON 読み込み、編集、保存、シーン/ショット選択
- 再生/停止/シーク可能な 16:9 プレビュー、全文テロップ、字幕強調、視聴維持ラベル、補助ビジュアル、素材プレースホルダー、インスペクター
- 映像/画像、キャラクター、音声、テロップ、効果を左から右の時間軸に並べる多層編集タイムライン
- YouTubeの視聴維持設計をJSONに入れる `project.growth` / `shots[].retention` と、章ラベル・問い・次回導線を反映する動画レイアウト
- オリジナルゆっくり風 SVG アセット 5 体 x 5 表情。霊夢/魔理沙プリセットを標準搭載
- 黒板教室、ニュース机、畳部屋、夜景、紙ノート、分析グリッドの背景アセット
- ユーザー持ち込みキャラクター素材の安全な取り込み、PNG 再エンコード、プレビュー/書き出し反映
- AquesTalkPlayer.exe を標準音声エンジンとして同期実行し、Windows SAPI も任意で利用可能
- 最新AI/IT用語に強い内蔵読み補正辞書と、Inspector から追加できるユーザー読み辞書
- AquesTalk の WAV 実尺を解析し、JSON の `duration` が短すぎてもプレビュー/MP4 書き出しを自動延長
- AquesTalk 音声を 48kHz/stereo WAV に正規化し、プレビューもショット単位ではなく連続WAVとして合成してテロップ切替時の途切れを抑制
- NVIDIA NVENC / Intel Quick Sync / AMD AMF の H.264 GPU エンコーダーを自動検証し、利用可能なら書き出しに使用
- アプリ内プレビュー音声生成と、再生中ショットに合わせたキャラクター簡易リップモーション
- AI に JSON 台本を作らせるための仕様付きテンプレートプロンプト表示/コピー
- クリック率、冒頭30秒維持、平均視聴時間、シリーズ再訪を意識した 2026 年向けゆっくり解説プロンプト
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

`project.export.gpuAcceleration` は `auto` が標準です。GPU エンコーダーが使えない環境では CPU `libx264` にフォールバックします。RTX 3060 など NVIDIA 環境では PATH または `FFMPEG_PATH` にある新しい FFmpeg の `h264_nvenc` を優先し、同梱FFmpegより先に検証します。画像や図解をあとで差し替える場合は `shots[].assets` に `type: "placeholder"`, `track: "video"`, `placeholder: true` を入れると、プレビュー/出力/タイムラインにダミー配置されます。

`project.growth` は動画全体の伸びる設計、`shots[].retention` は各ショットの視聴維持設計です。`caption.text` は原則 `shot.text` と同じ文章にして、話した内容をそのままテロップへ出します。長い台詞は字幕だけ短くせず、ショットを分割してください。

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

### 読み補正辞書

AquesTalkPlayer 自体の `aq_dic/aq_user.dic` は公式GUI/AqUsrDic.dll 管理のバイナリ辞書なので、YukkuriCast Next は直接書き換えません。代わりに、音声生成直前に次の順で読み補正を適用します。

1. 内蔵辞書: `LLM`, `JSON`, `生成AI`, `CUDA`, `RTX3060`, `NVENC`, `FFmpeg`, `YouTube`, `ChatGPT`, `AquesTalkPlayer`, `霊夢`, `魔理沙` など
2. Inspector の Voice Studio から追加したユーザー辞書
3. JSON の `project.readingDictionary`

字幕や台本の表記は変えず、AquesTalkPlayer / SAPI に渡す読み上げ本文だけを補正します。

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

通常利用ではアプリ内の `MP4 書出` ボタンから保存先を選択します。NVENC を確実に使う場合は、NVIDIA ドライバーを更新し、`ffmpeg -encoders` で `h264_nvenc` が表示される FFmpeg を PATH に入れるか、環境変数 `FFMPEG_PATH` にその `ffmpeg.exe` を指定してください。

## セキュリティ

- Renderer に Node.js API を直接公開しません。
- IPC は `preload` の `contextBridge` 経由の限定 API だけです。
- クリップボード操作は AI テンプレートコピー用の文字列書き込み API だけに限定しています。
- ユーザー素材は任意 SVG/画像を直接表示せず、20MB 以下の許可拡張子だけを PNG に再エンコードします。
- AquesTalkPlayer はユーザーが選択した `AquesTalkPlayer.exe` のみを保存し、ファイル名検証後に Node.js `spawn` の配列引数で同期実行します。台詞内の半角スペースで `/T` が分割されないよう、PowerShell 経由では実行しません。
- packaged app は `file://` の相対 asset 参照で起動し、`yukkuri-asset://custom/<id>.png` の限定プロトコルだけで管理済み素材を表示します。
- `release`, `qa`, `dist`, `dist-electron`, `node_modules` は GitHub に公開しません。
