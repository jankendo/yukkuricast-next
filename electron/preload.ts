import { contextBridge, ipcRenderer } from 'electron'
import type { ExportProgress, YukkuriProject } from '../src/types/script'

contextBridge.exposeInMainWorld('yukkuri', {
  openScript: () => ipcRenderer.invoke('script:open'),
  saveScript: (content: string) => ipcRenderer.invoke('script:save', content),
  copyText: (content: string) => ipcRenderer.invoke('clipboard:write-text', content),
  importCharacterAsset: () => ipcRenderer.invoke('asset:import-character'),
  getVoiceSettings: () => ipcRenderer.invoke('voice:get-settings'),
  selectAquesTalkPlayer: () => ipcRenderer.invoke('voice:select-aquestalk-player'),
  renderPreviewAudio: (project: YukkuriProject, shotId: string) =>
    ipcRenderer.invoke('preview:render-audio', project, shotId),
  renderPreviewTimelineAudio: (project: YukkuriProject) => ipcRenderer.invoke('preview:render-timeline-audio', project),
  exportVideo: (project: YukkuriProject) => ipcRenderer.invoke('video:export', project),
  onExportProgress: (callback: (progress: ExportProgress) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: ExportProgress) => {
      callback(progress)
    }
    ipcRenderer.on('video:export-progress', listener)
    return () => ipcRenderer.off('video:export-progress', listener)
  },
})
