export type Emotion = 'neutral' | 'happy' | 'thinking' | 'surprised' | 'serious'

export type StageLayout = 'duo' | 'left-focus' | 'right-focus' | 'solo-center'

export type VisualCueType = 'image' | 'keyword' | 'bullet' | 'chart' | 'code'

export interface Resolution {
  width: number
  height: number
}

export interface ProjectTheme {
  palette: 'studio-dark' | 'paper-light' | 'cyber-classroom'
  subtitleStyle: 'pop' | 'news' | 'minimal'
  bgm?: 'none' | 'soft' | 'news' | 'tech'
}

export interface CharacterVoice {
  engine: 'windows-sapi'
  voiceName?: string
  rate?: number
  volume?: number
}

export interface CustomCharacterAsset {
  id: string
  label: string
  filePath: string
  previewUrl?: string
  importedAt?: string
}

export interface CharacterProfile {
  id: string
  name: string
  asset: 'akari' | 'kohaku' | 'aoba' | 'custom'
  customAsset?: CustomCharacterAsset
  defaultEmotion?: Emotion
  side: 'left' | 'right'
  voice: CharacterVoice
}

export interface SceneBackground {
  type: 'gradient' | 'solid' | 'grid'
  from?: string
  to?: string
  color?: string
  accent?: string
}

export interface CaptionSpec {
  text?: string
  emphasis?: string[]
  position?: 'bottom' | 'center'
}

export interface VisualCue {
  type: VisualCueType
  title: string
  body?: string
  items?: string[]
}

export interface Shot {
  id: string
  speakerId: string
  text: string
  duration: number
  emotion?: Emotion
  layout?: StageLayout
  caption?: CaptionSpec
  visuals?: VisualCue[]
  notes?: string
}

export interface Scene {
  id: string
  title: string
  summary?: string
  background: SceneBackground
  shots: Shot[]
}

export interface YukkuriProject {
  format: 'yukkuricast-script'
  version: '1.0'
  project: {
    title: string
    description?: string
    fps: number
    resolution: Resolution
    theme: ProjectTheme
  }
  characters: CharacterProfile[]
  scenes: Scene[]
}

export interface ValidationResult {
  ok: boolean
  errors: string[]
}

export interface ExportProgress {
  phase: 'idle' | 'prepare' | 'voice' | 'frame' | 'clip' | 'concat' | 'done' | 'error'
  message: string
  percent: number
}

export interface ExportResult {
  ok: boolean
  outputPath?: string
  error?: string
}

export interface ScriptFileResult {
  canceled: boolean
  path?: string
  content?: string
}

export interface ImportedAssetResult {
  canceled: boolean
  asset?: CustomCharacterAsset
  error?: string
}
