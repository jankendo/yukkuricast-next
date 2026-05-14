import { CheckCircle2, ClipboardCopy, FileJson2, X } from 'lucide-react'

interface PromptGuideProps {
  prompt: string
  copied: boolean
  onCopy: () => void
  onClose: () => void
}

export function PromptGuide({ prompt, copied, onCopy, onClose }: PromptGuideProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="prompt-guide" role="dialog" aria-modal="true" aria-label="AI JSON prompt guide">
        <header className="prompt-guide-head">
          <div>
            <div className="panel-title">
              <FileJson2 size={18} />
              AI JSON 成長テンプレート
            </div>
            <p>全文テロップ、冒頭30秒維持、章ごとの問い、図解プレースホルダーまで含めて、YukkuriCast Next 用 JSON を作る仕様付きプロンプトです。</p>
          </div>
          <button type="button" className="icon-button ghost" onClick={onClose} aria-label="閉じる">
            <X size={18} />
          </button>
        </header>

        <div className="prompt-guide-actions">
          <button type="button" className="primary-button" onClick={onCopy}>
            {copied ? <CheckCircle2 size={17} /> : <ClipboardCopy size={17} />}
            {copied ? 'コピー済み' : 'プロンプトをコピー'}
          </button>
        </div>

        <textarea className="prompt-textarea" readOnly spellCheck={false} value={prompt} aria-label="AI prompt template" />
      </section>
    </div>
  )
}
