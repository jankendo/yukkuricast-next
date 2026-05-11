import type { CSSProperties } from 'react'
import { Clock, Mic2, Subtitles } from 'lucide-react'
import { formatDuration } from '../lib/scriptSchema'
import type { TimedShot } from '../lib/timeline'
import type { YukkuriProject } from '../types/script'

interface TimelineProps {
  project: YukkuriProject
  timedShots: TimedShot[]
  activeShotId: string
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  onSelectShot: (shotId: string) => void
}

export function Timeline({
  project,
  timedShots,
  activeShotId,
  currentTime,
  duration,
  onSeek,
  onSelectShot,
}: TimelineProps) {
  const playhead = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  return (
    <footer className="timeline" aria-label="timeline">
      <div className="timeline-head">
        <div className="panel-title small">
          <Clock size={16} />
          Timeline
        </div>
        <span>{formatDuration(currentTime)} / {formatDuration(duration)}</span>
      </div>

      <div className="timeline-ruler" style={{ '--playhead': `${playhead}%` } as CSSProperties}>
        <input
          type="range"
          min={0}
          max={Math.max(duration, 0.01)}
          step={0.05}
          value={Math.min(currentTime, duration)}
          onChange={(event) => onSeek(Number(event.target.value))}
          aria-label="timeline scrubber"
        />
      </div>

      <div className="timeline-track scene-track">
        {project.scenes.map((scene) => {
          const sceneDuration = scene.shots.reduce((total, shot) => total + shot.duration, 0)
          return (
            <div
              key={scene.id}
              className="scene-segment"
              style={{ flexGrow: sceneDuration, flexBasis: `${sceneDuration * 24}px` }}
            >
              {scene.title}
            </div>
          )
        })}
      </div>

      <div className="timeline-track shot-track">
        {timedShots.map((shot) => {
          const shotProgress =
            currentTime >= shot.end ? 1 : currentTime <= shot.start ? 0 : (currentTime - shot.start) / shot.duration
          return (
            <button
              key={shot.id}
              type="button"
              className={`timeline-shot ${activeShotId === shot.id ? 'active' : ''}`}
              style={
                {
                  flexGrow: shot.duration,
                  flexBasis: `${shot.duration * 34}px`,
                  '--shot-progress': `${Math.round(shotProgress * 100)}%`,
                } as CSSProperties
              }
              onClick={() => onSelectShot(shot.id)}
            >
              <span>{shot.id}</span>
              <strong>{shot.text}</strong>
            </button>
          )
        })}
      </div>

      <div className="timeline-track lane-track">
        <div className="lane-label">
          <Mic2 size={14} />
          voice
        </div>
        <div className="lane-fill" />
        <div className="lane-label">
          <Subtitles size={14} />
          captions
        </div>
        <div className="lane-fill caption" />
      </div>
    </footer>
  )
}
