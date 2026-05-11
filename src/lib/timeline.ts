import type { SceneBackground, Shot, YukkuriProject } from '../types/script'

export interface TimedShot extends Shot {
  sceneId: string
  sceneTitle: string
  background: SceneBackground
  index: number
  start: number
  end: number
}

export function getTimedShots(project: YukkuriProject): TimedShot[] {
  let cursor = 0
  let index = 0

  return project.scenes.flatMap((scene) =>
    scene.shots.map((shot) => {
      const start = cursor
      const end = start + shot.duration
      cursor = end
      const timedShot: TimedShot = {
        ...shot,
        sceneId: scene.id,
        sceneTitle: scene.title,
        background: scene.background,
        index,
        start,
        end,
      }
      index += 1
      return timedShot
    }),
  )
}

export function getShotAtTime(project: YukkuriProject, time: number) {
  const shots = getTimedShots(project)
  if (shots.length === 0) {
    return undefined
  }

  const bounded = clampTime(time, getProjectTimelineDuration(project))
  return shots.find((shot) => bounded >= shot.start && bounded < shot.end) ?? shots.at(-1)
}

export function getShotStart(project: YukkuriProject, shotId: string) {
  return getTimedShots(project).find((shot) => shot.id === shotId)?.start ?? 0
}

export function getProjectTimelineDuration(project: YukkuriProject) {
  return project.scenes.reduce(
    (total, scene) => total + scene.shots.reduce((sceneTotal, shot) => sceneTotal + shot.duration, 0),
    0,
  )
}

export function clampTime(time: number, duration: number) {
  if (!Number.isFinite(time)) {
    return 0
  }
  return Math.min(Math.max(time, 0), Math.max(duration, 0))
}
