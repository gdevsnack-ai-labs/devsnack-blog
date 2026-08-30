import { supabase } from '@/lib/supabase'
import {
  validateHermesUsagePayload,
  type HermesUsageIngestPayload,
  type HermesUsageReport,
} from '@/lib/hermes-usage'

export interface HermesUsageSnapshot {
  report: HermesUsageReport | null
  capturedAt: string | null
  available: boolean
  isStale: boolean
  error?: string
}

const STALE_AFTER_MS = 26 * 60 * 60 * 1000

function isStaleCapture(capturedAt: string | null): boolean {
  if (!capturedAt) return false
  const timestamp = new Date(capturedAt).getTime()
  return Number.isFinite(timestamp) && Date.now() - timestamp > STALE_AFTER_MS
}

export async function getHermesUsageSnapshot(): Promise<HermesUsageSnapshot> {
  const { data, error } = await supabase
    .from('hermes_usage_snapshots')
    .select('captured_at, report_version, scope, report_hash, report')
    .eq('id', 'public')
    .maybeSingle()

  if (error) {
    return { report: null, capturedAt: null, available: false, isStale: false, error: error.message }
  }
  if (!data?.report) return { report: null, capturedAt: null, available: false, isStale: false }

  const payload: Partial<HermesUsageIngestPayload> = {
    capturedAt: data.captured_at,
    scope: data.scope,
    reportVersion: data.report_version,
    reportHash: data.report_hash,
    report: data.report as HermesUsageReport,
  }
  const validation = validateHermesUsagePayload(payload)
  if (!validation.valid) {
    return {
      report: null,
      capturedAt: data.captured_at,
      available: false,
      isStale: isStaleCapture(data.captured_at),
      error: `저장된 Hermes 공개 리포트가 유효하지 않습니다: ${validation.errors.slice(0, 2).join('; ')}`,
    }
  }

  return {
    report: payload.report as HermesUsageReport,
    capturedAt: data.captured_at,
    available: true,
    isStale: isStaleCapture(data.captured_at),
  }
}
