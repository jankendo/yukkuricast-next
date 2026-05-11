import type { CSSProperties } from 'react'
import { characterImageSource } from '../lib/assets'
import type { CharacterProfile, SceneBackground, Shot, YukkuriProject } from '../types/script'

interface PreviewStageProps {
  project: YukkuriProject
  shot: Shot
  background: SceneBackground
}

export function PreviewStage({ project, shot, background }: PreviewStageProps) {
  const speaker = project.characters.find((character) => character.id === shot.speakerId)
  const captionText = shot.caption?.text ?? shot.text

  return (
    <main className="preview-wrap">
      <div className="preview-toolbar">
        <span>Preview</span>
        <span>{project.project.resolution.width} x {project.project.resolution.height}</span>
      </div>
      <section className="stage" style={stageStyle(background)} aria-label="video preview">
        <div className="stage-grid" />
        <VisualCueCard shot={shot} />
        <div className={`character-layer layout-${shot.layout ?? 'duo'}`}>
          {project.characters.map((character) => (
            <CharacterSprite
              key={character.id}
              character={character}
              shot={shot}
              active={character.id === shot.speakerId}
              hidden={shot.layout === 'solo-center' && project.characters.length > 1 && character.id !== shot.speakerId}
            />
          ))}
        </div>
        <div className="caption-box">
          <span className="speaker-name">{speaker?.name ?? shot.speakerId}</span>
          <p>{renderEmphasis(captionText, shot.caption?.emphasis ?? [])}</p>
        </div>
      </section>
    </main>
  )
}

function CharacterSprite({
  character,
  shot,
  active,
  hidden,
}: {
  character: CharacterProfile
  shot: Shot
  active: boolean
  hidden: boolean
}) {
  if (hidden) {
    return null
  }

  const emotion = active ? (shot.emotion ?? character.defaultEmotion ?? 'neutral') : 'neutral'

  return (
    <div className={`character-sprite ${character.side} ${active ? 'speaking' : 'idle'}`}>
      <img src={characterImageSource(character, emotion)} alt={`${character.name} ${emotion}`} />
      <span>{character.name}</span>
    </div>
  )
}

function VisualCueCard({ shot }: { shot: Shot }) {
  const visual = shot.visuals?.[0]
  if (!visual) {
    return null
  }

  return (
    <aside className={`visual-card visual-${visual.type}`}>
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
  if (background.type === 'solid') {
    return {
      background: background.color ?? '#101827',
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
