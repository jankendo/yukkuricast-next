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
      "palette": "studio-dark",
      "subtitleStyle": "pop",
      "bgm": "none"
    }
  },
  "characters": [
    {
      "id": "akari",
      "name": "あかり",
      "asset": "akari",
      "side": "left",
      "voice": { "engine": "windows-sapi", "rate": 1, "volume": 95 }
    }
  ],
  "scenes": [
    {
      "id": "scene-01",
      "title": "導入",
      "background": { "type": "grid", "from": "#101827", "to": "#1f2a44" },
      "shots": [
        {
          "id": "shot-01",
          "speakerId": "akari",
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
characters は akari と kohaku の 2 人を使い、各 shot は 4 秒から 7 秒にしてください。
AquesTalk を使う話者は voice.engine を "aquestalk-player" にし、必要なら voice.aquestalkPreset にプリセット名を入れてください。
speakerId は characters に存在する id だけを使ってください。
scenes[].shots[].caption.emphasis には字幕で強調したい短い語句を 1 から 3 個入れてください。
説明文や Markdown は返さず、JSON オブジェクトだけを返してください。
```

## 主要フィールド

- `characters[].asset`: `akari`, `kohaku`, `aoba`, `custom`。`custom` はアプリ内の「話者素材を取り込む」から作った PNG 化済みユーザー素材です。
- `characters[].customAsset`: `asset` が `custom` の時に必要です。取り込み時にアプリがローカル管理フォルダへ安全に変換保存した素材 ID とパスを持ちます。
- `characters[].voice.engine`: `windows-sapi` または `aquestalk-player`。`aquestalk-player` はユーザーがアプリで選択した AquesTalkPlayer.exe を使って WAV を生成します。
- `characters[].voice.aquestalkPreset`: AquesTalkPlayer のプリセット名です。未指定時は AquesTalkPlayer 側の最後の設定が使われます。
- `scenes[].background.type`: `gradient`, `solid`, `grid`。
- `shots[].emotion`: `neutral`, `happy`, `thinking`, `surprised`, `serious`。
- `shots[].layout`: `duo`, `left-focus`, `right-focus`, `solo-center`。
- `shots[].visuals`: 画面右上の補助パネルに出す情報です。`keyword`, `bullet`, `chart`, `code`, `image` を指定できます。

完全な JSON Schema は [schema/yukkuricast-script.schema.json](../schema/yukkuricast-script.schema.json)、動作サンプルは [examples/explainer.sample.json](../examples/explainer.sample.json) にあります。

## ユーザー素材の安全方針

ユーザーが用意した素材は、Electron renderer から直接ローカルファイルとして読ませません。取り込み時に `png`, `jpg`, `jpeg`, `webp`, `svg` だけを受け付け、20MB 以下であることを確認し、`sharp` で PNG に再エンコードしてからアプリ管理フォルダへ保存します。SVG も直接表示せず PNG 化するため、script や外部参照を UI に持ち込みません。

## AquesTalkPlayer の安全方針

AquesTalkPlayer 本体は同梱しません。ユーザーが公式配布物から展開した `AquesTalkPlayer.exe` をアプリ内で選択すると、そのフルパスだけをユーザーデータフォルダの settings.json に保存します。実行時は shell を使わず、`/T`, `/P`, `/W` を引数配列として渡します。

公式 AquesTalkPlayer はコマンド実行でテキスト指定と WAV 出力が可能です。プリセットを使う場合は JSON の `aquestalkPreset` に AquesTalkPlayer 側のプリセット名を書きます。
