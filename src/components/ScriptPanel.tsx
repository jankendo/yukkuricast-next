import { AlertTriangle, CheckCircle2, FileJson2, Layers, Wand2 } from 'lucide-react'
import type { YukkuriProject } from '../types/script'

interface ScriptPanelProps {
  jsonText: string
  project: YukkuriProject
  errors: string[]
  activeShotId: string
  onJsonTextChange: (value: string) => void
  onApplyJson: () => void
  onSelectShot: (shotId: string) => void
  onOpenPromptGuide: () => void
}

export function ScriptPanel({
  jsonText,
  project,
  errors,
  activeShotId,
  onJsonTextChange,
  onApplyJson,
  onSelectShot,
  onOpenPromptGuide,
}: ScriptPanelProps) {
  return (
    <aside className="panel script-panel" aria-label="script json panel">
      <div className="panel-title">
        <FileJson2 size={17} />
        JSON 台本
      </div>
      <textarea
        className="json-editor"
        spellCheck={false}
        value={jsonText}
        onChange={(event) => onJsonTextChange(event.target.value)}
        aria-label="JSON script editor"
      />
      <div className={`validation ${errors.length > 0 ? 'invalid' : 'valid'}`}>
        {errors.length > 0 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
        <span>{errors.length > 0 ? `${errors.length} 件の問題` : 'JSON は有効です'}</span>
      </div>
      {errors.length > 0 && (
        <ul className="error-list">
          {errors.slice(0, 4).map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      <div className="script-actions">
        <button type="button" className="wide-button" onClick={onApplyJson}>
          変更を反映
        </button>
        <button type="button" className="wide-button accent compact-button" onClick={onOpenPromptGuide}>
          <Wand2 size={16} />
          AI用プロンプト
        </button>
      </div>

      <div className="scene-browser">
        <div className="panel-title small">
          <Layers size={16} />
          シーン
        </div>
        {project.scenes.map((scene) => (
          <section key={scene.id} className="scene-block">
            <div className="scene-heading">
              <span>{scene.title}</span>
              <span>{scene.shots.length} shots</span>
            </div>
            {scene.shots.map((shot) => (
              <button
                key={shot.id}
                type="button"
                className={`shot-row ${activeShotId === shot.id ? 'active' : ''}`}
                onClick={() => onSelectShot(shot.id)}
              >
                <span>{shot.id}</span>
                <strong>{shot.text}</strong>
              </button>
            ))}
          </section>
        ))}
      </div>
    </aside>
  )
}
