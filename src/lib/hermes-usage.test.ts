import test from 'node:test'
import assert from 'node:assert/strict'

// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { validateHermesUsagePayload, type HermesUsageIngestPayload } from './hermes-usage.ts'

function validPayload(): HermesUsageIngestPayload {
  return {
    capturedAt: '2026-08-30T12:00:00+09:00',
    scope: 'all_live_profiles_all_sources_all_tasks',
    reportVersion: 'public-v1',
    reportHash: 'a'.repeat(64),
    report: {
      metadata: {
        generated_at: '2026-08-30T12:00:00+09:00',
        timezone: 'Asia/Seoul',
        scope: 'all_live_profiles_all_sources_all_tasks',
        report_version: 'public-v1',
        collection_cadence_hours: 12,
        collection_schedule: '00:00, 12:00 Asia/Seoul',
        profile_breakdown: 'aggregated',
        daily_attribution: 'session_start_kst',
        daily_attribution_note: 'session-start attribution',
        session_count: 1,
        usage_row_count: 1,
        usage_session_count: 1,
        sessions_without_usage: 0,
        multi_usage_sessions: 0,
        duplicate_usage_rows_removed: 0,
        usage_token_totals: {
          input_tokens: 1,
          output_tokens: 2,
          cache_read_tokens: 3,
          cache_write_tokens: 0,
          reasoning_tokens: 4,
          total_tokens: 6,
          api_calls: 1,
          rows: 1,
        },
      },
      daily: [],
      weekly: [],
      monthly: [],
      model_totals: [],
      task_totals: [],
      source_totals: [],
      provider_totals: [],
    },
  }
}

test('accepts a complete aggregate-only Hermes usage payload', () => {
  const result = validateHermesUsagePayload(validPayload())
  assert.equal(result.valid, true)
  assert.deepEqual(result.errors, [])
})

test('rejects profile and private fields instead of silently exposing them', () => {
  const payload = validPayload() as unknown as Record<string, unknown>
  const report = payload.report as Record<string, unknown>
  const metadata = report.metadata as Record<string, unknown>
  metadata.profiles = ['default']
  metadata.source_databases = [{ path: '/home/kahros/.hermes/state.db' }]

  const result = validateHermesUsagePayload(payload)

  assert.equal(result.valid, false)
  assert.match(result.errors.join('\n'), /profiles|source_databases|path/)
})

test('rejects a payload that is not collected on the 12-hour contract', () => {
  const payload = validPayload()
  payload.report.metadata.collection_cadence_hours = 1

  const result = validateHermesUsagePayload(payload)

  assert.equal(result.valid, false)
  assert.match(result.errors.join('\n'), /12/)
})
