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
    },
    "growth": {
      "targetViewer": "AI動画制作を始めたい個人クリエイター",
      "viewerPromise": "JSON台本から音声・テロップ・図解・MP4出力までの流れがわかる",
      "coreQuestion": "なぜAI時代の動画制作はJSONで設計すると強いのか？",
      "titleCandidates": ["なぜAI動画制作はJSON設計で変わるのか？"],
      "thumbnailTexts": ["編集が変わる", "JSONで動画化"],
      "openingHook": "AI動画は、もう一部のクリエイターだけの道具じゃないのを知ってる？",
      "retentionGoal": "冒頭30秒で価値を提示し、1分ごとに小さな山場を入れる",
      "shortsHook": "AIが書いたJSONだけで動画はどこまで作れるのか？",
      "nextVideoIdea": "伸びるゆっくり解説の台本構成"
    },
    "readingDictionary": [
      { "surface": "JSON", "reading": "ジェイソン", "source": "project" }
    ]
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
          "caption": {
            "text": "ここに台詞を書きます。",
            "emphasis": ["台詞"]
          },
          "retention": {
            "beat": "hook",
            "chapterLabel": "0:00 Hook",
            "viewerQuestion": "この動画を見る理由は何？",
            "visualChange": "テーマ全体図を出す",
            "nextCuriosity": "次に核心の問いを出す"
          },
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
追加背景として history-archive / science-space / tech-lab / mystery-room / economy-board / courtroom も使えます。
speakerId は characters に存在する id だけを使ってください。
scenes[].shots[].caption.emphasis には字幕で強調したい短い語句を 1 から 3 個入れてください。
霊夢/魔理沙は同梱SVGを使い、霊夢は赤リボン・黒髪の視聴者代表、魔理沙は黒い魔女帽・白リボン・金髪の解説役として扱ってください。
emotion は neutral / happy / thinking / surprised / serious / smug / confused / angry / flustered を使えます。
演出が必要な shot には shots[].assets に type "effect" / track "effect" / effect "question-pop" などを入れてください。
project.export.gpuAcceleration は "auto"、audioSampleRate は 48000 を標準にしてください。
project.growth には、targetViewer、viewerPromise、coreQuestion、titleCandidates、thumbnailTexts、openingHook、retentionGoal、shortsHook、nextVideoIdea を入れてください。
英字略語・固有名詞・最新AI/IT用語など、AquesTalkが誤読しそうな語は project.readingDictionary に
{ "surface": "表記", "reading": "読み", "source": "project" } として入れてください。
各 shot は caption.text を必ず持たせ、原則として shot.text と同じ文章を入れてください。長すぎる場合は caption を短くせず、shot を分割してください。
各 shot は retention を持たせ、hook / viewer-benefit / question / early-payoff / background / evidence / twist / climax / summary / next-video のどれかを beat に指定してください。
画像や図解が必要な箇所は shots[].assets に type "placeholder" / track "video" / placeholder true を入れ、
source には架空のローカルパスやURLを書かないでください。
ゆっくり解説らしく、下部は太字字幕、左右下は霊夢/魔理沙、中央から上部は図解・Bロール・キーワードカードに分け、
字幕・キャラクター・素材が重ならないよう position を選んでください。
説明文や Markdown は返さず、JSON オブジェクトだけを返してください。
```

## 主要フィールド

- `project.export`: 書き出し設定です。`gpuAcceleration: "auto"` で NVIDIA NVENC / Intel Quick Sync / AMD AMF を自動検出し、使えない環境では CPU に安全フォールバックします。音声は `audioSampleRate: 48000` と `audioBitrate: "192k"` を推奨します。
- `project.growth`: 伸びるゆっくり解説を作るための企画メタです。`targetViewer`, `viewerPromise`, `coreQuestion`, `titleCandidates`, `thumbnailTexts`, `openingHook`, `retentionGoal`, `shortsHook`, `nextVideoIdea` を使い、クリック率、冒頭維持、平均視聴時間、次回視聴を意識した設計を保存します。
- `project.readingDictionary`: 台本内だけで有効な読み補正辞書です。字幕やJSON原文は変えず、AquesTalkPlayer / SAPI に渡す直前の読み上げ本文だけを補正します。例: `{ "surface": "NVENC", "reading": "エヌブイエンク" }`。
- `characters[].asset`: `reimu`, `marisa`, `akari`, `kohaku`, `aoba`, `custom`。`custom` はアプリ内の「話者素材を取り込む」から作った PNG 化済みユーザー素材です。
- `reimu` / `marisa`: 公式素材の抽出や他者素材の再利用ではなく、仕様に沿って生成した同梱SVGです。霊夢は赤い大リボンと黒髪、魔理沙は黒い魔女帽、白い大リボン、金髪を識別点にしています。
- `characters[].customAsset`: `asset` が `custom` の時に必要です。取り込み時にアプリがローカル管理フォルダへ安全に変換保存した素材 ID とパスを持ちます。
- `characters[].voice.engine`: `aquestalk-player` が標準です。`windows-sapi` は任意のフォールバックです。
- `characters[].voice.aquestalkPreset`: AquesTalkPlayer のプリセット名です。標準は `れいむ` / `まりさ` で、`霊夢` / `魔理沙` は実行時に正規化されます。
- `scenes[].background.type`: `asset`, `gradient`, `solid`, `grid`。新規JSONでは `asset` を推奨します。
- `scenes[].background.asset`: `classroom-board`, `news-desk`, `tatami-room`, `night-city`, `paper-light`, `studio-grid`, `history-archive`, `science-space`, `tech-lab`, `mystery-room`, `economy-board`, `courtroom`。
- `shots[].duration`: JSON上の目安尺です。AquesTalk の実音声が長い場合、プレビューとMP4書き出しでは音声が終わるまで自動延長されます。
- `shots[].emotion`: `neutral`, `happy`, `thinking`, `surprised`, `serious`, `smug`, `confused`, `angry`, `flustered`。
- `shots[].layout`: `duo`, `left-focus`, `right-focus`, `solo-center`。
- `shots[].caption.text`: 画面下部のテロップ本文です。基本的に `shots[].text` と同じ文章を入れます。テロップを短くするために情報を削らず、長い台詞はショットを分割します。
- `shots[].retention`: 視聴維持設計です。`beat` は `hook`, `viewer-benefit`, `question`, `early-payoff`, `background`, `evidence`, `twist`, `climax`, `summary`, `next-video`。`chapterLabel`, `viewerQuestion`, `visualChange`, `sourceNote`, `nextCuriosity` はプレビュー/出力上の上部ラベルや編集メモとして使います。
- `shots[].visuals`: 画面右上の補助パネルに出す情報です。`keyword`, `bullet`, `chart`, `code`, `image`, `question`, `timeline`, `comparison`, `source`, `map`, `chapter` を指定できます。
- `shots[].assets`: 編集タイムライン上の素材です。`track` は `video`, `character`, `voice`, `telop`, `effect`、`type` は `placeholder`, `image`, `video`, `audio`, `telop`, `effect` を使います。
- `shots[].assets[].effect`: `type: "effect"` / `track: "effect"` の時に使う同梱エフェクトです。`speed-lines`, `impact-burst`, `question-pop`, `chapter-wipe`, `highlight-ring`, `sparkle-trail`, `danger-stripe`, `source-note` を指定できます。
- `shots[].assets[].position`: プレビュー/出力上の配置です。`main-left`, `main-center`, `main-right`, `top-left`, `top-right`, `lower-third`, `fullscreen` を使えます。キャラクターは下左右、字幕は下部の専用領域を使うため、画像プレースホルダーは中央から上寄りを推奨します。
- `shots[].assets[].source`: 実ファイルをユーザーが用意済みの場合だけ書きます。LLM はローカルパスやURLを推測して書かず、未用意なら `placeholder: true` と `label` で差し替え指示を残します。

## プレビューと音声境界

AquesTalkPlayer はショットごとに WAV を出力しますが、アプリ内プレビューではそれらをショット境界で差し替えません。全ショットの WAV を先に 48kHz/stereo PCM へ正規化し、1 本の連続プレビュー WAV として再生します。これにより、次のテロップへ移る瞬間に AquesTalk 音声だけが途切れる問題を避けます。

## 読み補正辞書

AquesTalkPlayer 本体の `aq_dic/aq_user.dic` はバイナリ辞書で、公式GUIのユーザ辞書編集や AqUsrDic.dll の管理対象です。YukkuriCast Next は破損や配布ライセンス上の問題を避けるため、AquesTalkPlayer の辞書ファイルを直接書き換えません。代わりに、内蔵の最新AI/IT用語読み辞書、Inspector から追加するユーザー辞書、JSON の `project.readingDictionary` を結合し、音声合成直前の読み上げテキストだけを補正します。

優先順位は `内蔵辞書 < ユーザー辞書 < project.readingDictionary` です。字幕・テロップ・JSON本文は元表記のまま残るため、画面では `JSON`、読み上げでは `ジェイソン` のように扱えます。音声記号列を直接指定したい場合は、AquesTalkPlayer 仕様どおり本文を `#>` から始めると読み補正は行いません。

## ゆっくり解説レイアウト方針

- 冒頭は挨拶ではなく、8秒以内に謎・異常な事実・結論の一部を出します。
- 上部には章ラベル、視聴者の問い、次への引きを出し、動画の見どころを常に明示します。
- キャラクターは左右下に固定し、話者フォーカス時だけ少し強調します。
- 下部 25% 前後は字幕専用の安全領域です。
- 図解・差し替え画像・Bロールは中央から上部に置き、字幕と顔にかぶせません。
- 重要語だけを `caption.emphasis` で黄色強調し、全文装飾は避けます。
- 4-8秒ごとに、図解、キーワードカード、背景、章ラベル、強調語のいずれかを変えます。
- 章末は `retention.nextCuriosity` で次の疑問を残し、離脱しにくい構成にします。
- YMM4 のように、ボイス・字幕・キャラクター・画像・効果をタイムライン上の独立レーンとして扱います。

完全な JSON Schema は [schema/yukkuricast-script.schema.json](../schema/yukkuricast-script.schema.json)、動作サンプルは [examples/explainer.sample.json](../examples/explainer.sample.json) にあります。

## ユーザー素材の安全方針

ユーザーが用意した素材は、Electron renderer から直接ローカルファイルとして読ませません。取り込み時に `png`, `jpg`, `jpeg`, `webp`, `svg` だけを受け付け、20MB 以下であることを確認し、`sharp` で PNG に再エンコードしてからアプリ管理フォルダへ保存します。SVG も直接表示せず PNG 化するため、script や外部参照を UI に持ち込みません。

## AquesTalkPlayer の安全方針

AquesTalkPlayer 本体は同梱しません。ユーザーが公式配布物から展開した `AquesTalkPlayer.exe` をアプリ内で選択すると、そのフルパスだけをユーザーデータフォルダの settings.json に保存します。既定配置や `AQUESTALK_PLAYER_PATH` でも検出できます。実行時はファイル名を `AquesTalkPlayer.exe` に限定し、Node.js の `spawn` で `/P`, `/T`, `/W` を配列引数として直接渡して WAV 完成まで同期します。

公式 AquesTalkPlayer はコマンド実行でテキスト指定と WAV 出力が可能です。プリセットを使う場合は JSON の `aquestalkPreset` に AquesTalkPlayer 側のプリセット名を書きます。
