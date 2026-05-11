import type { CSSProperties, ReactNode } from 'react'
import { Captions, Clock, Image, Layers3, Mic2, Sparkles, UserRound, Video } from 'lucide-react'
import { formatDuration } from '../lib/scriptSchema'
import type { TimedShot } from '../lib/timeline'
import type { TimelineAsset, TimelineTrackType, YukkuriProject } from '../types/script'

interface TimelineProps {
  project: YukkuriProject
  timedShots: TimedShot[]
  activeShotId: string
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  onSelectShot: (shotId: string) => void
}

interface Block {
  id: string
  shotId: string
  label: string
  meta?: string
  start: number
  duration: number
  tone: 'scene' | 'shot' | 'asset' | 'voice' | 'telop' | 'effect' | 'character'
}

const laneConfig: Array<{ id: TimelineTrackType | 'scene'; label: string; icon: ReactNode }> = [
  { id: 'scene', label: 'Scenes', icon: <Layers3 size={14} /> },
  { id: 'video', label: 'Video / Image', icon: <Video size={14} /> },
  { id: 'character', label: 'Characters', icon: <UserRound size={14} /> },
  { id: 'voice', label: 'Voice / Audio', icon: <Mic2 size={14} /> },
  { id: 'telop', label: 'Telop', icon: <Captions size={14} /> },
  { id: 'effect', label: 'Effects', icon: <Sparkles size={14} /> },
]

export function Timeline({
  project,
  timedShots,
  activeShotId,
  currentTime,
  duration,
  onSeek,
  onSelectShot,
}: TimelineProps) {
  const pxPerSecond = duration > 90 ? 26 : duration > 45 ? 34 : 48
  const contentWidth = Math.max(980, Math.ceil(Math.max(duration, 1) * pxPerSecond))
  const playheadX = duration > 0 ? Math.min(contentWidth, (currentTime / duration) * contentWidth) : 0
  const tickStep = duration > 120 ? 10 : duration > 60 ? 5 : 1
  const tickCount = Math.max(1, Math.floor(duration / tickStep) + 1)
  const ticks = Array.from({ length: tickCount }, (_, index) => index * tickStep).filter((time) => time <= duration + 0.01)
  const sceneBlocks = buildSceneBlocks(project, timedShots)

  return (
    <footer className="timeline editor-timeline" aria-label="timeline">
      <div className="timeline-head">
        <div className="panel-title small">
          <Clock size={16} />
          Edit Timeline
        </div>
        <span>{formatDuration(currentTime)} / {formatDuration(duration)}</span>
      </div>

      <div
        className="timeline-scroll"
        style={
          {
            '--timeline-width': `${contentWidth}px`,
            '--playhead-x': `${playheadX}px`,
          } as CSSProperties
        }
      >
        <div className="timeline-canvas">
          <div className="editor-ruler-row">
            <div className="editor-ruler-label">
              <Image size={14} />
              Tracks
            </div>
            <div className="editor-ruler-strip">
              <input
                type="range"
                min={0}
                max={Math.max(duration, 0.01)}
                step={0.05}
                value={Math.min(currentTime, duration)}
                onChange={(event) => onSeek(Number(event.target.value))}
                aria-label="timeline scrubber"
              />
              {ticks.map((time) => (
                <span key={time} className="ruler-tick" style={{ left: `${(time / Math.max(duration, 0.01)) * 100}%` }}>
                  {formatDuration(time)}
                </span>
              ))}
              <i className="editor-playhead" />
            </div>
          </div>

          {laneConfig.map((lane) => {
            const blocks =
              lane.id === 'scene'
                ? sceneBlocks
                : lane.id === 'video'
                  ? buildVideoBlocks(timedShots)
                  : lane.id === 'character'
                    ? buildCharacterBlocks(project, timedShots)
                    : lane.id === 'voice'
                      ? buildVoiceBlocks(timedShots)
                      : lane.id === 'telop'
                        ? buildTelopBlocks(timedShots)
                        : buildEffectBlocks(timedShots)

            return (
              <div key={lane.id} className="editor-lane">
                <div className="editor-lane-label">
                  {lane.icon}
                  <span>{lane.label}</span>
                </div>
                <div className="editor-lane-content">
                  {blocks.map((block) => (
                    <button
                      key={block.id}
                      type="button"
                      className={`timeline-block block-${block.tone} ${activeShotId === block.shotId ? 'active' : ''}`}
                      style={blockStyle(block, pxPerSecond)}
                      onClick={() => onSelectShot(block.shotId)}
                      title={`${block.label} / ${formatDuration(block.start)} - ${formatDuration(block.start + block.duration)}`}
                    >
                      <span>{block.label}</span>
                      {block.meta && <small>{block.meta}</small>}
                    </button>
                  ))}
                  <i className="editor-playhead lane-playhead" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </footer>
  )
}

function blockStyle(block: Block, pxPerSecond: number) {
  return {
    left: `${block.start * pxPerSecond}px`,
    width: `${Math.max(54, block.duration * pxPerSecond)}px`,
  } as CSSProperties
}

function buildSceneBlocks(project: YukkuriProject, timedShots: TimedShot[]): Block[] {
  return project.scenes.flatMap((scene) => {
    const shots = timedShots.filter((shot) => shot.sceneId === scene.id)
    const first = shots[0]
    const last = shots.at(-1)
    if (!first || !last) {
      return []
    }
    return {
      id: `scene-${scene.id}`,
      shotId: first.id,
      label: scene.title,
      meta: `${shots.length} cuts`,
      start: first.start,
      duration: last.end - first.start,
      tone: 'scene' as const,
    }
  })
}

function buildVideoBlocks(timedShots: TimedShot[]): Block[] {
  return timedShots.flatMap((shot) => [
    {
      id: `shot-${shot.id}`,
      shotId: shot.id,
      label: shot.id,
      meta: shot.background.type === 'asset' ? shot.background.asset : shot.background.type,
      start: shot.start,
      duration: shot.duration,
      tone: 'shot' as const,
    },
    ...assetBlocks(shot, 'video', 'asset'),
  ])
}

function buildCharacterBlocks(project: YukkuriProject, timedShots: TimedShot[]): Block[] {
  return timedShots.flatMap((shot) => {
    const speaker = project.characters.find((character) => character.id === shot.speakerId)
    return [
      {
        id: `character-${shot.id}`,
        shotId: shot.id,
        label: speaker?.name ?? shot.speakerId,
        meta: shot.layout ?? 'duo',
        start: shot.start,
        duration: shot.duration,
        tone: 'character' as const,
      },
      ...assetBlocks(shot, 'character', 'character'),
    ]
  })
}

function buildVoiceBlocks(timedShots: TimedShot[]): Block[] {
  return timedShots.flatMap((shot) => [
    {
      id: `voice-${shot.id}`,
      shotId: shot.id,
      label: 'AquesTalk',
      meta: shot.text,
      start: shot.start,
      duration: shot.duration,
      tone: 'voice' as const,
    },
    ...assetBlocks(shot, 'voice', 'voice'),
  ])
}

function buildTelopBlocks(timedShots: TimedShot[]): Block[] {
  return timedShots.flatMap((shot) => [
    {
      id: `telop-${shot.id}`,
      shotId: shot.id,
      label: shot.caption?.text ?? shot.text,
      meta: 'caption',
      start: shot.start,
      duration: shot.duration,
      tone: 'telop' as const,
    },
    ...assetBlocks(shot, 'telop', 'telop'),
  ])
}

function buildEffectBlocks(timedShots: TimedShot[]): Block[] {
  return timedShots.flatMap((shot) => {
    const visualBlocks =
      shot.visuals?.map((visual, index) => ({
        id: `visual-${shot.id}-${index}`,
        shotId: shot.id,
        label: visual.title,
        meta: visual.type,
        start: shot.start + Math.min(0.3, shot.duration * 0.15),
        duration: Math.max(0.6, shot.duration - Math.min(0.6, shot.duration * 0.2)),
        tone: 'effect' as const,
      })) ?? []
    return [...visualBlocks, ...assetBlocks(shot, 'effect', 'effect')]
  })
}

function assetBlocks(shot: TimedShot, track: TimelineTrackType, tone: Block['tone']): Block[] {
  const blocks: Block[] = []
  for (const asset of shot.assets ?? []) {
    if (asset.track !== track) {
      continue
    }
    const block = toAssetBlock(shot, asset, tone)
    if (block) {
      blocks.push(block)
    }
  }
  return blocks
}

function toAssetBlock(shot: TimedShot, asset: TimelineAsset, tone: Block['tone']): Block | undefined {
  const localStart = Math.min(asset.start ?? 0, Math.max(0, shot.duration - 0.1))
  const maxDuration = Math.max(0.1, shot.duration - localStart)
  const assetDuration = Math.min(asset.duration ?? maxDuration, maxDuration)

  if (assetDuration <= 0) {
    return undefined
  }

  return {
    id: `asset-${shot.id}-${asset.id}`,
    shotId: shot.id,
    label: asset.label,
    meta: asset.placeholder ? 'placeholder' : asset.type,
    start: shot.start + localStart,
    duration: assetDuration,
    tone,
  }
}
