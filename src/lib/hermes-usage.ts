export interface HermesUsageBucket {
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cache_write_tokens: number
  reasoning_tokens: number
  total_tokens: number
  api_calls: number
  rows: number
}

export interface HermesUsageRow extends HermesUsageBucket {
  period?: string
  model?: string
  task?: string
  source?: string
  provider?: string
}

export interface HermesUsageMetadata {
  generated_at: string
  timezone: string
  scope: string
  report_version: string
  collection_cadence_hours: number
  collection_schedule: string
  profile_breakdown: 'aggregated'
  daily_attribution: string
  daily_attribution_note: string
  session_count: number
  usage_row_count: number
  usage_session_count: number
  sessions_without_usage: number
  multi_usage_sessions: number
  duplicate_usage_rows_removed: number
  usage_token_totals: HermesUsageBucket
}

export interface HermesUsageReport {
  metadata: HermesUsageMetadata
  daily: HermesUsageRow[]
  weekly: HermesUsageRow[]
  monthly: HermesUsageRow[]
  model_totals: HermesUsageRow[]
  task_totals: HermesUsageRow[]
  source_totals: HermesUsageRow[]
  provider_totals: HermesUsageRow[]
}

export interface HermesUsageIngestPayload {
  capturedAt: string
  scope: 'all_live_profiles_all_sources_all_tasks'
  reportVersion: 'public-v1'
  reportHash: string
  report: HermesUsageReport
}

export interface HermesUsageValidation {
  valid: boolean
  errors: string[]
}

const PRIVATE_KEYS = new Set([
  'profile',
  'profiles',
  'source_databases',
  'source_session_counts',
  'session_id',
  'chat_id',
  'title',
  'content',
  'prompt',
  'system_prompt',
  'cwd',
  'path',
])

const REQUIRED_ARRAYS = [
  'daily',
  'weekly',
  'monthly',
  'model_totals',
  'task_totals',
  'source_totals',
  'provider_totals',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function findPrivateFields(value: unknown, location = 'payload'): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findPrivateFields(item, `${location}[${index}]`))
  }
  if (!isRecord(value)) return []

  const errors: string[] = []
  for (const [key, child] of Object.entries(value)) {
    const normalized = key.toLowerCase()
    if (PRIVATE_KEYS.has(normalized) || normalized.endsWith('_cost_usd')) {
      errors.push(`${location}.${key}`)
      continue
    }
    errors.push(...findPrivateFields(child, `${location}.${key}`))
  }
  return errors
}

function requireString(value: unknown, field: string, errors: string[]) {
  if (typeof value !== 'string' || !value.trim()) errors.push(`${field} must be a non-empty string`)
}

export function validateHermesUsagePayload(value: unknown): HermesUsageValidation {
  const errors: string[] = []
  if (!isRecord(value)) return { valid: false, errors: ['payload must be an object'] }

  requireString(value.capturedAt, 'capturedAt', errors)
  if (value.scope !== 'all_live_profiles_all_sources_all_tasks') {
    errors.push('scope must represent all live profiles, sources, and tasks')
  }
  if (value.reportVersion !== 'public-v1') errors.push('reportVersion must be public-v1')
  if (typeof value.reportHash !== 'string' || !/^[0-9a-f]{64}$/.test(value.reportHash)) {
    errors.push('reportHash must be a 64-character lowercase SHA-256 hex string')
  }

  if (!isRecord(value.report)) {
    errors.push('report must be an object')
  } else {
    const metadata = value.report.metadata
    if (!isRecord(metadata)) {
      errors.push('report.metadata must be an object')
    } else {
      requireString(metadata.generated_at, 'report.metadata.generated_at', errors)
      if (metadata.timezone !== 'Asia/Seoul') errors.push('report.metadata.timezone must be Asia/Seoul')
      if (metadata.scope !== 'all_live_profiles_all_sources_all_tasks') errors.push('report.metadata.scope is invalid')
      if (metadata.report_version !== 'public-v1') errors.push('report.metadata.report_version is invalid')
      if (metadata.collection_cadence_hours !== 12) errors.push('report.metadata.collection_cadence_hours must be 12')
      if (metadata.profile_breakdown !== 'aggregated') errors.push('report.metadata.profile_breakdown must be aggregated')
      if (metadata.daily_attribution !== 'session_start_kst') errors.push('report.metadata.daily_attribution is invalid')
    }
    for (const key of REQUIRED_ARRAYS) {
      if (!Array.isArray(value.report[key])) errors.push(`report.${key} must be an array`)
    }
  }

  const privateFields = findPrivateFields(value)
  for (const field of privateFields) errors.push(`private field is not allowed: ${field}`)

  return { valid: errors.length === 0, errors }
}
