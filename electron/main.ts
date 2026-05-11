import { app, BrowserWindow, clipboard, dialog, ipcMain, protocol, session } from 'electron'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { getAllShots, yukkuriProjectSchema } from '../src/lib/scriptSchema'
import type {
  CharacterProfile,
  CustomCharacterAsset,
  ExportProgress,
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
      app.quit()
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

ipcMain.handle('preview:render-audio', async (_event, rawProject: YukkuriProject, shotId: string) => {
  const workspace = path.join(app.getPath('temp'), 'yukkuricast-next-preview', randomUUID())
  const outputPath = path.join(workspace, `${safeFileName(shotId)}.wav`)

  try {
    const project = yukkuriProjectSchema.parse(rawProject) as YukkuriProject
    assertSpeakerReferences(project)
    const shot = getAllShots(project).find((candidate) => candidate.id === shotId)
    if (!shot) {
      throw new Error(`preview shot not found: ${shotId}`)
    }

    const speaker = project.characters.find((character) => character.id === shot.speakerId)
    if (!speaker) {
      throw new Error(`speaker not found: ${shot.speakerId}`)
    }

    await mkdir(workspace, { recursive: true })
    await synthesizeVoice(shot.text, speaker, outputPath, shot.duration, resolveFfmpegPath())
    const wav = await readFile(outputPath)
    return {
      ok: true,
      audioUrl: `data:audio/wav;base64,${wav.toString('base64')}`,
      duration: shot.duration,
      engine: speaker.voice.engine,
      message: `${voiceEngineLabel(speaker.voice.engine)} preview ready`,
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
  const totalSteps = shots.length * 3 + 1
  let step = 0

  await mkdir(workspace, { recursive: true })
  progress({ phase: 'prepare', message: `作業フォルダを作成しました: ${workspace}`, percent: 2 })

  try {
    for (let index = 0; index < shots.length; index += 1) {
      const shot = shots[index]
      const base = `${String(index + 1).padStart(3, '0')}-${safeFileName(shot.id)}`
      const voicePath = path.join(workspace, `${base}.wav`)
      const framePath = path.join(workspace, `${base}.png`)
      const clipPath = path.join(workspace, `${base}.mp4`)
      const speaker = project.characters.find((character) => character.id === shot.speakerId)!

      progress({
        phase: 'voice',
        message: `${shot.id}: ${voiceEngineLabel(speaker.voice.engine)} 音声を生成中`,
        percent: percent(++step, totalSteps),
      })
      await synthesizeVoice(shot.text, speaker, voicePath, shot.duration, ffmpegPath)

      progress({
        phase: 'frame',
        message: `${shot.id}: 画像フレームを生成中`,
        percent: percent(++step, totalSteps),
      })
      await renderFrame(project, shot, shot.background, framePath)

      progress({
        phase: 'clip',
        message: `${shot.id}: MP4 クリップを生成中`,
        percent: percent(++step, totalSteps),
      })
      await makeClip(ffmpegPath, framePath, voicePath, shot.duration, project.project.fps, clipPath)
      clips.push(clipPath)
    }

    progress({
      phase: 'concat',
      message: 'すべてのクリップを連結中',
      percent: percent(step, totalSteps),
    })
    await concatClips(ffmpegPath, clips, outputPath, workspace)

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
) {
  if (speaker.voice.engine === 'aquestalk-player') {
    await synthesizeWithAquesTalkPlayer(text, speaker, outputPath)
    return
  }

  if (process.platform !== 'win32') {
    await makeSilence(ffmpegPath, outputPath, duration)
    return
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
$synth.Speak(${powerShellString(text)})
$synth.Dispose()
`

  try {
    await runProcess('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script])
  } catch {
    await makeSilence(ffmpegPath, outputPath, duration)
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

  await validateAquesTalkPlayerPath(exePath)
  await mkdir(path.dirname(outputPath), { recursive: true })
  const args: string[] = []
  const preset = speaker.voice.aquestalkPreset?.trim()
  if (preset) {
    args.push('/P', preset)
  }
  args.push('/T', text, '/W', outputPath)
  await runProcess(exePath, args)

  const result = await stat(outputPath).catch(() => undefined)
  if (!result || result.size === 0) {
    throw new Error('AquesTalkPlayer の WAV 出力が作成されませんでした。プリセット名とライセンス設定を確認してください。')
  }
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
      const focusScale = shot.layout === 'solo-center' || (shot.layout === 'left-focus' && character.side === 'left') || (shot.layout === 'right-focus' && character.side === 'right')
      const muted = (shot.layout === 'left-focus' && character.side === 'right') || (shot.layout === 'right-focus' && character.side === 'left')
      const size = Math.round(width * (focusScale ? 0.26 : 0.21))
      const x = shot.layout === 'solo-center'
        ? Math.round(width / 2 - size / 2)
        : character.side === 'left'
          ? Math.round(width * 0.08)
          : Math.round(width - width * 0.08 - size)
      const y = Math.round(height * (focusScale ? 0.42 : 0.48))
      const opacity = muted ? 0.64 : 1

      return `
        <g opacity="${opacity}">
          <image href="data:${asset.mime};base64,${asset.data}" x="${x}" y="${y}" width="${size}" height="${size}" />
          <rect x="${x + size * 0.33}" y="${y + size * 0.91}" width="${size * 0.34}" height="${size * 0.07}" rx="${size * 0.035}" fill="rgba(4,8,13,.72)" stroke="rgba(255,255,255,.22)"/>
          <text x="${x + size * 0.5}" y="${y + size * 0.956}" fill="#f5f8fc" font-size="${Math.round(size * 0.04)}" font-weight="800" text-anchor="middle" font-family="Yu Gothic UI, Meiryo, Segoe UI, sans-serif">${escapeXml(character.name)}</text>
        </g>`
    }),
  )

  const visual = shot.visuals?.[0]
  const caption = shot.caption?.text ?? shot.text
  const captionLines = wrapJapanese(caption, 34)
  const bg = backgroundSvg(background, width, height)
  const visualSvg = visual ? renderVisual(visual, width, height) : ''
  const subtitleY = Math.round(height * 0.84)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity=".32"/></filter>
    <filter id="captionShadow"><feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#000" flood-opacity=".65"/></filter>
  </defs>
  ${bg}
  ${visualSvg}
  <g filter="url(#shadow)">
    ${characterLayers.join('\n')}
  </g>
  <rect x="${Math.round(width * 0.07)}" y="${Math.round(height * 0.745)}" width="${Math.round(width * 0.86)}" height="${Math.round(height * 0.2)}" rx="18" fill="rgba(4,8,13,.88)" stroke="rgba(255,255,255,.24)" stroke-width="3"/>
  <text x="${Math.round(width * 0.095)}" y="${Math.round(height * 0.793)}" fill="#ffbe45" font-size="28" font-weight="850" font-family="Yu Gothic UI, Meiryo, Segoe UI, sans-serif">${escapeXml(speaker.name)}</text>
  <text x="${Math.round(width * 0.095)}" y="${subtitleY}" fill="#ffffff" filter="url(#captionShadow)" font-size="42" font-weight="850" font-family="Yu Gothic UI, Meiryo, Segoe UI, sans-serif">
    ${captionLines.map((line, index) => `<tspan x="${Math.round(width * 0.095)}" dy="${index === 0 ? 0 : 56}">${escapeXml(line)}</tspan>`).join('\n')}
  </text>
</svg>`
}

function backgroundSvg(background: SceneBackground, width: number, height: number) {
  const from = background.from ?? background.color ?? '#101827'
  const to = background.to ?? background.color ?? '#1f2a44'
  const accent = background.accent ?? '#35d0ff'

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
      <radialGradient id="accent" cx="78%" cy="82%" r="52%">
        <stop offset="0" stop-color="${escapeXml(accent)}" stop-opacity=".35"/>
        <stop offset="1" stop-color="${escapeXml(accent)}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <rect width="${width}" height="${height}" fill="url(#accent)"/>
    ${grid}
  `
}

function renderVisual(visual: NonNullable<Shot['visuals']>[number], width: number, height: number) {
  const x = Math.round(width * 0.64)
  const y = Math.round(height * 0.08)
  const boxWidth = Math.round(width * 0.28)
  const boxHeight = Math.round(height * 0.25)
  const bodyLines = wrapJapanese(visual.body ?? '', 20)
  const itemLines = visual.items ?? []

  return `
    <g>
      <rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}" rx="16" fill="rgba(8,14,20,.78)" stroke="rgba(255,255,255,.20)" stroke-width="2"/>
      <text x="${x + 30}" y="${y + 48}" fill="#ffbe45" font-size="21" font-weight="850" font-family="Cascadia Mono, Consolas, monospace">${escapeXml(visual.type.toUpperCase())}</text>
      <text x="${x + 30}" y="${y + 94}" fill="#ffffff" font-size="34" font-weight="850" font-family="Yu Gothic UI, Meiryo, Segoe UI, sans-serif">${escapeXml(visual.title)}</text>
      <text x="${x + 30}" y="${y + 142}" fill="#d5e2ef" font-size="24" font-weight="650" font-family="Yu Gothic UI, Meiryo, Segoe UI, sans-serif">
        ${bodyLines.map((line, index) => `<tspan x="${x + 30}" dy="${index === 0 ? 0 : 34}">${escapeXml(line)}</tspan>`).join('\n')}
        ${itemLines.map((line, index) => `<tspan x="${x + 30}" dy="${bodyLines.length === 0 && index === 0 ? 0 : 34}">- ${escapeXml(line)}</tspan>`).join('\n')}
      </text>
    </g>`
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
  try {
    const content = await readFile(settingsPath(), 'utf8')
    const parsed = JSON.parse(content) as VoiceEngineSettings
    return {
      aquestalkPlayerPath:
        typeof parsed.aquestalkPlayerPath === 'string' && parsed.aquestalkPlayerPath.trim()
          ? parsed.aquestalkPlayerPath
          : undefined,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : undefined,
    }
  } catch {
    return {}
  }
}

async function saveVoiceSettings(settings: VoiceEngineSettings) {
  await mkdir(app.getPath('userData'), { recursive: true })
  const normalized: VoiceEngineSettings = {
    aquestalkPlayerPath: settings.aquestalkPlayerPath,
    updatedAt: settings.updatedAt ?? new Date().toISOString(),
  }
  await writeFile(settingsPath(), JSON.stringify(normalized, null, 2), 'utf8')
  return normalized
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
) {
  await runProcess(ffmpegPath, [
    '-y',
    '-loop',
    '1',
    '-framerate',
    String(fps),
    '-t',
    String(duration),
    '-i',
    framePath,
    '-i',
    voicePath,
    '-filter_complex',
    '[1:a]apad[a]',
    '-map',
    '0:v',
    '-map',
    '[a]',
    '-t',
    String(duration),
    '-r',
    String(fps),
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '160k',
    clipPath,
  ])
}

async function concatClips(ffmpegPath: string, clips: string[], outputPath: string, workspace: string) {
  const listPath = path.join(workspace, 'clips.txt')
  const content = clips.map((clip) => `file '${clip.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n')
  await writeFile(listPath, content, 'utf8')
  await runProcess(ffmpegPath, [
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    listPath,
    '-c',
    'copy',
    '-movflags',
    '+faststart',
    outputPath,
  ])
}

async function makeSilence(ffmpegPath: string, outputPath: string, duration: number) {
  await runProcess(ffmpegPath, [
    '-y',
    '-f',
    'lavfi',
    '-i',
    'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-t',
    String(duration),
    '-acodec',
    'pcm_s16le',
    outputPath,
  ])
}

function runProcess(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true })
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

function resolveFfmpegPath() {
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

function wrapJapanese(text: string, maxChars: number) {
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

  return lines.slice(0, 3)
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
