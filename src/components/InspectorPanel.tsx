import {
  Download,
  Gauge,
  ImagePlus,
  LockKeyhole,
  Mic2,
  PanelRight,
  Settings2,
  Sparkles,
  Wand2,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import { AQUESTALK_VOICE_PRESETS, BACKGROUND_PRESETS, normalizeAquesTalkPreset } from '../lib/presets'
import type {
  CharacterVoice,
  ExportProgress,
  ExportResult,
  SceneBackground,
  Shot,
  VoiceEngineSettings,
  YukkuriProject,
} from '../types/script'

interface InspectorPanelProps {
  project: YukkuriProject
  shot: Shot
  background: SceneBackground
  exportProgress: ExportProgress
  exportResult: ExportResult | null
  voiceSettings: VoiceEngineSettings
  onConfigureAquesTalk: () => void
  onImportAsset: (speakerId: string) => void
  onSetAquesTalkVoice: (speakerId: string, preset?: string) => void
  onUpdateSpeakerVoice: (speakerId: string, patch: Partial<CharacterVoice>) => void
}

export function InspectorPanel({
  project,
  shot,
  background,
  exportProgress,
  exportResult,
  voiceSettings,
  onConfigureAquesTalk,
  onImportAsset,
  onSetAquesTalkVoice,
  onUpdateSpeakerVoice,
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
            <dd>
              {shot.duration.toFixed(1)}s{'scriptDuration' in shot ? ` / JSON ${(shot.scriptDuration as number).toFixed(1)}s` : ''}
            </dd>
          </div>
          <div>
            <dt>背景</dt>
            <dd>{background.type === 'asset' ? background.asset : background.type}</dd>
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

      <section className="info-group voice-studio">
        <div className="group-heading">
          <Mic2 size={16} />
          Voice Studio
        </div>
        <p className="inspector-text">
          {speaker?.voice.engine === 'aquestalk-player' ? 'AquesTalkPlayer 標準' : 'Windows SAPI'} / preset{' '}
          {normalizeAquesTalkPreset(speaker?.voice.aquestalkPreset)} / volume {speaker?.voice.volume ?? 100}
        </p>
        {speaker?.voice.engine === 'aquestalk-player' && !voiceSettings.aquestalkPlayerPath && (
          <p className="warning-text">AquesTalkPlayer.exe が未設定です。</p>
        )}
        <div className="voice-button-grid">
          <button type="button" className="wide-button accent" disabled={!speaker} onClick={() => speaker && onSetAquesTalkVoice(speaker.id)}>
            <Wand2 size={16} />
            AquesTalk化
          </button>
          <button
            type="button"
            className="wide-button"
            disabled={!speaker}
            onClick={() => speaker && onUpdateSpeakerVoice(speaker.id, { engine: 'windows-sapi' })}
          >
            <Mic2 size={16} />
            SAPI
          </button>
        </div>
        <button type="button" className="wide-button" onClick={onConfigureAquesTalk}>
          AquesTalkPlayer.exe を選択
        </button>
        {speaker && (
          <div className="preset-button-grid" aria-label="AquesTalk presets">
            {AQUESTALK_VOICE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={normalizeAquesTalkPreset(speaker.voice.aquestalkPreset) === preset.preset ? 'preset-chip active' : 'preset-chip'}
                title={preset.description}
                onClick={() => onSetAquesTalkVoice(speaker.id, preset.preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
        {speaker?.voice.engine === 'aquestalk-player' && (
          <label className="field-label">
            プリセット名
            <input
              value={speaker.voice.aquestalkPreset ?? ''}
              placeholder="例: れいむ / まりさ / こいし / さとり"
              onChange={(event) => onUpdateSpeakerVoice(speaker.id, { aquestalkPreset: event.target.value })}
            />
          </label>
        )}
        {voiceSettings.aquestalkPlayerPath && <code className="path-code">{voiceSettings.aquestalkPlayerPath}</code>}
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

      <section className="info-group compact">
        <div className="group-heading">
          <Sparkles size={16} />
          Background Presets
        </div>
        <div className="background-preset-list">
          {BACKGROUND_PRESETS.map((preset) => (
            <span key={preset.id} title={preset.description} style={{ '--preset-accent': preset.accent } as CSSProperties}>
              {preset.label}
            </span>
          ))}
        </div>
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
          <span>User-selected TTS</span>
        </div>
      </section>
    </aside>
  )
}
