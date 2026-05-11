import { Download, FileInput, Play, RotateCcw, Save, Wand2 } from 'lucide-react'
import { formatDuration } from '../lib/scriptSchema'

interface TopBarProps {
  title: string
  duration: number
  fps: number
  canExport: boolean
  isExporting: boolean
  onImport: () => void
  onLoadSample: () => void
  onSave: () => void
  onExport: () => void
}

export function TopBar({
  title,
  duration,
  fps,
  canExport,
  isExporting,
  onImport,
  onLoadSample,
  onSave,
  onExport,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <Wand2 size={18} />
        </div>
        <div>
          <div className="brand-name">YukkuriCast Next</div>
          <div className="project-line">{title}</div>
        </div>
      </div>

      <div className="transport" aria-label="project summary">
        <span>{formatDuration(duration)}</span>
        <span>{fps}fps</span>
        <span>JSON 1.0</span>
      </div>

      <nav className="actions" aria-label="commands">
        <button type="button" className="icon-button" onClick={onLoadSample} title="サンプルを戻す">
          <RotateCcw size={17} />
        </button>
        <button type="button" className="command-button" onClick={onImport}>
          <FileInput size={17} />
          JSON 読込
        </button>
        <button type="button" className="command-button" onClick={onSave}>
          <Save size={17} />
          保存
        </button>
        <button type="button" className="icon-button" title="プレビュー再生">
          <Play size={17} />
        </button>
        <button
          type="button"
          className="primary-button"
          disabled={!canExport || isExporting}
          onClick={onExport}
        >
          <Download size={17} />
          {isExporting ? '書き出し中' : 'MP4 書出'}
        </button>
      </nav>
    </header>
  )
}
