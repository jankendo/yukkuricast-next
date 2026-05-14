import type { CSSProperties } from 'react'
import { Pause, Play, Square } from 'lucide-react'
import { backgroundAssetUrl, characterImageSource, effectAssetUrl } from '../lib/assets'
import { formatDuration } from '../lib/scriptSchema'
import type { CharacterProfile, EffectAsset, SceneBackground, Shot, TimelineAsset, YukkuriProject } from '../types/script'

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
  const captionText = shot.caption?.text?.trim() || shot.text

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
        <RetentionStrip project={project} shot={shot} />
        <VisualCueCard shot={shot} progress={shotProgress} />
        <MediaPlaceholders shot={shot} />
        <EffectLayer shot={shot} />
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

const effectAssets = new Set<EffectAsset>([
  'speed-lines',
  'impact-burst',
  'question-pop',
  'chapter-wipe',
  'highlight-ring',
  'sparkle-trail',
  'danger-stripe',
  'source-note',
])

function RetentionStrip({ project, shot }: { project: YukkuriProject; shot: Shot }) {
  const retention = shot.retention
  const beat = retention?.beat ?? 'evidence'
  const chapter = retention?.chapterLabel ?? project.project.growth?.coreQuestion ?? 'Retention beat'
  const question = retention?.viewerQuestion ?? project.project.growth?.viewerPromise

  return (
    <div className="retention-strip" aria-label="retention design">
      <div className="retention-main">
        <span className={`retention-beat beat-${beat}`}>{retentionBeatLabel(beat)}</span>
        <strong>{chapter}</strong>
      </div>
      {question && <p>{question}</p>}
      {(retention?.sourceNote || retention?.nextCuriosity) && (
        <div className="retention-subrow">
          {retention.sourceNote && <span>{retention.sourceNote}</span>}
          {retention.nextCuriosity && <span>NEXT: {retention.nextCuriosity}</span>}
        </div>
      )}
    </div>
  )
}

function MediaPlaceholders({ shot }: { shot: Shot }) {
  const assets =
    shot.assets?.filter((asset) => asset.track === 'video' && ['placeholder', 'image', 'video'].includes(asset.type)) ?? []
  if (assets.length === 0) {
    return null
  }

  return (
    <div className="media-placeholder-layer" aria-label="shot media placeholders">
      {assets.slice(0, 3).map((asset) => (
        <div
          key={asset.id}
          className={`media-placeholder placeholder-${asset.position ?? 'main-left'}`}
          style={{ opacity: asset.opacity ?? 1 }}
        >
          <span>差し替え画像</span>
          <strong>{asset.label}</strong>
          {asset.notes && <small>{asset.notes}</small>}
        </div>
      ))}
    </div>
  )
}

function EffectLayer({ shot }: { shot: Shot }) {
  const effects = (shot.assets ?? [])
    .filter((asset) => asset.track === 'effect' && asset.type === 'effect')
    .map((asset) => ({ asset, effect: resolveEffectAsset(asset) }))
    .filter((entry): entry is { asset: TimelineAsset; effect: EffectAsset } => Boolean(entry.effect))

  if (effects.length === 0) {
    return null
  }

  return (
    <div className="stage-effect-layer" aria-label="shot effect assets">
      {effects.slice(0, 3).map(({ asset, effect }) => (
        <img
          key={`${asset.id}-${effect}`}
          className={`stage-effect effect-${effect}`}
          src={effectAssetUrl(effect)}
          alt=""
          style={{ opacity: asset.opacity ?? 0.72 }}
        />
      ))}
    </div>
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

function resolveEffectAsset(asset: TimelineAsset): EffectAsset | undefined {
  if (asset.effect && effectAssets.has(asset.effect)) {
    return asset.effect
  }

  const source = asset.source?.startsWith('effect:') ? asset.source.slice('effect:'.length) : asset.source
  if (source && effectAssets.has(source as EffectAsset)) {
    return source as EffectAsset
  }

  for (const effect of effectAssets) {
    if (asset.id.includes(effect)) {
      return effect
    }
  }

  return undefined
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
      <div className="visual-type">{visualTypeLabel(visual.type)}</div>
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

function retentionBeatLabel(beat: NonNullable<Shot['retention']>['beat']) {
  switch (beat) {
    case 'hook':
      return 'HOOK'
    case 'viewer-benefit':
      return 'BENEFIT'
    case 'question':
      return 'QUESTION'
    case 'early-payoff':
      return 'PAYOFF'
    case 'background':
      return 'CONTEXT'
    case 'twist':
      return 'TWIST'
    case 'climax':
      return 'CLIMAX'
    case 'summary':
      return 'SUMMARY'
    case 'next-video':
      return 'NEXT'
    case 'evidence':
    default:
      return 'EVIDENCE'
  }
}

function visualTypeLabel(type: NonNullable<Shot['visuals']>[number]['type']) {
  switch (type) {
    case 'question':
      return 'QUESTION'
    case 'timeline':
      return 'TIMELINE'
    case 'comparison':
      return 'COMPARE'
    case 'source':
      return 'SOURCE'
    case 'map':
      return 'MAP'
    case 'chapter':
      return 'CHAPTER'
    default:
      return type.toUpperCase()
  }
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
