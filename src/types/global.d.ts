import type { ExportProgress, ExportResult, ImportedAssetResult, ScriptFileResult, YukkuriProject } from './script'

declare global {
  interface Window {
    yukkuri?: {
      openScript: () => Promise<ScriptFileResult>
      saveScript: (content: string) => Promise<ScriptFileResult>
      importCharacterAsset: () => Promise<ImportedAssetResult>
      exportVideo: (project: YukkuriProject) => Promise<ExportResult>
      onExportProgress: (callback: (progress: ExportProgress) => void) => () => void
    }
  }
}

export {}
