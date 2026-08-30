import externalData from '../data/stockpulse-v1-external.json' with { type: 'json' }

export type StockPulseReportType = 'morning' | 'close' | 'daily'

export type StockPulseExternalReport = {
  source_record_id: number
  old_slug: string
  title: string
  excerpt: string
  published: string | null
  updated: string | null
  status: string
  lifecycle_status: string
  report_date: string
  date_source: string
  report_type: StockPulseReportType
  migration_class: 'canonical_candidate' | 'duplicate_candidate'
  is_canonical_candidate: boolean
  target_path: string
  generation_version: 'v1'
  original_devsnack_url: string
  external_url: string
  prediction: {
    direction: string | null
    kospi_target: string | null
    actual_direction: string | null
    actual_kospi_close: number | null
    accuracy_score: number | null
    is_correct: boolean | null
  } | null
}

type ExternalPayload = {
  reports: StockPulseExternalReport[]
}

const payload = externalData as ExternalPayload

export const stockpulseV1ExternalReports = payload.reports

const reportsBySlug = new Map(
  stockpulseV1ExternalReports.map(report => [report.old_slug, report]),
)

export function getStockPulseExternalReport(slug: string): StockPulseExternalReport | null {
  return reportsBySlug.get(slug) || null
}

export function getStockPulseExternalReportUrl(slug: string): string | null {
  return getStockPulseExternalReport(slug)?.external_url || null
}

const stockpulseWeeklyExternalNotes: Record<string, string> = {
  'stockpulse-weekly-2026-08-18': 'https://gdevsnack-ai-labs.github.io/stockpulse-publication/lab-notes/stockpulse-weekly-2026-08-18/',
}

export function getStockPulseWeeklyExternalNoteUrl(slug: string): string | null {
  return stockpulseWeeklyExternalNotes[slug] || null
}
