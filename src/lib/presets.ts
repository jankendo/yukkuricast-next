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
