import { Clock, Mic2, Subtitles } from 'lucide-react'
import { formatDuration } from '../lib/scriptSchema'
import type { YukkuriProject } from '../types/script'

interface TimelineProps {
  project: YukkuriProject
  activeShotId: string
  onSelectShot: (shotId: string) => void
}

export function Timeline({ project, activeShotId, onSelectShot }: TimelineProps) {
  const totalDuration = project.scenes.reduce(
    (total, scene) => total + scene.shots.reduce((sceneTotal, shot) => sceneTotal + shot.duration, 0),
    0,
  )

  return (
    <footer className="timeline" aria-label="timeline">
      <div className="timeline-head">
        <div className="panel-title small">
          <Clock size={16} />
          Timeline
        </div>
        <span>{formatDuration(totalDuration)}</span>
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
        {project.scenes.flatMap((scene) =>
          scene.shots.map((shot) => (
            <button
              key={shot.id}
              type="button"
              className={`timeline-shot ${activeShotId === shot.id ? 'active' : ''}`}
              style={{ flexGrow: shot.duration, flexBasis: `${shot.duration * 34}px` }}
              onClick={() => onSelectShot(shot.id)}
            >
              <span>{shot.id}</span>
              <strong>{shot.text}</strong>
            </button>
          )),
        )}
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
