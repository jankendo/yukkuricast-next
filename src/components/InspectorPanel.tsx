import { Download, Gauge, ImagePlus, LockKeyhole, Mic2, PanelRight, Settings2, Sparkles } from 'lucide-react'
import type { ExportProgress, ExportResult, SceneBackground, Shot, YukkuriProject } from '../types/script'

interface InspectorPanelProps {
  project: YukkuriProject
  shot: Shot
  background: SceneBackground
  exportProgress: ExportProgress
  exportResult: ExportResult | null
  onImportAsset: (speakerId: string) => void
}

export function InspectorPanel({
  project,
  shot,
  background,
  exportProgress,
  exportResult,
  onImportAsset,
}: InspectorPanelProps) {
  const speaker = project.characters.find((character) => character.id === shot.speakerId)

  return (
    <aside className="panel inspector" aria-label="inspector">
      <div className="panel-title">
        <PanelRight size={17} />
        Inspector
      </div>

      <section className="info-group">
        <div className="group-heading">
          <Settings2 size={16} />
          Shot
        </div>
        <dl>
          <div>
            <dt>ID</dt>
            <dd>{shot.id}</dd>
          </div>
          <div>
            <dt>話者</dt>
            <dd>{speaker?.name ?? shot.speakerId}</dd>
          </div>
          <div>
            <dt>表情</dt>
            <dd>{shot.emotion ?? speaker?.defaultEmotion ?? 'neutral'}</dd>
          </div>
          <div>
            <dt>秒数</dt>
            <dd>{shot.duration.toFixed(1)}s</dd>
          </div>
          <div>
            <dt>背景</dt>
            <dd>{background.type}</dd>
          </div>
        </dl>
      </section>

      <section className="info-group">
        <div className="group-heading">
          <Sparkles size={16} />
          Subtitle
        </div>
        <p className="inspector-text">{shot.text}</p>
        {shot.caption?.emphasis && (
          <div className="chips">
            {shot.caption.emphasis.map((word) => (
              <span key={word}>{word}</span>
            ))}
          </div>
        )}
      </section>

      <section className="info-group">
        <div className="group-heading">
          <Mic2 size={16} />
          Voice
        </div>
        <p className="inspector-text">
          Windows SAPI / rate {speaker?.voice.rate ?? 0} / volume {speaker?.voice.volume ?? 100}
        </p>
      </section>

      <section className="info-group asset-import-box">
        <div className="group-heading">
          <ImagePlus size={16} />
          Character Asset
        </div>
        <p className="inspector-text">
          {speaker?.asset === 'custom'
            ? `ユーザー素材: ${speaker.customAsset?.label ?? 'custom'}`
            : `同梱素材: ${speaker?.asset ?? 'unknown'}`}
        </p>
        <button
          type="button"
          className="wide-button accent"
          disabled={!speaker}
          onClick={() => speaker && onImportAsset(speaker.id)}
        >
          <ImagePlus size={16} />
          話者素材を取り込む
        </button>
      </section>

      <section className="export-box">
        <div className="group-heading">
          <Download size={16} />
          Export
        </div>
        <div className="progress-line">
          <span>{exportProgress.phase}</span>
          <strong>{Math.round(exportProgress.percent)}%</strong>
        </div>
        <div className="progress-bar">
          <span style={{ width: `${exportProgress.percent}%` }} />
        </div>
        <p>{exportProgress.message}</p>
        {exportResult?.outputPath && <code>{exportResult.outputPath}</code>}
        {exportResult?.error && <p className="error-text">{exportResult.error}</p>}
      </section>

      <section className="info-group compact">
        <div className="group-heading">
          <Gauge size={16} />
          Project
        </div>
        <dl>
          <div>
            <dt>解像度</dt>
            <dd>{project.project.resolution.width}x{project.project.resolution.height}</dd>
          </div>
          <div>
            <dt>テーマ</dt>
            <dd>{project.project.theme.palette}</dd>
          </div>
        </dl>
      </section>

      <section className="info-group compact security-stack">
        <div className="group-heading">
          <LockKeyhole size={16} />
          Security
        </div>
        <div className="security-pills">
          <span>CSP</span>
          <span>Sandbox</span>
          <span>Local assets</span>
          <span>No Node in UI</span>
        </div>
      </section>
    </aside>
  )
}
