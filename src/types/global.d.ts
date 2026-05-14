import type {
  ExportProgress,
  ExportResult,
  ImportedAssetResult,
  PreviewAudioResult,
  PreviewTimelineAudioResult,
  ScriptFileResult,
  VoiceEngineSettings,
  VoiceSettingsResult,
  YukkuriProject,
} from './script'

declare global {
  interface Window {
    yukkuri?: {
      openScript: () => Promise<ScriptFileResult>
      saveScript: (content: string) => Promise<ScriptFileResult>
      copyText: (content: string) => Promise<{ ok: boolean }>
      importCharacterAsset: () => Promise<ImportedAssetResult>
      getVoiceSettings: () => Promise<VoiceEngineSettings>
      selectAquesTalkPlayer: () => Promise<VoiceSettingsResult>
      addReadingDictionaryEntry: (surface: string, reading: string) => Promise<VoiceSettingsResult>
      removeReadingDictionaryEntry: (id: string) => Promise<VoiceSettingsResult>
      renderPreviewAudio: (project: YukkuriProject, shotId: string) => Promise<PreviewAudioResult>
      renderPreviewTimelineAudio: (project: YukkuriProject) => Promise<PreviewTimelineAudioResult>
      exportVideo: (project: YukkuriProject) => Promise<ExportResult>
      onExportProgress: (callback: (progress: ExportProgress) => void) => () => void
    }
  }
}

export {}
