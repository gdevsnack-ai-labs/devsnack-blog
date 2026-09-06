import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const PUBLIC_RELEASE_ID = 'gb10-llm-benchmark-v1-20260906'

export const BENCHMARK_SUITE_KEYS = [
  'performance',
  'server_performance',
  'knowledge',
  'coding',
  'tool_call',
  'agent_single',
  'agent_multi',
] as const

export type BenchmarkSuiteKey = typeof BENCHMARK_SUITE_KEYS[number]

export type PublicBenchmarkSuite = {
  status: 'available' | 'unavailable' | 'not_in_public_export'
  source_type?: 'revalidated_evaluator' | 'reused_historical'
  source_run_id?: string
  evaluator_version?: string
  condition?: Record<string, unknown>
  alternatives?: Array<Record<string, unknown>>
  [key: string]: unknown
}

export type PublicBenchmarkModel = {
  model_id: string
  model: string
  variant: string
  quantization: string
  benchmark_versions: Record<string, string>
  suites: Record<BenchmarkSuiteKey, PublicBenchmarkSuite>
  provenance: {
    hardware: string
    reasoning_mode: string
    raw_artifacts_public: boolean
  }
}

export type PublicBenchmarkRelease = {
  schema_version: string
  release_id: string
  generated_at: string
  title: string
  status: string
  scope: {
    hardware: string
    runtime: string
    reasoning_mode: string
    raw_runs_public: boolean
    model_variant_count: number
    suite_count: number
    revalidated_evaluator_runs: number
    reused_source_runs: number
    source_run_references: number
  }
  suite_versions: Record<string, string>
  methodology: {
    evaluator_versions: Record<string, string>
    datasets: Array<{
      id: string
      version?: string
      public_path?: string
      sha256?: string
      scoring_type?: string
      reasoning?: string
    }>
    limitations: string[]
  }
  source_policy: Record<string, string>
  models: PublicBenchmarkModel[]
  counts: Record<string, number>
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

export function validatePublicBenchmarkRelease(value: unknown): PublicBenchmarkRelease {
  const release = asRecord(value)
  const models = Array.isArray(release.models) ? release.models : []
  const scope = asRecord(release.scope)

  if (release.release_id !== PUBLIC_RELEASE_ID) {
    throw new Error(`Unexpected benchmark release: ${String(release.release_id)}`)
  }
  if (release.schema_version !== 'gb10-benchmark-public-v1') {
    throw new Error(`Unsupported benchmark schema: ${String(release.schema_version)}`)
  }
  if (models.length !== 18 || scope.model_variant_count !== 18) {
    throw new Error(`Benchmark model count contract failed: ${models.length}`)
  }
  if (scope.suite_count !== 7 || scope.source_run_references !== 126) {
    throw new Error('Benchmark suite/source count contract failed')
  }

  const ids = new Set<string>()
  for (const rawModel of models) {
    const model = asRecord(rawModel)
    const id = String(model.model_id || '')
    if (!id || ids.has(id)) throw new Error(`Duplicate or empty benchmark model_id: ${id}`)
    ids.add(id)
    const suites = asRecord(model.suites)
    for (const suite of BENCHMARK_SUITE_KEYS) {
      const entry = asRecord(suites[suite])
      if (!['available', 'unavailable', 'not_in_public_export'].includes(String(entry.status))) {
        throw new Error(`Invalid suite status for ${id}/${suite}`)
      }
      if (entry.status === 'available' && !entry.source_run_id) {
        throw new Error(`Available suite has no source run for ${id}/${suite}`)
      }
    }
  }

  return value as PublicBenchmarkRelease
}

export function loadPublicBenchmarkRelease(releaseId = PUBLIC_RELEASE_ID): PublicBenchmarkRelease {
  if (releaseId !== PUBLIC_RELEASE_ID) throw new Error(`Unknown benchmark release: ${releaseId}`)
  const path = join(process.cwd(), 'public', 'data', 'benchmarks', `${PUBLIC_RELEASE_ID}.json`)
  return validatePublicBenchmarkRelease(JSON.parse(readFileSync(path, 'utf8')))
}

export function benchmarkSuiteLabel(key: BenchmarkSuiteKey): string {
  return {
    performance: 'Performance',
    server_performance: 'Server-performance',
    knowledge: 'Knowledge',
    coding: 'Coding',
    tool_call: 'Tool-call',
    agent_single: 'Agent-single',
    agent_multi: 'Agent-multi',
  }[key]
}
