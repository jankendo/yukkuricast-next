import { contextBridge, ipcRenderer } from 'electron'
import type { ExportProgress, YukkuriProject } from '../src/types/script'

contextBridge.exposeInMainWorld('yukkuri', {
  openScript: () => ipcRenderer.invoke('script:open'),
  saveScript: (content: string) => ipcRenderer.invoke('script:save', content),
  importCharacterAsset: () => ipcRenderer.invoke('asset:import-character'),
  exportVideo: (project: YukkuriProject) => ipcRenderer.invoke('video:export', project),
  onExportProgress: (callback: (progress: ExportProgress) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: ExportProgress) => {
      callback(progress)
    }
    ipcRenderer.on('video:export-progress', listener)
    return () => ipcRenderer.off('video:export-progress', listener)
  },
})
