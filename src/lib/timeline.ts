import type { SceneBackground, Shot, YukkuriProject } from '../types/script'

export interface TimedShot extends Shot {
  sceneId: string
  sceneTitle: string
  background: SceneBackground
  index: number
  start: number
  end: number
  scriptDuration: number
  effectiveDuration: number
}

export type ShotDurationOverrides = ReadonlyMap<string, number> | Record<string, number>

export function getTimedShots(project: YukkuriProject, durationOverrides?: ShotDurationOverrides): TimedShot[] {
  let cursor = 0
  let index = 0

  return project.scenes.flatMap((scene) =>
    scene.shots.map((shot) => {
      const effectiveDuration = resolveShotDuration(shot, durationOverrides)
      const start = cursor
      const end = start + effectiveDuration
      cursor = end
      const timedShot: TimedShot = {
        ...shot,
        duration: effectiveDuration,
        sceneId: scene.id,
        sceneTitle: scene.title,
        background: scene.background,
        index,
        start,
        end,
        scriptDuration: shot.duration,
        effectiveDuration,
      }
      index += 1
      return timedShot
    }),
  )
}

export function getShotAtTime(project: YukkuriProject, time: number, durationOverrides?: ShotDurationOverrides) {
  const shots = getTimedShots(project, durationOverrides)
  if (shots.length === 0) {
    return undefined
  }

  const bounded = clampTime(time, getProjectTimelineDuration(project, durationOverrides))
  return shots.find((shot) => bounded >= shot.start && bounded < shot.end) ?? shots.at(-1)
}

export function getShotStart(project: YukkuriProject, shotId: string, durationOverrides?: ShotDurationOverrides) {
  return getTimedShots(project, durationOverrides).find((shot) => shot.id === shotId)?.start ?? 0
}

export function getProjectTimelineDuration(project: YukkuriProject, durationOverrides?: ShotDurationOverrides) {
  return project.scenes.reduce(
    (total, scene) =>
      total + scene.shots.reduce((sceneTotal, shot) => sceneTotal + resolveShotDuration(shot, durationOverrides), 0),
    0,
  )
}

export function clampTime(time: number, duration: number) {
  if (!Number.isFinite(time)) {
    return 0
  }
  return Math.min(Math.max(time, 0), Math.max(duration, 0))
}

function resolveShotDuration(shot: Shot, durationOverrides?: ShotDurationOverrides) {
  const override = readDurationOverride(durationOverrides, shot.id)
  if (!Number.isFinite(override) || override === undefined) {
    return shot.duration
  }
  return Math.max(shot.duration, override)
}

function readDurationOverride(durationOverrides: ShotDurationOverrides | undefined, shotId: string) {
  if (!durationOverrides) {
    return undefined
  }
  if ('get' in durationOverrides && typeof durationOverrides.get === 'function') {
    return durationOverrides.get(shotId)
  }
  return (durationOverrides as Record<string, number>)[shotId]
}
