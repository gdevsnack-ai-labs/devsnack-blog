import { createHash } from 'node:crypto'

export type Locale = 'ko' | 'en'
export type TranslationStatus = 'candidate' | 'reviewed' | 'published' | 'stale'
export type TranslatorType = 'human' | 'ai_assisted' | 'automated'

export type PostTranslation = {
  id: number
  post_id: number
  locale: Locale
  slug: string | null
  title: string
  content: string
  excerpt: string | null
  seo_desc: string | null
  source_content_hash: string
  translation_status: TranslationStatus
  translated_at: string | null
  translator_type: TranslatorType
  human_reviewed: boolean
  created_at: string
  updated_at: string
}

export type TranslationSource = {
  title: string
  content: string
  excerpt: string | null
  seo_desc: string | null
  labels: string[] | null
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export function sourceContentHash(source: TranslationSource): string {
  const canonical = {
    title: source.title,
    content: source.content,
    excerpt: source.excerpt,
    seo_desc: source.seo_desc,
    labels: source.labels,
  }
  return `sha256:${createHash('sha256').update(stableJson(canonical), 'utf8').digest('hex')}`
}

export function englishMirrorPath(sourcePath: string): string {
  const normalized = sourcePath.startsWith('/') ? sourcePath : `/${sourcePath}`
  return normalized === '/en' || normalized.startsWith('/en/') ? normalized : `/en${normalized}`
}

export function koreanSourcePath(englishPath: string): string {
  const normalized = englishPath.startsWith('/') ? englishPath : `/${englishPath}`
  return normalized === '/en' ? '/' : normalized.startsWith('/en/') ? normalized.slice(3) : normalized
}

export function effectiveTranslationStatus(
  translation: Pick<PostTranslation, 'translation_status' | 'source_content_hash'>,
  source: TranslationSource,
): TranslationStatus {
  if (translation.translation_status === 'stale') return 'stale'
  if (translation.source_content_hash !== sourceContentHash(source)) return 'stale'
  return translation.translation_status
}

export function translationStatusLabel(status: TranslationStatus): string {
  return {
    candidate: 'Translation candidate',
    reviewed: 'Human-reviewed translation',
    published: 'Published translation',
    stale: 'Translation needs refresh',
  }[status]
}
