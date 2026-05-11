import type { YukkuriProject } from '../types/script'

export function buildAiJsonPromptTemplate(project: YukkuriProject) {
  const sampleJson = JSON.stringify(project, null, 2)

  return `あなたは YukkuriCast Next 用の JSON 台本を作成する専門エージェントです。
以下の仕様に厳密に従い、解説動画としてそのまま読み込める JSON だけを出力してください。
Markdown、説明文、コードフェンス、コメントは出力禁止です。

目的:
- 視聴者が最後まで理解しやすい、テンポのよい解説動画台本を作る
- 1 shot は 3-8 秒を基本にし、1 文が長すぎる場合は shot を分割する
- AquesTalk の実音声が JSON の duration より長い場合、アプリ側で自動延長される。ただし AI は聞きやすい目安秒数を書く
- caption.text は字幕として自然な短さに整える
- caption.emphasis には強調したい語句だけを 0-4 個入れる
- visuals は必要な shot だけに付け、情報量を詰め込みすぎない
- scenes[].background は内容に合わせて選ぶ。勉強/制度は classroom-board、時事/比較は news-desk、雑談は tatami-room、IT/未来は night-city、手順は paper-light、分析は studio-grid

必須 JSON 仕様:
- format は "yukkuricast-script"
- version は "1.0"
- project.fps は 30 または 60
- project.resolution は 1920x1080 を標準にする
- project.theme.palette は "studio-dark" | "paper-light" | "cyber-classroom"
- project.theme.subtitleStyle は "pop" | "news" | "minimal"
- characters[].asset は標準で "reimu" | "marisa" を使う。追加話者には "akari" | "kohaku" | "aoba" も使える
- ユーザー素材を使う場合でも AI は customAsset のローカルパスを捏造しない。まず同梱 asset を使い、アプリ上で差し替える前提にする
- characters[].voice.engine は "windows-sapi" または "aquestalk-player"
- 標準は AquesTalkPlayer。霊夢は voice.engine "aquestalk-player" / voice.aquestalkPreset "れいむ" / asset "reimu" / side "left"
- 魔理沙は voice.engine "aquestalk-player" / voice.aquestalkPreset "まりさ" / asset "marisa" / side "right"
- Windows 標準音声を使う話者は、ユーザーが明示した場合だけ voice.engine を "windows-sapi" にする
- scenes[].background.type は "asset" を標準にし、asset は "classroom-board" | "news-desk" | "tatami-room" | "night-city" | "paper-light" | "studio-grid" から選ぶ
- 旧式背景が必要な場合だけ scenes[].background.type に "gradient" | "solid" | "grid" を使う
- shots[].speakerId は characters[].id のどれかに一致させる
- shots[].duration は 1-45 秒
- shots[].layout は "duo" | "left-focus" | "right-focus" | "solo-center"
- shots[].emotion は "neutral" | "happy" | "thinking" | "surprised" | "serious"

品質ルール:
- 導入、問題提起、具体例、まとめの流れを作る
- 霊夢は落ち着いた進行、魔理沙は短い相槌と補足でテンポを作る
- 口語として自然な日本語にし、「だぜ」「だね」などを過剰に連発しない
- 同じ語尾と同じ構文を連続させない
- 字幕は1行20文字前後、最大2行を目安にして、長い説明は shot を分ける
- 固有名詞や数値は必要な場合だけ使う
- JSON は必ず構文的に valid にする
- trailing comma は禁止

出力する JSON の雛形:
${sampleJson}

この雛形の構造を保ちながら、次のテーマで完成版 JSON を作成してください。
テーマ: ここに作りたい解説動画のテーマを書く
想定視聴者: ここに視聴者層を書く
動画尺: ここに目安尺を書く
トーン: ゆっくり解説らしく、わかりやすく、少しテンポよく`
}
