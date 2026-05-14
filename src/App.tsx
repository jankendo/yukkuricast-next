import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { InspectorPanel } from './components/InspectorPanel'
import { PreviewStage } from './components/PreviewStage'
import { PromptGuide } from './components/PromptGuide'
import { ScriptPanel } from './components/ScriptPanel'
import { Timeline } from './components/Timeline'
import { TopBar } from './components/TopBar'
import { sampleProject, sampleProjectJson } from './data/sampleProject'
import { normalizeAquesTalkPreset } from './lib/presets'
import { buildAiJsonPromptTemplate } from './lib/promptTemplate'
import { parseYukkuriProject } from './lib/scriptSchema'
import { clampTime, getProjectTimelineDuration, getShotAtTime, getShotStart, getTimedShots } from './lib/timeline'
import type {
  CharacterVoice,
  ExportProgress,
  ExportResult,
  PreviewTimelineAudioResult,
  VoiceEngineSettings,
  VoiceSettingsResult,
  YukkuriProject,
} from './types/script'

const idleProgress: ExportProgress = {
  phase: 'idle',
  message: '書き出し待機中',
  percent: 0,
}

function App() {
  const [project, setProject] = useState<YukkuriProject>(sampleProject)
  const [jsonText, setJsonText] = useState(sampleProjectJson)
  const [activeShotId, setActiveShotId] = useState(sampleProject.scenes[0].shots[0].id)
  const [previewTime, setPreviewTime] = useState(0)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [previewAudioStatus, setPreviewAudioStatus] = useState('音声プレビュー待機中')
  const [voiceSettings, setVoiceSettings] = useState<VoiceEngineSettings>({})
  const [previewAudioDurationState, setPreviewAudioDurationState] = useState<{
    key: string
    values: Record<string, number>
  }>({ key: '', values: {} })
  const [isPromptGuideOpen, setIsPromptGuideOpen] = useState(false)
  const [promptCopied, setPromptCopied] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [exportProgress, setExportProgress] = useState<ExportProgress>(idleProgress)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const activeTimelineAudioKeyRef = useRef('')
  const previewTimelineAudioCacheRef = useRef(new Map<string, PreviewTimelineAudioResult>())
  const previewTimelineAudioPendingRef = useRef(new Map<string, Promise<PreviewTimelineAudioResult>>())
  const previewTimeRef = useRef(0)
  const promptCopyTimerRef = useRef<number | undefined>(undefined)

  const syncProject = useCallback((nextProject: YukkuriProject) => {
    setProject(nextProject)
    setJsonText(JSON.stringify(nextProject, null, 2))
  }, [])

  useEffect(() => {
    const unsubscribe = window.yukkuri?.onExportProgress((progress) => {
      setExportProgress(progress)
    })
    return () => unsubscribe?.()
  }, [])

  useEffect(() => {
    window.yukkuri?.getVoiceSettings?.().then(setVoiceSettings).catch(() => setVoiceSettings({}))
  }, [])

  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'auto'
    audioRef.current = audio
    return () => {
      audio.pause()
      audio.src = ''
      window.speechSynthesis?.cancel()
    }
  }, [])

  useEffect(() => {
    previewTimeRef.current = previewTime
  }, [previewTime])

  const previewAudioCacheKey = useMemo(
    () =>
      JSON.stringify({
        characters: project.characters.map((character) => ({
          id: character.id,
          voice: character.voice,
        })),
        audioSampleRate: project.project.export?.audioSampleRate ?? 48000,
        shots: project.scenes.flatMap((scene) =>
          scene.shots.map((shot) => ({
            id: shot.id,
            speakerId: shot.speakerId,
            text: shot.text,
            duration: shot.duration,
          })),
        ),
      }),
    [project],
  )
  const previewAudioDurations = useMemo(
    () => (previewAudioDurationState.key === previewAudioCacheKey ? previewAudioDurationState.values : {}),
    [previewAudioCacheKey, previewAudioDurationState],
  )
  const timedShots = useMemo(() => getTimedShots(project, previewAudioDurations), [previewAudioDurations, project])
  const duration = useMemo(() => getProjectTimelineDuration(project, previewAudioDurations), [previewAudioDurations, project])
  const activeContext = useMemo(() => {
    if (timedShots.length === 0) {
      return undefined
    }
    const bounded = clampTime(previewTime, duration)
    return timedShots.find((shot) => bounded >= shot.start && bounded < shot.end) ?? timedShots.at(-1)
  }, [duration, previewTime, timedShots])
  const activeShotProgress = activeContext
    ? clampTime(previewTime - activeContext.start, activeContext.duration) / activeContext.duration
    : 0
  const visibleActiveShotId = activeContext?.id ?? activeShotId
  const aiPromptTemplate = useMemo(() => buildAiJsonPromptTemplate(project), [project])
  const warmPreviewTimelineAudio = useCallback(
    async () => {
      if (!window.yukkuri?.renderPreviewTimelineAudio) {
        return undefined
      }
      const cached = previewTimelineAudioCacheRef.current.get(previewAudioCacheKey)
      if (cached) {
        return cached
      }
      const pending = previewTimelineAudioPendingRef.current.get(previewAudioCacheKey)
      if (pending) {
        return pending
      }
      setPreviewAudioStatus('AquesTalk音声を連続プレビュー用に合成中...')
      const request = window.yukkuri
        .renderPreviewTimelineAudio(project)
        .then((result) => {
          previewTimelineAudioCacheRef.current.set(previewAudioCacheKey, result)
          previewTimelineAudioPendingRef.current.delete(previewAudioCacheKey)
          if (result.ok && result.shotDurations) {
            setPreviewAudioDurationState((current) => {
              if (current.key === previewAudioCacheKey && sameDurations(current.values, result.shotDurations ?? {})) {
                return current
              }
              return {
                key: previewAudioCacheKey,
                values: result.shotDurations ?? {},
              }
            })
          }
          return result
        })
        .catch((error: unknown) => {
          previewTimelineAudioPendingRef.current.delete(previewAudioCacheKey)
          throw error
        })
      previewTimelineAudioPendingRef.current.set(previewAudioCacheKey, request)
      return request
    },
    [previewAudioCacheKey, project],
  )

  useEffect(() => {
    previewTimelineAudioCacheRef.current.clear()
    previewTimelineAudioPendingRef.current.clear()
    activeTimelineAudioKeyRef.current = ''
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.src = ''
    }
  }, [previewAudioCacheKey])

  useEffect(() => {
    if (!isPreviewPlaying) {
      warmPreviewTimelineAudio().catch(() => undefined)
    }
  }, [isPreviewPlaying, warmPreviewTimelineAudio])

  useEffect(() => {
    if (!isPreviewPlaying) {
      audioRef.current?.pause()
      window.speechSynthesis?.cancel()
      return
    }

    let frameId = 0
    const tick = () => {
      const audio = audioRef.current
      const next = clampTime(audio?.currentTime ?? previewTimeRef.current, duration)
      setPreviewTime(next)
      const shot = getShotAtTime(project, next, previewAudioDurations)
      if (shot) {
        setActiveShotId(shot.id)
      }
      if (audio?.ended || next >= duration - 0.02) {
        setIsPreviewPlaying(false)
        setPreviewAudioStatus('プレビュー完了')
        return
      }
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [duration, isPreviewPlaying, project, previewAudioDurations])

  useEffect(() => {
    return () => {
      if (promptCopyTimerRef.current) {
        window.clearTimeout(promptCopyTimerRef.current)
      }
    }
  }, [])

  function applyJsonText(nextText = jsonText) {
    try {
      const parsed = parseYukkuriProject(nextText)
      syncProject(parsed)
      setActiveShotId(parsed.scenes[0].shots[0].id)
      setPreviewTime(0)
      setIsPreviewPlaying(false)
      setErrors([])
      setExportResult(null)
      setPreviewAudioStatus('音声プレビュー待機中')
      setPreviewAudioDurationState({ key: '', values: {} })
    } catch (error) {
      setErrors(formatError(error))
    }
  }

  async function importScript() {
    if (window.yukkuri) {
      const result = await window.yukkuri.openScript()
      if (!result.canceled && result.content) {
        setJsonText(result.content)
        applyJsonText(result.content)
      }
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        return
      }
      const content = await file.text()
      setJsonText(content)
      applyJsonText(content)
    }
    input.click()
  }

  async function saveScript() {
    const normalized = JSON.stringify(project, null, 2)
    if (window.yukkuri) {
      await window.yukkuri.saveScript(normalized)
      return
    }

    const blob = new Blob([normalized], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'yukkuricast-script.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function exportVideo() {
    if (!window.yukkuri) {
      setExportResult({
        ok: false,
        error: 'MP4 書き出しは Electron アプリ起動時に利用できます。',
      })
      return
    }

    setIsPreviewPlaying(false)
    setIsExporting(true)
    setExportResult(null)
    setExportProgress({
      phase: 'prepare',
      message: '書き出しを開始しています',
      percent: 1,
    })

    const result = await window.yukkuri.exportVideo(project)
    setExportResult(result)
    setIsExporting(false)
  }

  async function importAssetForSpeaker(speakerId: string) {
    if (!window.yukkuri) {
      setExportResult({
        ok: false,
        error: '素材取り込みは Electron アプリ起動時に利用できます。',
      })
      return
    }

    const result = await window.yukkuri.importCharacterAsset()
    if (result.canceled) {
      return
    }

    if (!result.asset) {
      setExportResult({
        ok: false,
        error: result.error ?? '素材を取り込めませんでした。',
      })
      return
    }

    syncProject({
      ...project,
      characters: project.characters.map((character) =>
        character.id === speakerId
          ? {
              ...character,
              asset: 'custom',
              customAsset: result.asset,
            }
          : character,
      ),
    })
  }

  async function configureAquesTalkPlayer() {
    if (!window.yukkuri?.selectAquesTalkPlayer) {
      setExportResult({
        ok: false,
        error: 'AquesTalkPlayer の設定は Electron アプリ起動時に利用できます。',
      })
      return undefined
    }

    const result: VoiceSettingsResult = await window.yukkuri.selectAquesTalkPlayer()
    if (result.settings) {
      setVoiceSettings(result.settings)
      return result.settings
    }
    if (!result.canceled && result.error) {
      setExportResult({ ok: false, error: result.error })
    }
    return undefined
  }

  async function addReadingDictionaryEntry(surface: string, reading: string) {
    if (!window.yukkuri?.addReadingDictionaryEntry) {
      setExportResult({
        ok: false,
        error: '読み補正辞書の保存は Electron アプリ起動時に利用できます。',
      })
      return
    }

    const result = await window.yukkuri.addReadingDictionaryEntry(surface, reading)
    if (result.settings) {
      setVoiceSettings(result.settings)
    }
    if (result.error) {
      setExportResult({ ok: false, error: result.error })
    }
  }

  async function removeReadingDictionaryEntry(id: string) {
    if (!window.yukkuri?.removeReadingDictionaryEntry) {
      return
    }

    const result = await window.yukkuri.removeReadingDictionaryEntry(id)
    if (result.settings) {
      setVoiceSettings(result.settings)
    }
    if (result.error) {
      setExportResult({ ok: false, error: result.error })
    }
  }

  async function useAquesTalkForSpeaker(speakerId: string, preset?: string) {
    if (!voiceSettings.aquestalkPlayerPath) {
      await configureAquesTalkPlayer()
    }
    updateSpeakerVoice(speakerId, {
      engine: 'aquestalk-player',
      aquestalkPreset: normalizeAquesTalkPreset(preset),
    })
  }

  function updateSpeakerVoice(speakerId: string, patch: Partial<CharacterVoice>) {
    syncProject({
      ...project,
      characters: project.characters.map((character) =>
        character.id === speakerId
          ? {
              ...character,
              voice: {
                ...character.voice,
                ...patch,
              },
            }
          : character,
      ),
    })
  }

  function loadSample() {
    syncProject(sampleProject)
    setActiveShotId(sampleProject.scenes[0].shots[0].id)
    setPreviewTime(0)
    setIsPreviewPlaying(false)
    setErrors([])
    setExportResult(null)
    setExportProgress(idleProgress)
    setPreviewAudioStatus('音声プレビュー待機中')
    setPreviewAudioDurationState({ key: '', values: {} })
  }

  async function togglePreview() {
    if (duration <= 0) {
      return
    }

    if (isPreviewPlaying) {
      setIsPreviewPlaying(false)
      return
    }

    const startTime = previewTime >= duration ? 0 : previewTime
    const startShot = getShotAtTime(project, startTime, previewAudioDurations)
    if (previewTime >= duration) {
      seekPreview(0)
    }

    if (!window.yukkuri?.renderPreviewTimelineAudio) {
      if (startShot) {
        playBrowserSpeech(startShot.text)
      }
      setPreviewAudioStatus('ブラウザ音声でプレビュー中')
      setIsPreviewPlaying(true)
      return
    }

    const audio = audioRef.current
    if (!audio) {
      return
    }

    const result = await warmPreviewTimelineAudio().catch((error: unknown) => {
      setPreviewAudioStatus(error instanceof Error ? error.message : String(error))
      return undefined
    })
    if (!result?.ok || !result.audioUrl) {
      setPreviewAudioStatus(result?.error ?? '連続プレビュー音声の生成に失敗しました')
      return
    }

    if (activeTimelineAudioKeyRef.current !== previewAudioCacheKey) {
      audio.pause()
      audio.src = result.audioUrl
      activeTimelineAudioKeyRef.current = previewAudioCacheKey
      await waitForAudioMetadata(audio)
    }

    audio.playbackRate = 1
    audio.currentTime = clampTime(startTime, result.duration ?? duration)
    const playbackStarted = await audio.play().then(() => true).catch((error: unknown) => {
      setPreviewAudioStatus(error instanceof Error ? error.message : '音声再生に失敗しました')
      return false
    })
    if (!playbackStarted) {
      return
    }
    setPreviewAudioStatus(`${result.engineSummary ?? 'AquesTalkPlayer'} 連続プレビュー中`)
    setIsPreviewPlaying(true)
  }

  function stopPreview() {
    setIsPreviewPlaying(false)
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    seekPreview(0)
    setPreviewAudioStatus('音声プレビュー待機中')
  }

  function seekPreview(nextTime: number) {
    const next = clampTime(nextTime, duration)
    setPreviewTime(next)
    const audio = audioRef.current
    if (audio && activeTimelineAudioKeyRef.current === previewAudioCacheKey) {
      audio.currentTime = next
    }
    const shot = getShotAtTime(project, next, previewAudioDurations)
    if (shot) {
      setActiveShotId(shot.id)
    }
  }

  function selectShot(shotId: string) {
    setActiveShotId(shotId)
    seekPreview(getShotStart(project, shotId, previewAudioDurations))
  }

  async function copyAiPrompt() {
    try {
      await copyText(aiPromptTemplate)
      setPromptCopied(true)
      if (promptCopyTimerRef.current) {
        window.clearTimeout(promptCopyTimerRef.current)
      }
      promptCopyTimerRef.current = window.setTimeout(() => setPromptCopied(false), 1800)
    } catch (error) {
      setExportResult({
        ok: false,
        error: error instanceof Error ? error.message : 'プロンプトをコピーできませんでした。',
      })
    }
  }

  if (!activeContext) {
    return <div className="app-shell empty-shell">有効なショットがありません。</div>
  }

  return (
    <div className="app-shell">
      <TopBar
        title={project.project.title}
        duration={duration}
        fps={project.project.fps}
        canExport={errors.length === 0}
        isExporting={isExporting}
        isPreviewPlaying={isPreviewPlaying}
        onImport={importScript}
        onLoadSample={loadSample}
        onSave={saveScript}
        onExport={exportVideo}
        onTogglePreview={togglePreview}
        onStopPreview={stopPreview}
        onOpenPromptGuide={() => setIsPromptGuideOpen(true)}
      />
      <div className="workspace">
        <ScriptPanel
          jsonText={jsonText}
          project={project}
          errors={errors}
          activeShotId={visibleActiveShotId}
          onJsonTextChange={setJsonText}
          onApplyJson={() => applyJsonText()}
          onSelectShot={selectShot}
          onOpenPromptGuide={() => setIsPromptGuideOpen(true)}
        />
        <section className="center-column">
          <PreviewStage
            project={project}
            shot={activeContext}
            background={activeContext.background}
            currentTime={previewTime}
            duration={duration}
            shotProgress={activeShotProgress}
            isPlaying={isPreviewPlaying}
            audioStatus={previewAudioStatus}
            onSeek={seekPreview}
            onStop={stopPreview}
            onTogglePlayback={togglePreview}
          />
          <Timeline
            project={project}
            timedShots={timedShots}
            activeShotId={visibleActiveShotId}
            currentTime={previewTime}
            duration={duration}
            onSeek={seekPreview}
            onSelectShot={selectShot}
          />
        </section>
        <InspectorPanel
          project={project}
          shot={activeContext}
          background={activeContext.background}
          exportProgress={exportProgress}
          exportResult={exportResult}
          voiceSettings={voiceSettings}
          onConfigureAquesTalk={configureAquesTalkPlayer}
          onImportAsset={importAssetForSpeaker}
          onSetAquesTalkVoice={useAquesTalkForSpeaker}
          onUpdateSpeakerVoice={updateSpeakerVoice}
          onAddReadingDictionaryEntry={addReadingDictionaryEntry}
          onRemoveReadingDictionaryEntry={removeReadingDictionaryEntry}
        />
      </div>

      {isPromptGuideOpen && (
        <PromptGuide
          prompt={aiPromptTemplate}
          copied={promptCopied}
          onCopy={copyAiPrompt}
          onClose={() => setIsPromptGuideOpen(false)}
        />
      )}
    </div>
  )
}

function formatError(error: unknown) {
  if (error && typeof error === 'object' && 'issues' in error) {
    const issues = (error as { issues: Array<{ path: Array<string | number>; message: string }> }).issues
    return issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
  }

  if (error instanceof SyntaxError) {
    return [`JSON 構文エラー: ${error.message}`]
  }

  return [error instanceof Error ? error.message : String(error)]
}

function sameDurations(current: Record<string, number>, next: Record<string, number>) {
  const currentKeys = Object.keys(current)
  const nextKeys = Object.keys(next)
  if (currentKeys.length !== nextKeys.length) {
    return false
  }
  return nextKeys.every((key) => Math.abs((current[key] ?? 0) - next[key]) < 0.02)
}

function waitForAudioMetadata(audio: HTMLAudioElement) {
  if (audio.readyState >= 1) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', handleLoaded)
      audio.removeEventListener('error', handleError)
    }
    const handleLoaded = () => {
      cleanup()
      resolve()
    }
    const handleError = () => {
      cleanup()
      reject(new Error('プレビュー音声を読み込めませんでした。'))
    }
    audio.addEventListener('loadedmetadata', handleLoaded, { once: true })
    audio.addEventListener('error', handleError, { once: true })
  })
}

async function copyText(value: string) {
  if (window.yukkuri?.copyText) {
    await window.yukkuri.copyText(value)
    return
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return
    } catch {
      // Browser preview and locked-down WebViews can expose Clipboard API while denying writes.
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.append(textarea)
  textarea.focus()
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) {
    throw new Error('クリップボード権限が拒否されました。プロンプト欄の全文を選択してコピーしてください。')
  }
}

function playBrowserSpeech(text: string) {
  if (!('speechSynthesis' in window)) {
    return
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ja-JP'
  utterance.rate = 1
  window.speechSynthesis.speak(utterance)
}

export default App
