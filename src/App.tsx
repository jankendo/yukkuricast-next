import { useEffect, useMemo, useState } from 'react'
import { InspectorPanel } from './components/InspectorPanel'
import { PreviewStage } from './components/PreviewStage'
import { ScriptPanel } from './components/ScriptPanel'
import { Timeline } from './components/Timeline'
import { TopBar } from './components/TopBar'
import { sampleProject, sampleProjectJson } from './data/sampleProject'
import { getAllShots, getProjectDuration, parseYukkuriProject } from './lib/scriptSchema'
import type { ExportProgress, ExportResult, YukkuriProject } from './types/script'

const idleProgress: ExportProgress = {
  phase: 'idle',
  message: '書き出し待機中',
  percent: 0,
}

function App() {
  const [project, setProject] = useState<YukkuriProject>(sampleProject)
  const [jsonText, setJsonText] = useState(sampleProjectJson)
  const [activeShotId, setActiveShotId] = useState(sampleProject.scenes[0].shots[0].id)
  const [errors, setErrors] = useState<string[]>([])
  const [exportProgress, setExportProgress] = useState<ExportProgress>(idleProgress)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const unsubscribe = window.yukkuri?.onExportProgress((progress) => {
      setExportProgress(progress)
    })
    return () => unsubscribe?.()
  }, [])

  const shotContexts = useMemo(() => getAllShots(project), [project])
  const activeContext = shotContexts.find((shot) => shot.id === activeShotId) ?? shotContexts[0]
  const duration = useMemo(() => getProjectDuration(project), [project])

  function applyJsonText(nextText = jsonText) {
    try {
      const parsed = parseYukkuriProject(nextText)
      setProject(parsed)
      setJsonText(JSON.stringify(parsed, null, 2))
      setActiveShotId(parsed.scenes[0].shots[0].id)
      setErrors([])
      setExportResult(null)
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

    setProject((currentProject) => ({
      ...currentProject,
      characters: currentProject.characters.map((character) =>
        character.id === speakerId
          ? {
              ...character,
              asset: 'custom',
              customAsset: result.asset,
            }
          : character,
      ),
    }))
  }

  function loadSample() {
    setProject(sampleProject)
    setJsonText(sampleProjectJson)
    setActiveShotId(sampleProject.scenes[0].shots[0].id)
    setErrors([])
    setExportResult(null)
    setExportProgress(idleProgress)
  }

  return (
    <div className="app-shell">
      <TopBar
        title={project.project.title}
        duration={duration}
        fps={project.project.fps}
        canExport={errors.length === 0}
        isExporting={isExporting}
        onImport={importScript}
        onLoadSample={loadSample}
        onSave={saveScript}
        onExport={exportVideo}
      />
      <div className="workspace">
        <ScriptPanel
          jsonText={jsonText}
          project={project}
          errors={errors}
          activeShotId={activeShotId}
          onJsonTextChange={setJsonText}
          onApplyJson={() => applyJsonText()}
          onSelectShot={setActiveShotId}
        />
        <section className="center-column">
          <PreviewStage project={project} shot={activeContext} background={activeContext.background} />
          <Timeline project={project} activeShotId={activeShotId} onSelectShot={setActiveShotId} />
        </section>
        <InspectorPanel
          project={project}
          shot={activeContext}
          background={activeContext.background}
          exportProgress={exportProgress}
          exportResult={exportResult}
          onImportAsset={importAssetForSpeaker}
        />
      </div>
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

export default App
