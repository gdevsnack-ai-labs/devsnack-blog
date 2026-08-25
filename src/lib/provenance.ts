export type FeedProvenanceKind = 'automated_feed' | 'stockpulse_experiment_output' | string

export interface FeedProvenance {
  kind: FeedProvenanceKind
  pipeline?: string
  generated_at?: string
  source_urls?: string[]
  source_count?: number
  human_reviewed?: boolean
  report_date?: string
  session?: string
  experiment_id?: string
  run_id?: string
  model?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeProvenance(value: unknown): FeedProvenance | null {
  if (!isRecord(value) || typeof value.kind !== 'string' || !value.kind.trim()) return null

  const sourceUrls = Array.isArray(value.source_urls)
    ? Array.from(new Set(value.source_urls.filter((url): url is string =>
        typeof url === 'string' && /^https?:\/\//i.test(url))))
    : undefined
  const sourceCount = typeof value.source_count === 'number' && Number.isFinite(value.source_count) && value.source_count >= 0
    ? Math.floor(value.source_count)
    : undefined

  return {
    kind: value.kind,
    ...(typeof value.pipeline === 'string' ? { pipeline: value.pipeline } : {}),
    ...(typeof value.generated_at === 'string' ? { generated_at: value.generated_at } : {}),
    ...(sourceUrls ? { source_urls: sourceUrls } : {}),
    ...(sourceCount !== undefined ? { source_count: sourceCount } : {}),
    ...(typeof value.human_reviewed === 'boolean' ? { human_reviewed: value.human_reviewed } : {}),
    ...(typeof value.report_date === 'string' ? { report_date: value.report_date } : {}),
    ...(typeof value.session === 'string' ? { session: value.session } : {}),
    ...(typeof value.experiment_id === 'string' ? { experiment_id: value.experiment_id } : {}),
    ...(typeof value.run_id === 'string' ? { run_id: value.run_id } : {}),
    ...(typeof value.model === 'string' ? { model: value.model } : {}),
  }
}

export function formatGeneratedAt(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function sourceCountLabel(provenance: FeedProvenance | null): string {
  if (!provenance) return '본문 출처 섹션'
  if (provenance.source_urls) return `출처 ${provenance.source_urls.length}개`
  if (provenance.source_count !== undefined) return `출처 ${provenance.source_count}개`
  return '본문 출처 섹션'
}

export function humanReviewLabel(provenance: FeedProvenance | null): string | null {
  if (!provenance || provenance.human_reviewed === undefined) return null
  return provenance.human_reviewed ? '사람 검수 완료' : '자동 생성 · 사람 검수 없음'
}
