import type { BackgroundAsset, CharacterAsset, CharacterVoice } from '../types/script'

export interface AquesTalkVoicePreset {
  id: string
  label: string
  preset: string
  asset: Exclude<CharacterAsset, 'custom'>
  side: 'left' | 'right'
  voice: CharacterVoice
  description: string
}

export interface BackgroundPreset {
  id: BackgroundAsset
  label: string
  description: string
  accent: string
}

export const DEFAULT_AQUESTALK_PRESET = 'れいむ'

export const AQUESTALK_VOICE_PRESETS: AquesTalkVoicePreset[] = [
  {
    id: 'reimu',
    label: '霊夢',
    preset: 'れいむ',
    asset: 'reimu',
    side: 'left',
    voice: {
      engine: 'aquestalk-player',
      aquestalkPreset: 'れいむ',
      rate: 0,
      volume: 100,
    },
    description: 'AquesTalk1 女性1の棒読み。落ち着いた解説役向け。',
  },
  {
    id: 'marisa',
    label: '魔理沙',
    preset: 'まりさ',
    asset: 'marisa',
    side: 'right',
    voice: {
      engine: 'aquestalk-player',
      aquestalkPreset: 'まりさ',
      rate: 0,
      volume: 100,
    },
    description: 'AquesTalk1 女性2の棒読み。テンポのよい相槌役向け。',
  },
  {
    id: 'koishi',
    label: 'こいし',
    preset: 'こいし',
    asset: 'reimu',
    side: 'left',
    voice: {
      engine: 'aquestalk-player',
      aquestalkPreset: 'こいし',
      rate: 0,
      volume: 100,
    },
    description: '少し高めの明るい派生プリセット。',
  },
  {
    id: 'satori',
    label: 'さとり',
    preset: 'さとり',
    asset: 'marisa',
    side: 'right',
    voice: {
      engine: 'aquestalk-player',
      aquestalkPreset: 'さとり',
      rate: 0,
      volume: 100,
    },
    description: '落ち着いた聞き役に使いやすい派生プリセット。',
  },
]

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'classroom-board',
    label: '黒板教室',
    description: '制度、歴史、勉強系の解説に使う定番レイアウト。',
    accent: '#2f8f70',
  },
  {
    id: 'news-desk',
    label: 'ニュース机',
    description: '時事、比較、ランキング、注意喚起向け。',
    accent: '#3158a8',
  },
  {
    id: 'tatami-room',
    label: '畳部屋',
    description: '雑談、導入、軽い掛け合い向け。',
    accent: '#b98b42',
  },
  {
    id: 'night-city',
    label: '夜景',
    description: 'テクノロジー、事件、未来予測向け。',
    accent: '#5c83d6',
  },
  {
    id: 'history-archive',
    label: '歴史資料室',
    description: '歴史ミステリー、古文書、一次資料、時系列整理向け。',
    accent: '#d7a45b',
  },
  {
    id: 'science-space',
    label: '科学宇宙',
    description: '宇宙、科学、仮説検証、図解多めの解説向け。',
    accent: '#79d8ff',
  },
  {
    id: 'tech-lab',
    label: 'テック研究室',
    description: 'AI、GPU、ソフトウェア、未来技術の解説向け。',
    accent: '#35d0ff',
  },
  {
    id: 'mystery-room',
    label: 'ミステリー部屋',
    description: '都市伝説、未解明、違和感を引っ張る構成向け。',
    accent: '#ff6b7a',
  },
  {
    id: 'economy-board',
    label: '経済ボード',
    description: 'お金、制度、比較、ランキング、生活影響の解説向け。',
    accent: '#70e0a0',
  },
  {
    id: 'courtroom',
    label: '検証法廷',
    description: '事件、社会問題、反対意見、ファクトチェック向け。',
    accent: '#ffcc4d',
  },
  {
    id: 'paper-light',
    label: '紙ノート',
    description: '手順、まとめ、チェックリスト向け。',
    accent: '#ffc857',
  },
  {
    id: 'studio-grid',
    label: '分析グリッド',
    description: 'データ、AI、システム解説向け。',
    accent: '#35d0ff',
  },
]

const aquestalkPresetAliases = new Map<string, string>([
  ['霊夢', 'れいむ'],
  ['博麗霊夢', 'れいむ'],
  ['reimu', 'れいむ'],
  ['Reimu', 'れいむ'],
  ['魔理沙', 'まりさ'],
  ['霧雨魔理沙', 'まりさ'],
  ['marisa', 'まりさ'],
  ['Marisa', 'まりさ'],
])

export function normalizeAquesTalkPreset(value?: string) {
  const trimmed = value?.trim()
  if (!trimmed) {
    return DEFAULT_AQUESTALK_PRESET
  }
  return aquestalkPresetAliases.get(trimmed) ?? trimmed
}
