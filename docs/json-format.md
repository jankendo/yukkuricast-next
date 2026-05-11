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
          "layout": "duo"
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
説明文や Markdown は返さず、JSON オブジェクトだけを返してください。
```

## 主要フィールド

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

完全な JSON Schema は [schema/yukkuricast-script.schema.json](../schema/yukkuricast-script.schema.json)、動作サンプルは [examples/explainer.sample.json](../examples/explainer.sample.json) にあります。

## ユーザー素材の安全方針

ユーザーが用意した素材は、Electron renderer から直接ローカルファイルとして読ませません。取り込み時に `png`, `jpg`, `jpeg`, `webp`, `svg` だけを受け付け、20MB 以下であることを確認し、`sharp` で PNG に再エンコードしてからアプリ管理フォルダへ保存します。SVG も直接表示せず PNG 化するため、script や外部参照を UI に持ち込みません。

## AquesTalkPlayer の安全方針

AquesTalkPlayer 本体は同梱しません。ユーザーが公式配布物から展開した `AquesTalkPlayer.exe` をアプリ内で選択すると、そのフルパスだけをユーザーデータフォルダの settings.json に保存します。既定配置や `AQUESTALK_PLAYER_PATH` でも検出できます。実行時はファイル名を `AquesTalkPlayer.exe` に限定し、PowerShell `Start-Process -Wait` で `/P`, `/T`, `/W` を渡して WAV 完成まで同期します。

公式 AquesTalkPlayer はコマンド実行でテキスト指定と WAV 出力が可能です。プリセットを使う場合は JSON の `aquestalkPreset` に AquesTalkPlayer 側のプリセット名を書きます。
