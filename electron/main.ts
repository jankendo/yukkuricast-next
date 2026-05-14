import { app, BrowserWindow, clipboard, dialog, ipcMain, protocol, session } from 'electron'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { normalizeAquesTalkPreset } from '../src/lib/presets'
import {
  BUILTIN_READING_DICTIONARY,
  BUILTIN_READING_DICTIONARY_VERSION,
  applyReadingDictionary,
  buildEffectiveReadingDictionary,
  sanitizeReadingDictionaryEntries,
  sanitizeReadingDictionaryEntry,
} from '../src/lib/readingDictionary'
import { getAllShots, yukkuriProjectSchema } from '../src/lib/scriptSchema'
import type {
  CharacterProfile,
  CustomCharacterAsset,
  ExportProgress,
  ProjectExportSettings,
  ReadingDictionaryEntry,
  SceneBackground,
  Shot,
  VoiceEngineSettings,
  YukkuriProject,
} from '../src/types/script'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)
const allowedAssetExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg'])
const maxImportedAssetBytes = 20 * 1024 * 1024
const settingsFileName = 'settings.json'
const audioTailPaddingSeconds = 0.18
const defaultAudioSampleRate = 48000
const defaultAudioBitrate = '192k'
const defaultVideoBitrate = '8M'
const bundledAquesTalkPlayerCandidates = [
  'D:\\user\\Download\\aquestalkplayer_20250606\\aquestalkplayer\\AquesTalkPlayer.exe',
]

interface AudioRenderResult {
  duration: number
}

type VideoEncoderMode = 'software' | 'nvenc' | 'qsv' | 'amf'

interface RenderOptions {
  encoder: VideoEncoderMode
  codec: 'libx264' | 'h264_nvenc' | 'h264_qsv' | 'h264_amf'
  label: string
  videoBitrate: string
  audioBitrate: string
  audioSampleRate: 44100 | 48000
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'yukkuri-asset',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
    },
  },
])

let mainWindow: BrowserWindow | null = null
const renderSampleIndex = process.argv.indexOf('--render-sample')
const renderJsonIndex = process.argv.indexOf('--render-json')

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 940,
    minWidth: 1120,
    minHeight: 760,
    backgroundColor: '#0b1118',
    title: 'YukkuriCast Next',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  })

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowedOrigin = isDev ? process.env.VITE_DEV_SERVER_URL : undefined
    if (allowedOrigin && url.startsWith(allowedOrigin)) {
      return
    }
    if (!isDev && url.startsWith('file://')) {
      return
    }
    event.preventDefault()
  })

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

if (renderSampleIndex >= 0 || renderJsonIndex >= 0) {
  app
    .whenReady()
    .then(async () => {
      const inputPath =
        renderJsonIndex >= 0
          ? process.argv[renderJsonIndex + 1]
          : path.join(process.cwd(), 'examples', 'explainer.sample.json')
      const outputPath =
        renderJsonIndex >= 0
          ? (process.argv[renderJsonIndex + 2] ?? path.join(process.cwd(), 'render-output.mp4'))
          : (process.argv[renderSampleIndex + 1] ?? path.join(process.cwd(), 'sample-output.mp4'))
      const project = yukkuriProjectSchema.parse(JSON.parse(await readFile(inputPath, 'utf8'))) as YukkuriProject
      assertSpeakerReferences(project)
      await exportProject(project, outputPath, (progress) => {
        console.log(`${progress.phase} ${progress.percent}% ${progress.message}`)
      })
      app.exit(0)
    })
    .catch((error) => {
      console.error(error)
      app.exit(1)
    })
} else {
  app.whenReady().then(() => {
    installSecurityGuards()
    installAssetProtocol()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function installSecurityGuards() {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false)
  })

  session.defaultSession.setPermissionCheckHandler(() => false)

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: file: yukkuri-asset:; media-src 'self' data: file: yukkuri-asset:; font-src 'self' data:; connect-src 'self' http://127.0.0.1:* ws://127.0.0.1:*; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'",
        ],
        'X-Content-Type-Options': ['nosniff'],
      },
    })
  })
}

function installAssetProtocol() {
  protocol.handle('yukkuri-asset', async (request) => {
    const url = new URL(request.url)
    if (url.hostname !== 'custom') {
      return new Response('Not found', { status: 404 })
    }

    const assetId = path.basename(decodeURIComponent(url.pathname.replace(/^\//, '')))
    if (!/^[a-f0-9-]+\.png$/i.test(assetId)) {
      return new Response('Invalid asset id', { status: 400 })
    }

    const assetPath = path.join(customAssetDir(), assetId)
    const resolvedDir = path.resolve(customAssetDir())
    const resolvedPath = path.resolve(assetPath)
    if (!resolvedPath.startsWith(resolvedDir + path.sep)) {
      return new Response('Forbidden', { status: 403 })
    }

    return netFetchFile(assetPath)
  })
}

ipcMain.handle('script:open', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'YukkuriCast JSON を読み込む',
    properties: ['openFile'],
    filters: [{ name: 'YukkuriCast JSON', extensions: ['json'] }],
  })

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true }
  }

  const filePath = result.filePaths[0]
  const content = await readFile(filePath, 'utf8')
  return { canceled: false, path: filePath, content }
})

ipcMain.handle('script:save', async (_event, content: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: 'YukkuriCast JSON を保存',
    defaultPath: 'yukkuricast-script.json',
    filters: [{ name: 'YukkuriCast JSON', extensions: ['json'] }],
  })

  if (result.canceled || !result.filePath) {
    return { canceled: true }
  }

  await writeFile(result.filePath, content, 'utf8')
  return { canceled: false, path: result.filePath, content }
})

ipcMain.handle('clipboard:write-text', async (_event, content: string) => {
  if (typeof content !== 'string' || content.length > 120_000) {
    throw new Error('コピーできるテキストは 120KB までです。')
  }
  clipboard.writeText(content)
  return { ok: true }
})

ipcMain.handle('asset:import-character', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: '話者素材を取り込む',
      properties: ['openFile'],
      filters: [
        {
          name: 'Character image',
          extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg'],
        },
      ],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true }
    }

    const imported = await importCharacterAsset(result.filePaths[0])
    return { canceled: false, asset: imported }
  } catch (error) {
    return {
      canceled: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
})

ipcMain.handle('voice:get-settings', async () => readVoiceSettings())

ipcMain.handle('voice:select-aquestalk-player', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'AquesTalkPlayer.exe を選択',
      properties: ['openFile'],
      filters: [{ name: 'AquesTalkPlayer', extensions: ['exe'] }],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true }
    }

    const exePath = result.filePaths[0]
    await validateAquesTalkPlayerPath(exePath)
    const settings = await saveVoiceSettings({
      ...(await readVoiceSettings()),
      aquestalkPlayerPath: exePath,
      updatedAt: new Date().toISOString(),
    })
    return { canceled: false, settings }
  } catch (error) {
    return {
      canceled: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
})

ipcMain.handle('voice:add-reading-dictionary-entry', async (_event, surface: string, reading: string) => {
  try {
    const entry = sanitizeReadingDictionaryEntry({
      id: randomUUID(),
      surface,
      reading,
      enabled: true,
      source: 'user',
    })
    if (!entry) {
      throw new Error('表記と読みを入力してください。')
    }
    const settings = await readVoiceSettings()
    const existing = sanitizeReadingDictionaryEntries(settings.readingDictionary)
    const nextEntries = [
      ...existing.filter(
        (candidate) => candidate.surface.toLowerCase() !== entry.surface.toLowerCase(),
      ),
      entry,
    ]
    const saved = await saveVoiceSettings({
      ...settings,
      readingDictionary: nextEntries,
      updatedAt: new Date().toISOString(),
    })
    return { canceled: false, settings: saved }
  } catch (error) {
    return {
      canceled: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
})

ipcMain.handle('voice:remove-reading-dictionary-entry', async (_event, id: string) => {
  try {
    const settings = await readVoiceSettings()
    const nextEntries = sanitizeReadingDictionaryEntries(settings.readingDictionary).filter((entry) => entry.id !== id)
    const saved = await saveVoiceSettings({
      ...settings,
      readingDictionary: nextEntries,
      updatedAt: new Date().toISOString(),
    })
    return { canceled: false, settings: saved }
  } catch (error) {
    return {
      canceled: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
})

ipcMain.handle('preview:render-audio', async (_event, rawProject: YukkuriProject, shotId: string) => {
  const workspace = path.join(app.getPath('temp'), 'yukkuricast-next-preview', randomUUID())
  const rawOutputPath = path.join(workspace, `${safeFileName(shotId)}.raw.wav`)
  const outputPath = path.join(workspace, `${safeFileName(shotId)}.preview.wav`)

  try {
    const project = yukkuriProjectSchema.parse(rawProject) as YukkuriProject
    assertSpeakerReferences(project)
    const ffmpegPath = resolveFfmpegPath()
    const audioSampleRate = project.project.export?.audioSampleRate ?? defaultAudioSampleRate
    const readingDictionary = await resolveReadingDictionary(project)
    const shot = getAllShots(project).find((candidate) => candidate.id === shotId)
    if (!shot) {
      throw new Error(`preview shot not found: ${shotId}`)
    }

    const speaker = project.characters.find((character) => character.id === shot.speakerId)
    if (!speaker) {
      throw new Error(`speaker not found: ${shot.speakerId}`)
    }

    await mkdir(workspace, { recursive: true })
    const voice = await synthesizeVoice(shot.text, speaker, rawOutputPath, shot.duration, ffmpegPath, readingDictionary)
    const effectiveDuration = normalizeDuration(Math.max(shot.duration, voice.duration + audioTailPaddingSeconds))
    await normalizeVoiceWav(ffmpegPath, rawOutputPath, outputPath, effectiveDuration, audioSampleRate)
    const wav = await readFile(outputPath)
    return {
      ok: true,
      audioUrl: `data:audio/wav;base64,${wav.toString('base64')}`,
      duration: effectiveDuration,
      engine: speaker.voice.engine,
      message: `${voiceEngineLabel(speaker.voice.engine)} preview ready (${voice.duration.toFixed(2)}s)`,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

ipcMain.handle('preview:render-timeline-audio', async (_event, rawProject: YukkuriProject) => {
  const workspace = path.join(app.getPath('temp'), 'yukkuricast-next-preview-timeline', randomUUID())
  const outputPath = path.join(workspace, 'timeline.preview.wav')

  try {
    const project = yukkuriProjectSchema.parse(rawProject) as YukkuriProject
    assertSpeakerReferences(project)
    const ffmpegPath = resolveFfmpegPath()
    const audioSampleRate = project.project.export?.audioSampleRate ?? defaultAudioSampleRate
    const readingDictionary = await resolveReadingDictionary(project)

    await mkdir(workspace, { recursive: true })
    const rendered = await synthesizeTimelineAudio(project, workspace, outputPath, ffmpegPath, audioSampleRate, readingDictionary)
    const wav = await readFile(outputPath)

    return {
      ok: true,
      audioUrl: `data:audio/wav;base64,${wav.toString('base64')}`,
      duration: rendered.duration,
      shotDurations: rendered.shotDurations,
      engineSummary: rendered.engineSummary,
      message: `${rendered.engineSummary} / ${rendered.duration.toFixed(2)}s continuous preview`,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

ipcMain.handle('video:export', async (event, rawProject: YukkuriProject) => {
  try {
    const project = yukkuriProjectSchema.parse(rawProject) as YukkuriProject
    assertSpeakerReferences(project)

    const saveResult = await dialog.showSaveDialog(mainWindow!, {
      title: 'MP4 を書き出す',
      defaultPath: `${safeFileName(project.project.title)}.mp4`,
      filters: [{ name: 'MP4 Video', extensions: ['mp4'] }],
    })

    if (saveResult.canceled || !saveResult.filePath) {
      return { ok: false, error: '書き出しをキャンセルしました。' }
    }

    await exportProject(project, saveResult.filePath, (progress) => {
      event.sender.send('video:export-progress', progress)
    })

    return { ok: true, outputPath: saveResult.filePath }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    event.sender.send('video:export-progress', {
      phase: 'error',
      message,
      percent: 100,
    } satisfies ExportProgress)
    return { ok: false, error: message }
  }
})

async function exportProject(
  project: YukkuriProject,
  outputPath: string,
  progress: (progress: ExportProgress) => void,
) {
  const shots = getAllShots(project)
  const workspace = path.join(app.getPath('temp'), 'yukkuricast-next', randomUUID())
  const ffmpegPath = resolveFfmpegPath()
  const clips: string[] = []
  const totalSteps = shots.length * 4 + 2
  let step = 0

  await mkdir(workspace, { recursive: true })
  progress({ phase: 'prepare', message: `作業フォルダを作成しました: ${workspace}`, percent: 2 })

  try {
    const renderOptions = await resolveRenderOptions(ffmpegPath, project.project.export, workspace, progress)
    const readingDictionary = await resolveReadingDictionary(project)

    for (let index = 0; index < shots.length; index += 1) {
      const shot = shots[index]
      const base = `${String(index + 1).padStart(3, '0')}-${safeFileName(shot.id)}`
      const rawVoicePath = path.join(workspace, `${base}.raw.wav`)
      const voicePath = path.join(workspace, `${base}.normalized.wav`)
      const framePath = path.join(workspace, `${base}.png`)
      const clipPath = path.join(workspace, `${base}.mp4`)
      const speaker = project.characters.find((character) => character.id === shot.speakerId)!

      progress({
        phase: 'voice',
        message: `${shot.id}: ${voiceEngineLabel(speaker.voice.engine)} 音声を生成中`,
        percent: percent(++step, totalSteps),
      })
      const voice = await synthesizeVoice(shot.text, speaker, rawVoicePath, shot.duration, ffmpegPath, readingDictionary)
      const clipDuration = normalizeDuration(Math.max(shot.duration, voice.duration + audioTailPaddingSeconds))

      progress({
        phase: 'voice',
        message: `${shot.id}: 48kHz/stereo WAV に正規化中 (${clipDuration.toFixed(2)}s)`,
        percent: percent(++step, totalSteps),
      })
      await normalizeVoiceWav(ffmpegPath, rawVoicePath, voicePath, clipDuration, renderOptions.audioSampleRate)

      progress({
        phase: 'frame',
        message: `${shot.id}: 画像フレームを生成中 (${clipDuration.toFixed(2)}s)`,
        percent: percent(++step, totalSteps),
      })
      await renderFrame(project, shot, shot.background, framePath)

      progress({
        phase: 'clip',
        message:
          clipDuration > shot.duration + 0.05
            ? `${shot.id}: 音声尺に合わせて ${shot.duration.toFixed(2)}s -> ${clipDuration.toFixed(2)}s に延長`
            : `${shot.id}: MP4 クリップを生成中 (${renderOptions.label})`,
        percent: percent(++step, totalSteps),
      })
      await makeClip(ffmpegPath, framePath, voicePath, clipDuration, project.project.fps, clipPath, renderOptions)
      clips.push(clipPath)
    }

    progress({
      phase: 'concat',
      message: 'すべてのクリップを連結し、AAC音声を連続タイムラインとして再生成中',
      percent: percent(step, totalSteps),
    })
    await concatClips(ffmpegPath, clips, outputPath, workspace, renderOptions)

    progress({
      phase: 'done',
      message: `MP4 を書き出しました: ${outputPath}`,
      percent: 100,
    })
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
}

async function importCharacterAsset(sourcePath: string): Promise<CustomCharacterAsset> {
  const extension = path.extname(sourcePath).toLowerCase()
  if (!allowedAssetExtensions.has(extension)) {
    throw new Error('png, jpg, jpeg, webp, svg のみ取り込めます。')
  }

  const fileStat = await stat(sourcePath)
  if (!fileStat.isFile()) {
    throw new Error('ファイルだけを取り込めます。')
  }
  if (fileStat.size > maxImportedAssetBytes) {
    throw new Error('素材は 20MB 以下にしてください。')
  }

  await mkdir(customAssetDir(), { recursive: true })
  const assetId = `${randomUUID()}.png`
  const outputPath = path.join(customAssetDir(), assetId)

  await sharp(sourcePath, { limitInputPixels: 42_000_000 })
    .resize({
      width: 1200,
      height: 1200,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath)

  return {
    id: assetId,
    label: path.basename(sourcePath),
    filePath: outputPath,
    previewUrl: `yukkuri-asset://custom/${assetId}`,
    importedAt: new Date().toISOString(),
  }
}

async function synthesizeVoice(
  text: string,
  speaker: CharacterProfile,
  outputPath: string,
  duration: number,
  ffmpegPath: string,
  readingDictionary: ReadingDictionaryEntry[],
): Promise<AudioRenderResult> {
  const spokenText = applyReadingDictionary(text, readingDictionary)
  if (speaker.voice.engine === 'aquestalk-player') {
    await synthesizeWithAquesTalkPlayer(spokenText, speaker, outputPath)
    return { duration: await readWavDurationSeconds(outputPath, duration) }
  }

  if (process.platform !== 'win32') {
    await makeSilence(ffmpegPath, outputPath, duration, defaultAudioSampleRate)
    return { duration }
  }

  const rate = clamp(speaker.voice.rate ?? 0, -10, 10)
  const volume = clamp(speaker.voice.volume ?? 100, 0, 100)
  const voiceSelection = speaker.voice.voiceName
    ? `$synth.SelectVoice(${powerShellString(speaker.voice.voiceName)})`
    : ''
  const script = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = ${rate}
$synth.Volume = ${volume}
${voiceSelection}
$synth.SetOutputToWaveFile(${powerShellString(outputPath)})
$synth.Speak(${powerShellString(spokenText)})
$synth.Dispose()
`

  try {
    await runProcess('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script])
    return { duration: await readWavDurationSeconds(outputPath, duration) }
  } catch {
    await makeSilence(ffmpegPath, outputPath, duration, defaultAudioSampleRate)
    return { duration }
  }
}

async function synthesizeTimelineAudio(
  project: YukkuriProject,
  workspace: string,
  outputPath: string,
  ffmpegPath: string,
  audioSampleRate: 44100 | 48000,
  readingDictionary: ReadingDictionaryEntry[],
) {
  const shots = getAllShots(project)
  const voicePaths: string[] = []
  const shotDurations: Record<string, number> = {}
  const engines = new Set<string>()

  for (let index = 0; index < shots.length; index += 1) {
    const shot = shots[index]
    const base = `${String(index + 1).padStart(3, '0')}-${safeFileName(shot.id)}`
    const rawVoicePath = path.join(workspace, `${base}.raw.wav`)
    const normalizedVoicePath = path.join(workspace, `${base}.timeline.wav`)
    const speaker = project.characters.find((character) => character.id === shot.speakerId)
    if (!speaker) {
      throw new Error(`speaker not found: ${shot.speakerId}`)
    }

    engines.add(voiceEngineLabel(speaker.voice.engine))
    const voice = await synthesizeVoice(shot.text, speaker, rawVoicePath, shot.duration, ffmpegPath, readingDictionary)
    const clipDuration = normalizeDuration(Math.max(shot.duration, voice.duration + audioTailPaddingSeconds))
    await normalizeVoiceWav(ffmpegPath, rawVoicePath, normalizedVoicePath, clipDuration, audioSampleRate)
    voicePaths.push(normalizedVoicePath)
    shotDurations[shot.id] = clipDuration
  }

  await concatAudioWavs(ffmpegPath, voicePaths, outputPath, workspace, audioSampleRate)

  return {
    duration: Object.values(shotDurations).reduce((total, value) => total + value, 0),
    shotDurations,
    engineSummary: Array.from(engines).join(' + '),
  }
}

async function synthesizeWithAquesTalkPlayer(text: string, speaker: CharacterProfile, outputPath: string) {
  if (process.platform !== 'win32') {
    throw new Error('AquesTalkPlayer は Windows 版アプリで利用してください。')
  }

  const settings = await readVoiceSettings()
  const exePath = settings.aquestalkPlayerPath
  if (!exePath) {
    throw new Error('AquesTalkPlayer.exe が未設定です。Inspector の Voice から選択してください。')
  }

  const resolvedExePath = await validateAquesTalkPlayerPath(exePath)
  await mkdir(path.dirname(outputPath), { recursive: true })
  const args = ['/P', normalizeAquesTalkPreset(speaker.voice.aquestalkPreset), '/T', text, '/W', path.resolve(outputPath)]
  await runAquesTalkPlayer(resolvedExePath, args)

  const result = await stat(outputPath).catch(() => undefined)
  if (!result || result.size === 0) {
    throw new Error(
      `AquesTalkPlayer の WAV 出力が作成されませんでした。preset=${normalizeAquesTalkPreset(
        speaker.voice.aquestalkPreset,
      )} とライセンス設定を確認してください。`,
    )
  }
}

async function runAquesTalkPlayer(exePath: string, args: string[]) {
  try {
    await runProcess(exePath, args, { cwd: path.dirname(exePath) })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`AquesTalkPlayer の同期実行に失敗しました: ${message}`, { cause: error })
  }
}

async function readWavDurationSeconds(filePath: string, fallback: number) {
  try {
    const buffer = await readFile(filePath)
    if (buffer.length < 44 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
      return fallback
    }

    let offset = 12
    let byteRate = 0
    let dataBytes = 0

    while (offset + 8 <= buffer.length) {
      const chunkId = buffer.toString('ascii', offset, offset + 4)
      const chunkSize = buffer.readUInt32LE(offset + 4)
      const chunkStart = offset + 8

      if (chunkId === 'fmt ' && chunkSize >= 16 && chunkStart + 12 <= buffer.length) {
        byteRate = buffer.readUInt32LE(chunkStart + 8)
      } else if (chunkId === 'data') {
        dataBytes = Math.min(chunkSize, Math.max(0, buffer.length - chunkStart))
        break
      }

      offset = chunkStart + chunkSize + (chunkSize % 2)
    }

    if (byteRate > 0 && dataBytes > 0) {
      return normalizeDuration(dataBytes / byteRate)
    }
  } catch {
    // Fallback keeps legacy SAPI/silence behavior available if duration parsing fails.
  }

  return fallback
}

async function normalizeVoiceWav(
  ffmpegPath: string,
  sourcePath: string,
  outputPath: string,
  duration: number,
  sampleRate: 44100 | 48000,
) {
  const normalizedDuration = normalizeDuration(duration)
  const filters = [
    `aresample=${sampleRate}:async=1000:first_pts=0`,
    'apad',
    `atrim=0:${normalizedDuration.toFixed(3)}`,
    'asetpts=N/SR/TB',
  ]

  if (normalizedDuration > 0.12) {
    const fadeDuration = 0.035
    filters.push(`afade=t=out:st=${Math.max(0, normalizedDuration - fadeDuration).toFixed(3)}:d=${fadeDuration}`)
  }

  await runProcess(ffmpegPath, [
    '-y',
    '-i',
    sourcePath,
    '-vn',
    '-af',
    filters.join(','),
    '-ac',
    '2',
    '-ar',
    String(sampleRate),
    '-c:a',
    'pcm_s16le',
    outputPath,
  ])
}

async function renderFrame(
  project: YukkuriProject,
  shot: Shot,
  background: SceneBackground,
  outputPath: string,
) {
  const svg = await buildFrameSvg(project, shot, background)
  await sharp(Buffer.from(svg)).png().toFile(outputPath)
}

async function buildFrameSvg(project: YukkuriProject, shot: Shot, background: SceneBackground) {
  const { width, height } = project.project.resolution
  const speaker = project.characters.find((character) => character.id === shot.speakerId)!
  const characterLayers = await Promise.all(
    project.characters.map(async (character) => {
      if (shot.layout === 'solo-center' && character.id !== shot.speakerId) {
        return ''
      }

      const active = character.id === shot.speakerId
      const emotion = active ? (shot.emotion ?? character.defaultEmotion ?? 'neutral') : 'neutral'
      const asset = await readCharacterAsset(character, emotion)
      const focusScale =
        shot.layout === 'solo-center' ||
        (shot.layout === 'left-focus' && character.side === 'left') ||
        (shot.layout === 'right-focus' && character.side === 'right')
      const muted = (shot.layout === 'left-focus' && character.side === 'right') || (shot.layout === 'right-focus' && character.side === 'left')
      const size = Math.round(width * (focusScale ? 0.125 : 0.105))
      const x = shot.layout === 'solo-center'
        ? Math.round(width / 2 - size / 2)
        : character.side === 'left'
          ? Math.round(width * 0.065)
          : Math.round(width - width * 0.065 - size)
      const y = Math.round(height * (focusScale ? 0.49 : 0.51))
      const opacity = muted ? 0.64 : 1

      return `
        <g opacity="${opacity}">
          <image href="data:${asset.mime};base64,${asset.data}" x="${x}" y="${y}" width="${size}" height="${size}" />
          <rect x="${x + size * 0.31}" y="${y + size * 0.89}" width="${size * 0.38}" height="${size * 0.08}" rx="${size * 0.025}" fill="rgba(255,255,255,.88)" stroke="rgba(12,16,20,.42)" stroke-width="2"/>
          <text x="${x + size * 0.5}" y="${y + size * 0.945}" fill="#17202a" font-size="${Math.round(size * 0.045)}" font-weight="900" text-anchor="middle" font-family="Yu Gothic UI, Meiryo, Segoe UI, sans-serif">${escapeXml(character.name)}</text>
        </g>`
    }),
  )

  const visual = shot.visuals?.[0]
  const caption = shot.caption?.text?.trim() || shot.text
  const captionLines = wrapJapanese(caption, caption.length > 82 ? 38 : 34, 4)
  const subtitleFontSize = captionLines.length >= 4 ? 34 : captionLines.length === 3 ? 37 : 42
  const subtitleLineStep = subtitleFontSize + 10
  const bg = await backgroundSvg(background, width, height)
  const visualSvg = visual ? renderVisual(visual, width, height) : ''
  const assetSvg = renderShotAssets(shot, width, height)
  const retentionSvg = renderRetentionFrame(project, shot, width, height)
  const emphasisSvg = renderEmphasisChips(shot, width, height)
  const subtitleY = Math.round(height * 0.795)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="shadow"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity=".26"/></filter>
  </defs>
  ${bg}
  ${retentionSvg}
  ${assetSvg}
  ${visualSvg}
  <g filter="url(#shadow)">
    ${characterLayers.join('\n')}
  </g>
  ${emphasisSvg}
  <rect x="${Math.round(width * 0.052)}" y="${Math.round(height * 0.738)}" width="${Math.round(width * 0.896)}" height="${Math.round(height * 0.19)}" rx="16" fill="rgba(255,255,255,.80)" stroke="rgba(9,13,17,.28)" stroke-width="3"/>
  <rect x="${Math.round(width * 0.068)}" y="${Math.round(height * 0.704)}" width="${Math.round(width * 0.13)}" height="${Math.round(height * 0.047)}" rx="11" fill="#10151b" stroke="#ffffff" stroke-opacity=".7" stroke-width="2"/>
  <text x="${Math.round(width * 0.133)}" y="${Math.round(height * 0.737)}" fill="#ffcc4d" font-size="25" font-weight="900" text-anchor="middle" font-family="Yu Gothic UI, Meiryo, Segoe UI, sans-serif">${escapeXml(speaker.name)}</text>
  <text x="${Math.round(width * 0.082)}" y="${subtitleY}" fill="#ffffff" stroke="#11151a" stroke-width="8" paint-order="stroke fill" font-size="${subtitleFontSize}" font-weight="900" font-family="Yu Gothic UI, Meiryo, Segoe UI, sans-serif">
    ${captionLines.map((line, index) => `<tspan x="${Math.round(width * 0.082)}" dy="${index === 0 ? 0 : subtitleLineStep}">${escapeXml(line)}</tspan>`).join('\n')}
  </text>
</svg>`
}

async function backgroundSvg(background: SceneBackground, width: number, height: number) {
  const from = background.from ?? background.color ?? '#101827'
  const to = background.to ?? background.color ?? '#1f2a44'
  const accent = background.accent ?? '#35d0ff'

  if (background.type === 'asset') {
    const assetName = background.asset ?? 'classroom-board'
    const filePath = path.join(assetRoot(), 'backgrounds', `${assetName}.svg`)
    const svg = await readFile(filePath, 'utf8')
    return `
      <image href="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>
      <rect width="${width}" height="${height}" fill="rgba(255,255,255,.03)"/>
    `
  }

  if (background.type === 'solid') {
    return `<rect width="${width}" height="${height}" fill="${escapeXml(background.color ?? '#101827')}"/>`
  }

  const grid = background.type === 'grid'
    ? `<path d="${gridPath(width, height, 80)}" stroke="#ffffff" stroke-opacity=".08" stroke-width="2" fill="none"/>`
    : ''

  return `
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="${escapeXml(from)}"/>
        <stop offset="1" stop-color="${escapeXml(to)}"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <path d="M0 ${Math.round(height * 0.78)}C${Math.round(width * 0.28)} ${Math.round(height * 0.71)} ${Math.round(width * 0.56)} ${Math.round(height * 0.86)} ${width} ${Math.round(height * 0.76)}V${height}H0Z" fill="${escapeXml(accent)}" opacity=".12"/>
    ${grid}
  `
}

function renderRetentionFrame(project: YukkuriProject, shot: Shot, width: number, height: number) {
  const retention = shot.retention
  const beat = retention?.beat ?? 'evidence'
  const label = retentionBeatLabel(beat)
  const accent = retentionBeatAccent(beat)
  const chapter = retention?.chapterLabel ?? project.project.growth?.coreQuestion ?? project.project.title
  const question = retention?.viewerQuestion ?? project.project.growth?.viewerPromise ?? ''
  const sourceNote = retention?.sourceNote ?? ''
  const nextCuriosity = retention?.nextCuriosity ?? ''
  const x = Math.round(width * 0.044)
  const y = Math.round(height * 0.037)
  const boxWidth = Math.round(width * 0.912)
  const boxHeight = Math.round(height * (sourceNote || nextCuriosity ? 0.135 : 0.106))
  const questionLines = wrapJapanese(question, 46, 2)
  const meta = [sourceNote, nextCuriosity ? `NEXT: ${nextCuriosity}` : ''].filter(Boolean).join('   /   ')

  return `
    <g>
      <rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}" rx="14" fill="rgba(9,13,17,.78)" stroke="rgba(255,255,255,.22)" stroke-width="2"/>
      <rect x="${x}" y="${y}" width="132" height="42" rx="12" fill="${accent}"/>
      <text x="${x + 66}" y="${y + 29}" fill="${beat === 'hook' || beat === 'climax' ? '#ffffff' : '#11151c'}" font-size="20" font-weight="900" text-anchor="middle" font-family="Cascadia Mono, Consolas, monospace">${escapeXml(label)}</text>
      <text x="${x + 154}" y="${y + 36}" fill="#ffffff" stroke="rgba(7,10,14,.8)" stroke-width="2" paint-order="stroke fill" font-size="31" font-weight="900" font-family="Yu Gothic UI, Meiryo, Segoe UI, sans-serif">${escapeXml(truncateText(chapter, 58))}</text>
      ${
        questionLines.length > 0
          ? `<text x="${x + 154}" y="${y + 76}" fill="#dff5ff" font-size="23" font-weight="800" font-family="Yu Gothic UI, Meiryo, Segoe UI, sans-serif">
              ${questionLines.map((line, index) => `<tspan x="${x + 154}" dy="${index === 0 ? 0 : 30}">${escapeXml(line)}</tspan>`).join('\n')}
            </text>`
          : ''
      }
      ${
        meta
          ? `<rect x="${x + 154}" y="${y + boxHeight - 30}" width="${Math.round(boxWidth * 0.77)}" height="23" rx="11" fill="rgba(255,255,255,.10)" stroke="rgba(255,255,255,.16)" stroke-width="1"/>
             <text x="${x + 170}" y="${y + boxHeight - 13}" fill="#ffe2a2" font-size="16" font-weight="800" font-family="Yu Gothic UI, Meiryo, Segoe UI, sans-serif">${escapeXml(truncateText(meta, 86))}</text>`
          : ''
      }
    </g>`
}

function renderEmphasisChips(shot: Shot, width: number, height: number) {
  const words = shot.caption?.emphasis?.filter(Boolean).slice(0, 4) ?? []
  if (words.length === 0) {
    return ''
  }

  const y = Math.round(height * 0.686)
  let x = Math.round(width * 0.22)
  return words
    .map((word) => {
      const chipWidth = Math.min(Math.round(width * 0.17), Math.max(120, word.length * 28 + 54))
      const currentX = x
      x += chipWidth + 14
      return `
        <g>
          <rect x="${currentX}" y="${y}" width="${chipWidth}" height="40" rx="20" fill="#ffcc4d" stroke="rgba(17,21,28,.55)" stroke-width="2"/>
          <text x="${currentX + chipWidth / 2}" y="${y + 28}" fill="#11151c" font-size="22" font-weight="900" text-anchor="middle" font-family="Yu Gothic UI, Meiryo, Segoe UI, sans-serif">${escapeXml(truncateText(word, 12))}</text>
        </g>`
    })
    .join('\n')
}

function renderVisual(visual: NonNullable<Shot['visuals']>[number], width: number, height: number) {
  const x = Math.round(width * 0.59)
  const y = Math.round(height * 0.18)
  const boxWidth = Math.round(width * 0.34)
  const boxHeight = Math.round(height * 0.27)
  const bodyLines = wrapJapanese(visual.body ?? '', 22, 3)
  const itemLines = (visual.items ?? []).slice(0, 5)
  const accent = visualAccent(visual.type)

  return `
    <g>
      <rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}" rx="12" fill="rgba(255,255,255,.88)" stroke="rgba(9,13,17,.22)" stroke-width="3"/>
      <rect x="${x}" y="${y}" width="12" height="${boxHeight}" rx="6" fill="${accent}"/>
      <rect x="${x}" y="${y}" width="${boxWidth}" height="54" rx="12" fill="#10151b"/>
      <text x="${x + 30}" y="${y + 36}" fill="${accent}" font-size="22" font-weight="900" font-family="Cascadia Mono, Consolas, monospace">${escapeXml(visualTypeLabel(visual.type))}</text>
      <text x="${x + 28}" y="${y + 95}" fill="#11151a" font-size="33" font-weight="900" font-family="Yu Gothic UI, Meiryo, Segoe UI, sans-serif">${escapeXml(truncateText(visual.title, 18))}</text>
      <text x="${x + 28}" y="${y + 142}" fill="#27313c" font-size="25" font-weight="750" font-family="Yu Gothic UI, Meiryo, Segoe UI, sans-serif">
        ${bodyLines.map((line, index) => `<tspan x="${x + 28}" dy="${index === 0 ? 0 : 34}">${escapeXml(line)}</tspan>`).join('\n')}
        ${itemLines.map((line, index) => `<tspan x="${x + 28}" dy="${bodyLines.length === 0 && index === 0 ? 0 : 34}">- ${escapeXml(line)}</tspan>`).join('\n')}
      </text>
    </g>`
}

function renderShotAssets(shot: Shot, width: number, height: number) {
  const assets = (shot.assets ?? []).filter(
    (asset) => asset.track === 'video' && ['placeholder', 'image', 'video'].includes(asset.type),
  )

  return assets
    .slice(0, 3)
    .map((asset, index) => {
      const box = assetBox(asset.position ?? 'main-left', width, height, index)
      const labelLines = wrapJapanese(asset.label, 18)
      const notesLines = wrapJapanese(asset.notes ?? '', 22).slice(0, 2)
      const opacity = asset.opacity ?? 1

      return `
        <g opacity="${opacity}">
          <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="14" fill="rgba(255,255,255,.66)" stroke="rgba(18,24,31,.42)" stroke-width="3" stroke-dasharray="14 10"/>
          <path d="M${box.x + 22} ${box.y + box.height - 28}L${box.x + Math.round(box.width * 0.34)} ${box.y + Math.round(box.height * 0.58)}L${box.x + Math.round(box.width * 0.48)} ${box.y + Math.round(box.height * 0.72)}L${box.x + Math.round(box.width * 0.7)} ${box.y + Math.round(box.height * 0.46)}L${box.x + box.width - 24} ${box.y + box.height - 28}Z" fill="rgba(49,88,168,.18)"/>
          <circle cx="${box.x + Math.round(box.width * 0.75)}" cy="${box.y + Math.round(box.height * 0.26)}" r="${Math.round(Math.min(box.width, box.height) * 0.07)}" fill="rgba(255,190,69,.46)"/>
          <text x="${box.x + box.width / 2}" y="${box.y + Math.round(box.height * 0.38)}" fill="#3158a8" font-size="20" font-weight="900" text-anchor="middle" font-family="Cascadia Mono, Consolas, monospace">PLACEHOLDER</text>
          <text x="${box.x + box.width / 2}" y="${box.y + Math.round(box.height * 0.53)}" fill="#142031" font-size="29" font-weight="900" text-anchor="middle" font-family="Yu Gothic UI, Meiryo, Segoe UI, sans-serif">
            ${labelLines.map((line, lineIndex) => `<tspan x="${box.x + box.width / 2}" dy="${lineIndex === 0 ? 0 : 36}">${escapeXml(line)}</tspan>`).join('\n')}
          </text>
          ${
            notesLines.length > 0
              ? `<text x="${box.x + box.width / 2}" y="${box.y + box.height - 26}" fill="#516171" font-size="20" font-weight="700" text-anchor="middle" font-family="Yu Gothic UI, Meiryo, Segoe UI, sans-serif">${escapeXml(notesLines.join(' / '))}</text>`
              : ''
          }
        </g>`
    })
    .join('\n')
}

function assetBox(position: NonNullable<Shot['assets']>[number]['position'], width: number, height: number, index: number) {
  const large = {
    width: Math.round(width * 0.31),
    height: Math.round(height * 0.24),
  }
  const top = Math.round(height * (0.18 + index * 0.035))
  const middle = Math.round(height * 0.24)

  if (position === 'main-center') {
    return { ...large, x: Math.round(width / 2 - large.width / 2), y: middle }
  }
  if (position === 'main-right' || position === 'top-right') {
    return { ...large, x: Math.round(width * 0.62), y: position === 'top-right' ? top : middle }
  }
  if (position === 'lower-third') {
    return {
      x: Math.round(width * 0.26),
      y: Math.round(height * 0.6),
      width: Math.round(width * 0.48),
      height: Math.round(height * 0.12),
    }
  }
  if (position === 'fullscreen') {
    return {
      x: Math.round(width * 0.08),
      y: Math.round(height * 0.17),
      width: Math.round(width * 0.84),
      height: Math.round(height * 0.5),
    }
  }

  return { ...large, x: Math.round(width * 0.07), y: position === 'top-left' ? top : middle }
}

async function readCharacterAsset(character: CharacterProfile, emotion: string) {
  if (character.asset === 'custom' && character.customAsset) {
    const filePath = resolveCustomAssetPath(character.customAsset)
    const png = await readFile(filePath)
    return {
      mime: 'image/png',
      data: png.toString('base64'),
    }
  }

  const filePath = path.join(assetRoot(), 'characters', `${character.asset}-${emotion}.svg`)
  const svg = await readFile(filePath, 'utf8')
  return {
    mime: 'image/svg+xml',
    data: Buffer.from(svg).toString('base64'),
  }
}

function assetRoot() {
  return app.isPackaged ? path.join(process.resourcesPath, 'assets') : path.join(process.cwd(), 'public', 'assets')
}

function customAssetDir() {
  return path.join(app.getPath('userData'), 'custom-assets')
}

function settingsPath() {
  return path.join(app.getPath('userData'), settingsFileName)
}

async function readVoiceSettings(): Promise<VoiceEngineSettings> {
  let savedPath: string | undefined
  let updatedAt: string | undefined
  let readingDictionary: ReadingDictionaryEntry[] = []

  try {
    const content = await readFile(settingsPath(), 'utf8')
    const parsed = JSON.parse(content) as VoiceEngineSettings
    savedPath =
      typeof parsed.aquestalkPlayerPath === 'string' && parsed.aquestalkPlayerPath.trim()
        ? parsed.aquestalkPlayerPath
        : undefined
    updatedAt = typeof parsed.updatedAt === 'string' ? parsed.updatedAt : undefined
    readingDictionary = sanitizeReadingDictionaryEntries(parsed.readingDictionary).map((entry) => ({
      ...entry,
      source: 'user',
    }))
  } catch {
    savedPath = undefined
  }

  return {
    aquestalkPlayerPath: await findAquesTalkPlayerPath(savedPath),
    readingDictionary,
    builtinReadingDictionarySize: BUILTIN_READING_DICTIONARY.length,
    builtinReadingDictionaryVersion: BUILTIN_READING_DICTIONARY_VERSION,
    updatedAt,
  }
}

async function saveVoiceSettings(settings: VoiceEngineSettings) {
  await mkdir(app.getPath('userData'), { recursive: true })
  const resolved = settings.aquestalkPlayerPath
    ? await validateAquesTalkPlayerPath(settings.aquestalkPlayerPath)
    : undefined
  const normalized: VoiceEngineSettings = {
    aquestalkPlayerPath: resolved,
    readingDictionary: sanitizeReadingDictionaryEntries(settings.readingDictionary).map((entry) => ({
      ...entry,
      source: 'user',
    })),
    updatedAt: settings.updatedAt ?? new Date().toISOString(),
  }
  await writeFile(settingsPath(), JSON.stringify(normalized, null, 2), 'utf8')
  return {
    ...normalized,
    builtinReadingDictionarySize: BUILTIN_READING_DICTIONARY.length,
    builtinReadingDictionaryVersion: BUILTIN_READING_DICTIONARY_VERSION,
  }
}

async function resolveReadingDictionary(project: YukkuriProject) {
  const settings = await readVoiceSettings()
  return buildEffectiveReadingDictionary(settings.readingDictionary, project.project.readingDictionary)
}

async function validateAquesTalkPlayerPath(exePath: string) {
  const resolved = path.resolve(exePath)
  const fileStat = await stat(resolved)
  if (!fileStat.isFile() || path.extname(resolved).toLowerCase() !== '.exe') {
    throw new Error('AquesTalkPlayer.exe を指定してください。')
  }

  if (path.basename(resolved).toLowerCase() !== 'aquestalkplayer.exe') {
    throw new Error('安全のため、ファイル名が AquesTalkPlayer.exe の実行ファイルだけを受け付けます。')
  }

  return resolved
}

async function findAquesTalkPlayerPath(savedPath?: string) {
  const candidates = [
    savedPath,
    process.env.AQUESTALK_PLAYER_PATH,
    ...bundledAquesTalkPlayerCandidates,
    path.join(app.getPath('downloads'), 'aquestalkplayer_20250606', 'aquestalkplayer', 'AquesTalkPlayer.exe'),
    path.join(app.getPath('home'), 'Download', 'aquestalkplayer_20250606', 'aquestalkplayer', 'AquesTalkPlayer.exe'),
    path.join(app.getPath('home'), 'Downloads', 'aquestalkplayer_20250606', 'aquestalkplayer', 'AquesTalkPlayer.exe'),
  ].filter((candidate): candidate is string => Boolean(candidate?.trim()))

  for (const candidate of candidates) {
    try {
      return await validateAquesTalkPlayerPath(candidate)
    } catch {
      // Try the next known safe location.
    }
  }

  return undefined
}

function resolveCustomAssetPath(asset: CustomCharacterAsset) {
  const candidate = asset.id ? path.join(customAssetDir(), path.basename(asset.id)) : asset.filePath
  const resolvedDir = path.resolve(customAssetDir())
  const resolvedPath = path.resolve(candidate)

  if (!resolvedPath.startsWith(resolvedDir + path.sep) || !resolvedPath.endsWith('.png')) {
    throw new Error(`カスタム素材の参照が安全な管理フォルダ外です: ${asset.label}`)
  }

  return resolvedPath
}

async function netFetchFile(filePath: string) {
  const body = await readFile(filePath)
  return new Response(body, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
    },
  })
}

async function makeClip(
  ffmpegPath: string,
  framePath: string,
  voicePath: string,
  duration: number,
  fps: number,
  clipPath: string,
  renderOptions: RenderOptions,
) {
  const normalizedDuration = normalizeDuration(duration)
  const audioFilter = `[1:a]aresample=${renderOptions.audioSampleRate}:async=1000:first_pts=0,apad,atrim=0:${normalizedDuration.toFixed(
    3,
  )},asetpts=N/SR/TB[a]`
  await runProcess(ffmpegPath, [
    '-y',
    '-loop',
    '1',
    '-framerate',
    String(fps),
    '-t',
    String(normalizedDuration),
    '-i',
    framePath,
    '-i',
    voicePath,
    '-filter_complex',
    audioFilter,
    '-map',
    '0:v',
    '-map',
    '[a]',
    '-t',
    String(normalizedDuration),
    '-r',
    String(fps),
    '-pix_fmt',
    'yuv420p',
    ...videoEncoderArgs(renderOptions),
    '-c:a',
    'aac',
    '-b:a',
    renderOptions.audioBitrate,
    '-ar',
    String(renderOptions.audioSampleRate),
    '-ac',
    '2',
    clipPath,
  ])
}

async function concatClips(
  ffmpegPath: string,
  clips: string[],
  outputPath: string,
  workspace: string,
  renderOptions: RenderOptions,
) {
  const listPath = path.join(workspace, 'clips.txt')
  const content = clips.map((clip) => `file '${clip.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n')
  await writeFile(listPath, content, 'utf8')
  await runProcess(ffmpegPath, [
    '-y',
    '-fflags',
    '+genpts',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    listPath,
    '-map',
    '0:v:0',
    '-map',
    '0:a:0',
    '-c:v',
    'copy',
    '-af',
    `aresample=${renderOptions.audioSampleRate}:async=1000:first_pts=0,asetpts=N/SR/TB`,
    '-c:a',
    'aac',
    '-b:a',
    renderOptions.audioBitrate,
    '-ar',
    String(renderOptions.audioSampleRate),
    '-ac',
    '2',
    '-movflags',
    '+faststart',
    '-avoid_negative_ts',
    'make_zero',
    outputPath,
  ])
}

async function concatAudioWavs(
  ffmpegPath: string,
  clips: string[],
  outputPath: string,
  workspace: string,
  sampleRate: 44100 | 48000,
) {
  if (clips.length === 0) {
    await makeSilence(ffmpegPath, outputPath, 1, sampleRate)
    return
  }

  const listPath = path.join(workspace, 'preview-audio-clips.txt')
  const content = clips.map((clip) => `file '${clip.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n')
  await writeFile(listPath, content, 'utf8')
  await runProcess(ffmpegPath, [
    '-y',
    '-fflags',
    '+genpts',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    listPath,
    '-vn',
    '-af',
    `aresample=${sampleRate}:async=1000:first_pts=0,asetpts=N/SR/TB`,
    '-ac',
    '2',
    '-ar',
    String(sampleRate),
    '-c:a',
    'pcm_s16le',
    outputPath,
  ])
}

async function makeSilence(ffmpegPath: string, outputPath: string, duration: number, sampleRate: 44100 | 48000) {
  await runProcess(ffmpegPath, [
    '-y',
    '-f',
    'lavfi',
    '-i',
    `anullsrc=channel_layout=stereo:sample_rate=${sampleRate}`,
    '-t',
    String(duration),
    '-acodec',
    'pcm_s16le',
    outputPath,
  ])
}

async function resolveRenderOptions(
  ffmpegPath: string,
  settings: ProjectExportSettings | undefined,
  workspace: string,
  progress: (progress: ExportProgress) => void,
): Promise<RenderOptions> {
  const audioSampleRate = settings?.audioSampleRate ?? defaultAudioSampleRate
  const audioBitrate = settings?.audioBitrate ?? defaultAudioBitrate
  const videoBitrate = settings?.videoBitrate ?? defaultVideoBitrate
  const requested = settings?.gpuAcceleration ?? 'auto'
  const software: RenderOptions = {
    encoder: 'software',
    codec: 'libx264',
    label: 'CPU libx264',
    videoBitrate,
    audioBitrate,
    audioSampleRate,
  }

  if (requested === 'off') {
    progress({ phase: 'prepare', message: `エンコーダー: ${software.label}`, percent: 3 })
    return software
  }

  const allCandidates: RenderOptions[] = [
    {
      encoder: 'nvenc',
      codec: 'h264_nvenc',
      label: 'NVIDIA NVENC GPU',
      videoBitrate,
      audioBitrate,
      audioSampleRate,
    },
    {
      encoder: 'qsv',
      codec: 'h264_qsv',
      label: 'Intel Quick Sync GPU',
      videoBitrate,
      audioBitrate,
      audioSampleRate,
    },
    {
      encoder: 'amf',
      codec: 'h264_amf',
      label: 'AMD AMF GPU',
      videoBitrate,
      audioBitrate,
      audioSampleRate,
    },
  ]
  const candidates = allCandidates.filter((candidate) => requested === 'auto' || candidate.encoder === requested)

  const encoders = await readFfmpegEncoders(ffmpegPath)
  for (const candidate of candidates) {
    if (!encoders.has(candidate.codec)) {
      continue
    }

    progress({ phase: 'prepare', message: `${candidate.label} を検証中`, percent: 3 })
    if (await probeVideoEncoder(ffmpegPath, workspace, candidate)) {
      progress({ phase: 'prepare', message: `エンコーダー: ${candidate.label}`, percent: 4 })
      return candidate
    }
  }

  const reason = requested === 'auto' ? 'GPUエンコーダーを検出できないため' : `${requested} がこの環境で使用できないため`
  progress({ phase: 'prepare', message: `${reason} ${software.label} にフォールバック`, percent: 4 })
  return software
}

async function readFfmpegEncoders(ffmpegPath: string) {
  try {
    const output = await runProcessCapture(ffmpegPath, ['-hide_banner', '-encoders'])
    const matches = output.matchAll(/^\s*[A-Z.]{6}\s+(\S+)/gm)
    return new Set(Array.from(matches, (match) => match[1]))
  } catch {
    return new Set<string>()
  }
}

async function probeVideoEncoder(ffmpegPath: string, workspace: string, options: RenderOptions) {
  const outputPath = path.join(workspace, `encoder-probe-${options.codec}.mp4`)
  try {
    await runProcess(ffmpegPath, [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'color=c=black:s=320x180:r=30',
      '-t',
      '0.15',
      '-pix_fmt',
      'yuv420p',
      ...videoEncoderArgs(options),
      '-an',
      outputPath,
    ])
    return true
  } catch {
    return false
  }
}

function videoEncoderArgs(options: RenderOptions) {
  if (options.codec === 'libx264') {
    return ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20']
  }

  if (options.codec === 'h264_nvenc') {
    return [
      '-c:v',
      'h264_nvenc',
      '-gpu',
      '0',
      '-preset',
      'p4',
      '-tune',
      'hq',
      '-rc',
      'vbr',
      '-cq',
      '21',
      '-b:v',
      options.videoBitrate,
      '-maxrate',
      '16M',
      '-bufsize',
      '16M',
      '-spatial-aq',
      '1',
      '-temporal-aq',
      '1',
      '-rc-lookahead',
      '20',
      '-g',
      '60',
      '-bf',
      '0',
    ]
  }

  if (options.codec === 'h264_qsv') {
    return ['-c:v', 'h264_qsv', '-b:v', options.videoBitrate]
  }

  return ['-c:v', 'h264_amf', '-b:v', options.videoBitrate]
}

function runProcess(command: string, args: string[], options: { cwd?: string } = {}) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { cwd: options.cwd, windowsHide: true })
    let stderr = ''

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${path.basename(command)} failed with code ${code}: ${stderr.slice(-2000)}`))
      }
    })
  })
}

function runProcessCapture(command: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true })
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve(`${stdout}\n${stderr}`)
      } else {
        reject(new Error(`${path.basename(command)} failed with code ${code}: ${stderr.slice(-2000)}`))
      }
    })
  })
}

function resolveFfmpegPath() {
  const configured = process.env.FFMPEG_PATH?.trim()
  if (configured && existsSync(configured)) {
    return configured
  }

  const localTools = [
    path.join(process.cwd(), 'tools', 'ffmpeg', 'bin', 'ffmpeg.exe'),
    path.join(app.getPath('userData'), 'tools', 'ffmpeg', 'bin', 'ffmpeg.exe'),
    path.join(app.getPath('appData'), 'YukkuriCast Next', 'tools', 'ffmpeg', 'bin', 'ffmpeg.exe'),
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, 'YukkuriCast Next', 'tools', 'ffmpeg', 'bin', 'ffmpeg.exe')
      : undefined,
  ].filter((candidate): candidate is string => Boolean(candidate))
  for (const candidate of localTools) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  const pathFfmpeg = findExecutableOnPath('ffmpeg.exe')
  if (pathFfmpeg) {
    return pathFfmpeg
  }

  const bundled = (ffmpegInstaller as { path?: string }).path
  if (app.isPackaged && bundled?.includes('app.asar')) {
    const unpacked = bundled.replace('app.asar', 'app.asar.unpacked')
    if (existsSync(unpacked)) {
      return unpacked
    }
  }

  if (bundled && existsSync(bundled)) {
    return bundled
  }
  return 'ffmpeg'
}

function findExecutableOnPath(executable: string) {
  const paths = process.env.PATH?.split(path.delimiter) ?? []
  for (const entry of paths) {
    const candidate = path.join(entry, executable)
    if (existsSync(candidate)) {
      return candidate
    }
  }
  return undefined
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

function percent(step: number, total: number) {
  return Math.min(99, Math.round((step / total) * 100))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalizeDuration(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 1
  }
  return Math.round(value * 100) / 100
}

function voiceEngineLabel(engine: CharacterProfile['voice']['engine']) {
  return engine === 'aquestalk-player' ? 'AquesTalkPlayer' : 'Windows SAPI'
}

function powerShellString(value: string) {
  return `'${value.replace(/'/g, "''")}'`
}

function safeFileName(value: string) {
  const cleaned = Array.from(value)
    .map((char) => (char.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(char) ? '_' : char))
    .join('')
    .trim()
  return cleaned.length > 0 ? cleaned.slice(0, 80) : 'yukkuricast-video'
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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

function retentionBeatAccent(beat: NonNullable<Shot['retention']>['beat']) {
  switch (beat) {
    case 'hook':
    case 'early-payoff':
    case 'climax':
      return '#ff6b7a'
    case 'viewer-benefit':
    case 'summary':
    case 'next-video':
      return '#70e0a0'
    case 'question':
    case 'twist':
      return '#35d0ff'
    default:
      return '#ffcc4d'
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

function visualAccent(type: NonNullable<Shot['visuals']>[number]['type']) {
  switch (type) {
    case 'question':
      return '#ff6b7a'
    case 'comparison':
    case 'timeline':
    case 'chart':
    case 'map':
      return '#35d0ff'
    case 'source':
    case 'code':
      return '#70e0a0'
    case 'chapter':
      return '#ffcc4d'
    default:
      return '#3158a8'
  }
}

function truncateText(value: string, maxChars: number) {
  return value.length > maxChars ? `${value.slice(0, Math.max(0, maxChars - 1))}…` : value
}

function wrapJapanese(text: string, maxChars: number, maxLines = 3) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  const lines: string[] = []
  let current = ''

  for (const char of normalized) {
    current += char
    if (current.length >= maxChars || /[。！？]/.test(char)) {
      lines.push(current)
      current = ''
    }
  }

  if (current) {
    lines.push(current)
  }

  return lines.slice(0, maxLines)
}

function gridPath(width: number, height: number, interval: number) {
  const segments: string[] = []
  for (let x = 0; x <= width; x += interval) {
    segments.push(`M${x} 0V${height}`)
  }
  for (let y = 0; y <= height; y += interval) {
    segments.push(`M0 ${y}H${width}`)
  }
  return segments.join(' ')
}
