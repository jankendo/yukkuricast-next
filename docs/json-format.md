# YukkuriCast Script JSON 1.0

`yukkuricast-script` は、LLM が出力した台本を編集可能な動画プロジェクトとして扱うための JSON 形式です。話者、台詞、表情、画面構成、背景、字幕強調、補助ビジュアル、尺を 1 ファイルに閉じ込めます。

## 最小構造

```json
{
  "format": "yukkuricast-script",
  "version": "1.0",
  "project": {
    "title": "動画タイトル",
    "fps": 30,
    "resolution": { "width": 1920, "height": 1080 },
    "theme": {
      "palette": "paper-light",
      "subtitleStyle": "pop",
      "bgm": "none"
    },
    "export": {
      "gpuAcceleration": "auto",
      "videoBitrate": "8M",
      "audioBitrate": "192k",
      "audioSampleRate": 48000
    }
  },
  "characters": [
    {
      "id": "reimu",
      "name": "霊夢",
      "asset": "reimu",
      "side": "left",
      "voice": { "engine": "aquestalk-player", "aquestalkPreset": "れいむ", "volume": 100 }
    }
  ],
  "scenes": [
    {
      "id": "scene-01",
      "title": "導入",
      "background": { "type": "asset", "asset": "classroom-board", "label": "黒板教室" },
      "shots": [
        {
          "id": "shot-01",
          "speakerId": "reimu",
          "text": "ここに台詞を書きます。",
          "duration": 4.5,
          "emotion": "happy",
          "layout": "duo",
          "assets": [
            {
              "id": "img-topic-map",
              "type": "placeholder",
              "track": "video",
              "label": "差し替え画像: テーマ全体図",
              "start": 0.4,
              "duration": 3.6,
              "placeholder": true,
              "position": "main-left"
            }
          ]
        }
      ]
    }
  ]
}
```

## LLM への出力指示例

```text
次のテーマについて、YukkuriCast Script JSON 1.0 だけを返してください。
必ず format は "yukkuricast-script"、version は "1.0" にします。
characters は reimu と marisa の 2 人を使い、各 shot は 4 秒から 7 秒を目安にしてください。
標準音声は AquesTalkPlayer です。霊夢は voice.aquestalkPreset "れいむ"、魔理沙は "まりさ" にしてください。
背景は scene ごとに classroom-board / news-desk / tatami-room / night-city / paper-light / studio-grid から内容に合わせて選んでください。
speakerId は characters に存在する id だけを使ってください。
scenes[].shots[].caption.emphasis には字幕で強調したい短い語句を 1 から 3 個入れてください。
project.export.gpuAcceleration は "auto"、audioSampleRate は 48000 を標準にしてください。
画像や図解が必要な箇所は shots[].assets に type "placeholder" / track "video" / placeholder true を入れ、
source には架空のローカルパスやURLを書かないでください。
ゆっくり解説らしく、下部は太字字幕、左右下は霊夢/魔理沙、中央から上部は図解・Bロール・キーワードカードに分け、
字幕・キャラクター・素材が重ならないよう position を選んでください。
説明文や Markdown は返さず、JSON オブジェクトだけを返してください。
```

## 主要フィールド

- `project.export`: 書き出し設定です。`gpuAcceleration: "auto"` で NVIDIA NVENC / Intel Quick Sync / AMD AMF を自動検出し、使えない環境では CPU に安全フォールバックします。音声は `audioSampleRate: 48000` と `audioBitrate: "192k"` を推奨します。
- `characters[].asset`: `reimu`, `marisa`, `akari`, `kohaku`, `aoba`, `custom`。`custom` はアプリ内の「話者素材を取り込む」から作った PNG 化済みユーザー素材です。
- `characters[].customAsset`: `asset` が `custom` の時に必要です。取り込み時にアプリがローカル管理フォルダへ安全に変換保存した素材 ID とパスを持ちます。
- `characters[].voice.engine`: `aquestalk-player` が標準です。`windows-sapi` は任意のフォールバックです。
- `characters[].voice.aquestalkPreset`: AquesTalkPlayer のプリセット名です。標準は `れいむ` / `まりさ` で、`霊夢` / `魔理沙` は実行時に正規化されます。
- `scenes[].background.type`: `asset`, `gradient`, `solid`, `grid`。新規JSONでは `asset` を推奨します。
- `scenes[].background.asset`: `classroom-board`, `news-desk`, `tatami-room`, `night-city`, `paper-light`, `studio-grid`。
- `shots[].duration`: JSON上の目安尺です。AquesTalk の実音声が長い場合、プレビューとMP4書き出しでは音声が終わるまで自動延長されます。
- `shots[].emotion`: `neutral`, `happy`, `thinking`, `surprised`, `serious`。
- `shots[].layout`: `duo`, `left-focus`, `right-focus`, `solo-center`。
- `shots[].visuals`: 画面右上の補助パネルに出す情報です。`keyword`, `bullet`, `chart`, `code`, `image` を指定できます。
- `shots[].assets`: 編集タイムライン上の素材です。`track` は `video`, `character`, `voice`, `telop`, `effect`、`type` は `placeholder`, `image`, `video`, `audio`, `telop`, `effect` を使います。
- `shots[].assets[].position`: プレビュー/出力上の配置です。`main-left`, `main-center`, `main-right`, `top-left`, `top-right`, `lower-third`, `fullscreen` を使えます。キャラクターは下左右、字幕は下部の専用領域を使うため、画像プレースホルダーは中央から上寄りを推奨します。
- `shots[].assets[].source`: 実ファイルをユーザーが用意済みの場合だけ書きます。LLM はローカルパスやURLを推測して書かず、未用意なら `placeholder: true` と `label` で差し替え指示を残します。

## プレビューと音声境界

AquesTalkPlayer はショットごとに WAV を出力しますが、アプリ内プレビューではそれらをショット境界で差し替えません。全ショットの WAV を先に 48kHz/stereo PCM へ正規化し、1 本の連続プレビュー WAV として再生します。これにより、次のテロップへ移る瞬間に AquesTalk 音声だけが途切れる問題を避けます。

## ゆっくり解説レイアウト方針

- キャラクターは左右下に固定し、話者フォーカス時だけ少し強調します。
- 下部 25% 前後は字幕専用の安全領域です。
- 図解・差し替え画像・Bロールは中央から上部に置き、字幕と顔にかぶせません。
- 重要語だけを `caption.emphasis` で黄色強調し、全文装飾は避けます。
- YMM4 のように、ボイス・字幕・キャラクター・画像・効果をタイムライン上の独立レーンとして扱います。

完全な JSON Schema は [schema/yukkuricast-script.schema.json](../schema/yukkuricast-script.schema.json)、動作サンプルは [examples/explainer.sample.json](../examples/explainer.sample.json) にあります。

## ユーザー素材の安全方針

ユーザーが用意した素材は、Electron renderer から直接ローカルファイルとして読ませません。取り込み時に `png`, `jpg`, `jpeg`, `webp`, `svg` だけを受け付け、20MB 以下であることを確認し、`sharp` で PNG に再エンコードしてからアプリ管理フォルダへ保存します。SVG も直接表示せず PNG 化するため、script や外部参照を UI に持ち込みません。

## AquesTalkPlayer の安全方針

AquesTalkPlayer 本体は同梱しません。ユーザーが公式配布物から展開した `AquesTalkPlayer.exe` をアプリ内で選択すると、そのフルパスだけをユーザーデータフォルダの settings.json に保存します。既定配置や `AQUESTALK_PLAYER_PATH` でも検出できます。実行時はファイル名を `AquesTalkPlayer.exe` に限定し、PowerShell `Start-Process -Wait` で `/P`, `/T`, `/W` を渡して WAV 完成まで同期します。

公式 AquesTalkPlayer はコマンド実行でテキスト指定と WAV 出力が可能です。プリセットを使う場合は JSON の `aquestalkPreset` に AquesTalkPlayer 側のプリセット名を書きます。
