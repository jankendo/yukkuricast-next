import type { ReadingDictionaryEntry } from '../types/script'

export const BUILTIN_READING_DICTIONARY_VERSION = '2026.05-yukkuri-tech-jp'

export const BUILTIN_READING_DICTIONARY: ReadingDictionaryEntry[] = [
  { id: 'builtin-generated-ai', surface: '生成AI', reading: 'せいせいエーアイ', source: 'builtin' },
  { id: 'builtin-llm', surface: 'LLM', reading: 'エルエルエム', source: 'builtin' },
  { id: 'builtin-ai', surface: 'AI', reading: 'エーアイ', source: 'builtin' },
  { id: 'builtin-json-schema', surface: 'JSON Schema', reading: 'ジェイソンスキーマ', source: 'builtin' },
  { id: 'builtin-json', surface: 'JSON', reading: 'ジェイソン', source: 'builtin' },
  { id: 'builtin-yaml', surface: 'YAML', reading: 'ヤムル', source: 'builtin' },
  { id: 'builtin-csv', surface: 'CSV', reading: 'シーエスブイ', source: 'builtin' },
  { id: 'builtin-api', surface: 'API', reading: 'エーピーアイ', source: 'builtin' },
  { id: 'builtin-sdk', surface: 'SDK', reading: 'エスディーケー', source: 'builtin' },
  { id: 'builtin-cli', surface: 'CLI', reading: 'シーエルアイ', source: 'builtin' },
  { id: 'builtin-gui', surface: 'GUI', reading: 'ジーユーアイ', source: 'builtin' },
  { id: 'builtin-ui', surface: 'UI', reading: 'ユーアイ', source: 'builtin' },
  { id: 'builtin-ux', surface: 'UX', reading: 'ユーエックス', source: 'builtin' },
  { id: 'builtin-gpu', surface: 'GPU', reading: 'ジーピーユー', source: 'builtin' },
  { id: 'builtin-cuda', surface: 'CUDA', reading: 'クーダ', source: 'builtin' },
  { id: 'builtin-rtx3060', surface: 'RTX3060', reading: 'アールティーエックスさんぜんろくじゅう', source: 'builtin' },
  { id: 'builtin-rtx', surface: 'RTX', reading: 'アールティーエックス', source: 'builtin' },
  { id: 'builtin-nvenc', surface: 'NVENC', reading: 'エヌブイエンク', source: 'builtin' },
  { id: 'builtin-ffmpeg', surface: 'FFmpeg', reading: 'エフエフエムペグ', source: 'builtin' },
  { id: 'builtin-h264', surface: 'H.264', reading: 'エイチにろくよん', source: 'builtin' },
  { id: 'builtin-h265', surface: 'H.265', reading: 'エイチにろくご', source: 'builtin' },
  { id: 'builtin-aac', surface: 'AAC', reading: 'エーエーシー', source: 'builtin' },
  { id: 'builtin-mp4', surface: 'MP4', reading: 'エムピーフォー', source: 'builtin' },
  { id: 'builtin-wav', surface: 'WAV', reading: 'ウェーブ', source: 'builtin' },
  { id: 'builtin-png', surface: 'PNG', reading: 'ピーエヌジー', source: 'builtin' },
  { id: 'builtin-jpeg', surface: 'JPEG', reading: 'ジェイペグ', source: 'builtin' },
  { id: 'builtin-webp', surface: 'WebP', reading: 'ウェッピー', source: 'builtin' },
  { id: 'builtin-fps', surface: 'fps', reading: 'エフピーエス', source: 'builtin' },
  { id: 'builtin-youtube', surface: 'YouTube', reading: 'ユーチューブ', source: 'builtin' },
  { id: 'builtin-chatgpt', surface: 'ChatGPT', reading: 'チャットジーピーティー', source: 'builtin' },
  { id: 'builtin-openai', surface: 'OpenAI', reading: 'オープンエーアイ', source: 'builtin' },
  { id: 'builtin-claude', surface: 'Claude', reading: 'クロード', source: 'builtin' },
  { id: 'builtin-gemini', surface: 'Gemini', reading: 'ジェミニ', source: 'builtin' },
  { id: 'builtin-github', surface: 'GitHub', reading: 'ギットハブ', source: 'builtin' },
  { id: 'builtin-windows', surface: 'Windows', reading: 'ウィンドウズ', source: 'builtin' },
  { id: 'builtin-macos', surface: 'macOS', reading: 'マックオーエス', source: 'builtin' },
  { id: 'builtin-iphone', surface: 'iPhone', reading: 'アイフォン', source: 'builtin' },
  { id: 'builtin-android', surface: 'Android', reading: 'アンドロイド', source: 'builtin' },
  { id: 'builtin-react', surface: 'React', reading: 'リアクト', source: 'builtin' },
  { id: 'builtin-electron', surface: 'Electron', reading: 'エレクトロン', source: 'builtin' },
  { id: 'builtin-typescript', surface: 'TypeScript', reading: 'タイプスクリプト', source: 'builtin' },
  { id: 'builtin-javascript', surface: 'JavaScript', reading: 'ジャバスクリプト', source: 'builtin' },
  { id: 'builtin-nodejs', surface: 'Node.js', reading: 'ノードジェイエス', source: 'builtin' },
  { id: 'builtin-npm', surface: 'npm', reading: 'エヌピーエム', source: 'builtin' },
  { id: 'builtin-vite', surface: 'Vite', reading: 'ヴィート', source: 'builtin' },
  { id: 'builtin-supabase', surface: 'Supabase', reading: 'スーパーベース', source: 'builtin' },
  { id: 'builtin-postgresql', surface: 'PostgreSQL', reading: 'ポストグレスキューエル', source: 'builtin' },
  { id: 'builtin-sqlite', surface: 'SQLite', reading: 'エスキューライト', source: 'builtin' },
  { id: 'builtin-rag', surface: 'RAG', reading: 'ラグ', source: 'builtin' },
  { id: 'builtin-ocr', surface: 'OCR', reading: 'オーシーアール', source: 'builtin' },
  { id: 'builtin-tts', surface: 'TTS', reading: 'ティーティーエス', source: 'builtin' },
  { id: 'builtin-stt', surface: 'STT', reading: 'エスティーティー', source: 'builtin' },
  { id: 'builtin-nlp', surface: 'NLP', reading: 'エヌエルピー', source: 'builtin' },
  { id: 'builtin-obs', surface: 'OBS', reading: 'オービーエス', source: 'builtin' },
  { id: 'builtin-vtuber', surface: 'VTuber', reading: 'ブイチューバー', source: 'builtin' },
  { id: 'builtin-aquestalkplayer', surface: 'AquesTalkPlayer', reading: 'アクエストークプレイヤー', source: 'builtin' },
  { id: 'builtin-aquestalk', surface: 'AquesTalk', reading: 'アクエストーク', source: 'builtin' },
  { id: 'builtin-ymm4-ja', surface: 'ゆっくりMovieMaker4', reading: 'ゆっくりムービーメーカーよん', source: 'builtin' },
  { id: 'builtin-ymm4', surface: 'YMM4', reading: 'ワイエムエムフォー', source: 'builtin' },
  { id: 'builtin-reimu-full', surface: '博麗霊夢', reading: 'はくれいれいむ', source: 'builtin' },
  { id: 'builtin-marisa-full', surface: '霧雨魔理沙', reading: 'きりさめまりさ', source: 'builtin' },
  { id: 'builtin-reimu', surface: '霊夢', reading: 'れいむ', source: 'builtin' },
  { id: 'builtin-marisa', surface: '魔理沙', reading: 'まりさ', source: 'builtin' },
  { id: 'builtin-touhou', surface: '東方', reading: 'とうほう', source: 'builtin' },
]

export function buildEffectiveReadingDictionary(
  userEntries: ReadingDictionaryEntry[] | undefined,
  projectEntries: ReadingDictionaryEntry[] | undefined,
) {
  const merged = new Map<string, ReadingDictionaryEntry>()

  for (const entry of [...BUILTIN_READING_DICTIONARY, ...(userEntries ?? []), ...(projectEntries ?? [])]) {
    const sanitized = sanitizeReadingDictionaryEntry(entry)
    if (!sanitized) {
      continue
    }
    const key = dictionaryKey(sanitized)
    if (sanitized.enabled === false) {
      merged.delete(key)
      continue
    }
    merged.set(key, sanitized)
  }

  return Array.from(merged.values()).sort((a, b) => b.surface.length - a.surface.length)
}

export function sanitizeReadingDictionaryEntries(entries: ReadingDictionaryEntry[] | undefined) {
  const sanitized: ReadingDictionaryEntry[] = []
  for (const entry of entries ?? []) {
    const next = sanitizeReadingDictionaryEntry(entry)
    if (next) {
      sanitized.push(next)
    }
  }
  return sanitized
}

export function sanitizeReadingDictionaryEntry(entry: ReadingDictionaryEntry | undefined): ReadingDictionaryEntry | undefined {
  const surface = normalizeDictionaryField(entry?.surface, 80)
  const reading = normalizeDictionaryField(entry?.reading, 120)
  if (!surface || !reading) {
    return undefined
  }

  const sanitized: ReadingDictionaryEntry = {
    surface,
    reading,
    enabled: entry?.enabled ?? true,
    caseSensitive: entry?.caseSensitive ?? false,
    source: entry?.source,
  }
  const id = normalizeDictionaryField(entry?.id, 80)
  if (id) {
    sanitized.id = id
  }
  return sanitized
}

export function applyReadingDictionary(text: string, entries: ReadingDictionaryEntry[]) {
  if (text.trimStart().startsWith('#>')) {
    return text
  }

  let output = text
  for (const entry of entries) {
    if (entry.enabled === false || !entry.surface || !entry.reading) {
      continue
    }
    output = replaceDictionarySurface(output, entry)
  }
  return applyModelNameReadings(output)
}

function replaceDictionarySurface(text: string, entry: ReadingDictionaryEntry) {
  const flags = entry.caseSensitive ? 'g' : 'gi'
  const pattern = new RegExp(escapeRegExp(entry.surface), flags)
  const asciiToken = isAsciiToken(entry.surface)
  return text.replace(pattern, (match: string, offset: number, source: string) => {
    if (asciiToken && !hasAsciiBoundary(source, offset, match.length)) {
      return match
    }
    return entry.reading
  })
}

function applyModelNameReadings(text: string) {
  return text
    .replace(/RTX\s?(\d{4})/gi, (_match, model: string) => `アールティーエックス${model}`)
    .replace(/GTX\s?(\d{4})/gi, (_match, model: string) => `ジーティーエックス${model}`)
}

function hasAsciiBoundary(text: string, offset: number, length: number) {
  const before = offset > 0 ? text[offset - 1] : ''
  const after = offset + length < text.length ? text[offset + length] : ''
  return !isAsciiWordChar(before) && !isAsciiWordChar(after)
}

function isAsciiToken(value: string) {
  return /^[a-z0-9][a-z0-9.+#_-]*$/i.test(value)
}

function isAsciiWordChar(value: string) {
  return /^[a-z0-9_]$/i.test(value)
}

function dictionaryKey(entry: ReadingDictionaryEntry) {
  return `${entry.caseSensitive ? 'case' : 'nocase'}:${entry.caseSensitive ? entry.surface : entry.surface.toLowerCase()}`
}

function normalizeDictionaryField(value: unknown, maxLength: number) {
  if (typeof value !== 'string') {
    return undefined
  }
  const normalized = value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim()
  return normalized ? normalized.slice(0, maxLength) : undefined
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
