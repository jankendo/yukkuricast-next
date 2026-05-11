import type { CSSProperties } from 'react'
import { Pause, Play, Square } from 'lucide-react'
import { backgroundAssetUrl, characterImageSource } from '../lib/assets'
import { formatDuration } from '../lib/scriptSchema'
import type { CharacterProfile, SceneBackground, Shot, YukkuriProject } from '../types/script'

interface PreviewStageProps {
  project: YukkuriProject
  shot: Shot
  background: SceneBackground
  currentTime: number
  duration: number
  shotProgress: number
  isPlaying: boolean
  audioStatus: string
  onSeek: (time: number) => void
  onStop: () => void
  onTogglePlayback: () => void
}

export function PreviewStage({
  project,
  shot,
  background,
  currentTime,
  duration,
  shotProgress,
  isPlaying,
  audioStatus,
  onSeek,
  onStop,
  onTogglePlayback,
}: PreviewStageProps) {
  const speaker = project.characters.find((character) => character.id === shot.speakerId)
  const captionText = shot.caption?.text ?? shot.text

  return (
    <main className="preview-wrap">
      <div className="preview-toolbar">
        <div>
          <span>Preview</span>
          <strong>{formatDuration(currentTime)} / {formatDuration(duration)}</strong>
        </div>
        <span>{project.project.resolution.width} x {project.project.resolution.height}</span>
      </div>
      <section
        className={`stage stage-${background.type} ${background.type === 'asset' ? `stage-asset-${background.asset ?? 'classroom-board'}` : ''}`}
        style={stageStyle(background)}
        aria-label="video preview"
      >
        <div className="stage-grid" />
        <div className="stage-playhead" style={{ width: `${Math.round(shotProgress * 100)}%` }} />
        <VisualCueCard shot={shot} progress={shotProgress} />
        <div className={`character-layer layout-${shot.layout ?? 'duo'}`}>
          {project.characters.map((character) => (
            <CharacterSprite
              key={character.id}
              character={character}
              shot={shot}
              active={character.id === shot.speakerId}
              hidden={shot.layout === 'solo-center' && project.characters.length > 1 && character.id !== shot.speakerId}
              isPlaying={isPlaying}
            />
          ))}
        </div>
        <div className="caption-box">
          <span className="speaker-name">{speaker?.name ?? shot.speakerId}</span>
          <p>{renderEmphasis(captionText, shot.caption?.emphasis ?? [])}</p>
        </div>
      </section>

      <div className="preview-console">
        <div className="preview-controls" aria-label="preview controls">
          <button type="button" className="icon-button" onClick={onTogglePlayback} title={isPlaying ? '一時停止' : '再生'}>
            {isPlaying ? <Pause size={17} /> : <Play size={17} />}
          </button>
          <button type="button" className="icon-button" onClick={onStop} title="停止">
            <Square size={15} />
          </button>
        </div>
        <input
          className="preview-scrubber"
          type="range"
          min={0}
          max={Math.max(duration, 0.01)}
          step={0.05}
          value={Math.min(currentTime, duration)}
          onChange={(event) => onSeek(Number(event.target.value))}
          aria-label="preview time"
        />
        <div className="audio-status">{audioStatus}</div>
      </div>
    </main>
  )
}

function CharacterSprite({
  character,
  shot,
  active,
  hidden,
  isPlaying,
}: {
  character: CharacterProfile
  shot: Shot
  active: boolean
  hidden: boolean
  isPlaying: boolean
}) {
  if (hidden) {
    return null
  }

  const emotion = active ? (shot.emotion ?? character.defaultEmotion ?? 'neutral') : 'neutral'

  return (
    <div className={`character-sprite ${character.side} ${active ? 'speaking' : 'idle'} ${isPlaying && active ? 'talking' : ''}`}>
      <img src={characterImageSource(character, emotion)} alt={`${character.name} ${emotion}`} />
      <span>{character.name}</span>
    </div>
  )
}

function VisualCueCard({ shot, progress }: { shot: Shot; progress: number }) {
  const visual = shot.visuals?.[0]
  if (!visual) {
    return null
  }

  return (
    <aside
      className={`visual-card visual-${visual.type}`}
      style={{ '--visual-progress': `${Math.round(progress * 100)}%` } as CSSProperties}
    >
      <div className="visual-type">{visual.type}</div>
      <h3>{visual.title}</h3>
      {visual.body && <p>{visual.body}</p>}
      {visual.items && (
        <ol>
          {visual.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      )}
    </aside>
  )
}

function renderEmphasis(text: string, words: string[]) {
  if (words.length === 0) {
    return text
  }

  const escaped = words.map(escapeRegExp).filter(Boolean)
  if (escaped.length === 0) {
    return text
  }

  const regex = new RegExp(`(${escaped.join('|')})`, 'g')
  return text.split(regex).map((part, index) =>
    words.includes(part) ? (
      <mark key={`${part}-${index}`}>{part}</mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  )
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stageStyle(background: SceneBackground) {
  if (background.type === 'asset') {
    return {
      backgroundImage: `url("${backgroundAssetUrl(background.asset ?? 'classroom-board')}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      '--stage-accent': background.accent ?? '#35d0ff',
    } as CSSProperties
  }

  if (background.type === 'solid') {
    return {
      background: background.color ?? '#101827',
      '--stage-accent': background.accent ?? '#35d0ff',
    }
  }

  const from = background.from ?? '#101827'
  const to = background.to ?? '#1f2a44'
  const accent = background.accent ?? '#35d0ff'

  if (background.type === 'grid') {
    return {
      background: `linear-gradient(135deg, ${from}, ${to})`,
      '--stage-accent': accent,
    } as CSSProperties
  }

  return {
    background: `radial-gradient(circle at 18% 18%, ${accent}22, transparent 28%), linear-gradient(135deg, ${from}, ${to})`,
    '--stage-accent': accent,
  } as CSSProperties
}
