export type Emotion = 'neutral' | 'happy' | 'thinking' | 'surprised' | 'serious'

export type StageLayout = 'duo' | 'left-focus' | 'right-focus' | 'solo-center'

export type VisualCueType = 'image' | 'keyword' | 'bullet' | 'chart' | 'code'

export type CharacterAsset = 'reimu' | 'marisa' | 'akari' | 'kohaku' | 'aoba' | 'custom'

export type BackgroundAsset =
  | 'studio-grid'
  | 'paper-light'
  | 'classroom-board'
  | 'news-desk'
  | 'tatami-room'
  | 'night-city'

export interface Resolution {
  width: number
  height: number
}

export interface ProjectTheme {
  palette: 'studio-dark' | 'paper-light' | 'cyber-classroom'
  subtitleStyle: 'pop' | 'news' | 'minimal'
  bgm?: 'none' | 'soft' | 'news' | 'tech'
}

export interface ProjectExportSettings {
  gpuAcceleration?: 'auto' | 'off' | 'nvenc' | 'qsv' | 'amf'
  videoBitrate?: string
  audioBitrate?: string
  audioSampleRate?: 44100 | 48000
}

export interface ReadingDictionaryEntry {
  id?: string
  surface: string
  reading: string
  enabled?: boolean
  caseSensitive?: boolean
  source?: 'builtin' | 'user' | 'project'
}

export type VoiceEngine = 'windows-sapi' | 'aquestalk-player'

export interface CharacterVoice {
  engine: VoiceEngine
  voiceName?: string
  aquestalkPreset?: string
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
  asset: CharacterAsset
  customAsset?: CustomCharacterAsset
  defaultEmotion?: Emotion
  side: 'left' | 'right'
  voice: CharacterVoice
}

export interface SceneBackground {
  type: 'gradient' | 'solid' | 'grid' | 'asset'
  asset?: BackgroundAsset
  label?: string
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

export type TimelineAssetType = 'placeholder' | 'image' | 'video' | 'audio' | 'telop' | 'effect'

export type TimelineTrackType = 'video' | 'character' | 'voice' | 'telop' | 'effect'

export type TimelineAssetPosition =
  | 'main-left'
  | 'main-center'
  | 'main-right'
  | 'top-left'
  | 'top-right'
  | 'lower-third'
  | 'fullscreen'

export interface TimelineAsset {
  id: string
  type: TimelineAssetType
  track: TimelineTrackType
  label: string
  start?: number
  duration?: number
  source?: string
  placeholder?: boolean
  position?: TimelineAssetPosition
  opacity?: number
  notes?: string
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
  assets?: TimelineAsset[]
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
    export?: ProjectExportSettings
    readingDictionary?: ReadingDictionaryEntry[]
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

export interface VoiceEngineSettings {
  aquestalkPlayerPath?: string
  readingDictionary?: ReadingDictionaryEntry[]
  builtinReadingDictionarySize?: number
  builtinReadingDictionaryVersion?: string
  updatedAt?: string
}

export interface VoiceSettingsResult {
  canceled: boolean
  settings?: VoiceEngineSettings
  error?: string
}

export interface PreviewAudioResult {
  ok: boolean
  audioUrl?: string
  engine?: VoiceEngine
  duration?: number
  message?: string
  error?: string
}

export interface PreviewTimelineAudioResult {
  ok: boolean
  audioUrl?: string
  duration?: number
  shotDurations?: Record<string, number>
  engineSummary?: string
  message?: string
  error?: string
}
