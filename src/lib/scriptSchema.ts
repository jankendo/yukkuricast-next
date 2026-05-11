import { z } from 'zod'
import type { ValidationResult, YukkuriProject } from '../types/script'

const colorSchema = z
  .string()
  .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, '色は #rrggbb 形式で指定してください')

export const yukkuriProjectSchema = z.object({
  format: z.literal('yukkuricast-script'),
  version: z.literal('1.0'),
  project: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    fps: z.number().int().min(12).max(60).default(30),
    resolution: z.object({
      width: z.number().int().min(640).max(3840),
      height: z.number().int().min(360).max(2160),
    }),
    theme: z.object({
      palette: z.enum(['studio-dark', 'paper-light', 'cyber-classroom']),
      subtitleStyle: z.enum(['pop', 'news', 'minimal']),
      bgm: z.enum(['none', 'soft', 'news', 'tech']).optional(),
    }),
  }),
  characters: z
    .array(
      z.object({
        id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/),
        name: z.string().min(1),
        asset: z.enum(['akari', 'kohaku', 'aoba', 'custom']),
        customAsset: z
          .object({
            id: z.string().min(1),
            label: z.string().min(1),
            filePath: z.string().min(1),
            previewUrl: z.string().optional(),
            importedAt: z.string().optional(),
          })
          .optional(),
        defaultEmotion: z.enum(['neutral', 'happy', 'thinking', 'surprised', 'serious']).optional(),
        side: z.enum(['left', 'right']),
        voice: z.object({
          engine: z.literal('windows-sapi'),
          voiceName: z.string().optional(),
          rate: z.number().int().min(-10).max(10).optional(),
          volume: z.number().int().min(0).max(100).optional(),
        }),
      }),
    )
    .min(1)
    .max(6),
  scenes: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        summary: z.string().optional(),
        background: z.object({
          type: z.enum(['gradient', 'solid', 'grid']),
          from: colorSchema.optional(),
          to: colorSchema.optional(),
          color: colorSchema.optional(),
          accent: colorSchema.optional(),
        }),
        shots: z
          .array(
            z.object({
              id: z.string().min(1),
              speakerId: z.string().min(1),
              text: z.string().min(1),
              duration: z.number().min(1).max(45),
              emotion: z.enum(['neutral', 'happy', 'thinking', 'surprised', 'serious']).optional(),
              layout: z.enum(['duo', 'left-focus', 'right-focus', 'solo-center']).optional(),
              caption: z
                .object({
                  text: z.string().optional(),
                  emphasis: z.array(z.string()).optional(),
                  position: z.enum(['bottom', 'center']).optional(),
                })
                .optional(),
              visuals: z
                .array(
                  z.object({
                    type: z.enum(['image', 'keyword', 'bullet', 'chart', 'code']),
                    title: z.string().min(1),
                    body: z.string().optional(),
                    items: z.array(z.string()).optional(),
                  }),
                )
                .optional(),
              notes: z.string().optional(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
})

export function parseYukkuriProject(content: string): YukkuriProject {
  const parsed = JSON.parse(content)
  const project = yukkuriProjectSchema.parse(parsed) as YukkuriProject
  assertSpeakerReferences(project)
  return project
}

export function validateProject(project: unknown): ValidationResult {
  const result = yukkuriProjectSchema.safeParse(project)
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    }
  }

  try {
    assertSpeakerReferences(result.data as YukkuriProject)
    return { ok: true, errors: [] }
  } catch (error) {
    return { ok: false, errors: [error instanceof Error ? error.message : String(error)] }
  }
}

export function getAllShots(project: YukkuriProject) {
  return project.scenes.flatMap((scene) =>
    scene.shots.map((shot) => ({
      ...shot,
      sceneId: scene.id,
      sceneTitle: scene.title,
      background: scene.background,
    })),
  )
}

export function getProjectDuration(project: YukkuriProject) {
  return getAllShots(project).reduce((total, shot) => total + shot.duration, 0)
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds % 60)
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}

function assertSpeakerReferences(project: YukkuriProject) {
  const characterIds = new Set(project.characters.map((character) => character.id))
  for (const character of project.characters) {
    if (character.asset === 'custom' && !character.customAsset) {
      throw new Error(`character "${character.id}" は customAsset が必要です`)
    }
  }

  for (const scene of project.scenes) {
    for (const shot of scene.shots) {
      if (!characterIds.has(shot.speakerId)) {
        throw new Error(`shot "${shot.id}" の speakerId "${shot.speakerId}" が characters に存在しません`)
      }
    }
  }
}
