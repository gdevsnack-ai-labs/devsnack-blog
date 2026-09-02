export type FixedProjectionRecord = Record<string, unknown>

export interface StockpulseFixedProjection {
  project: {
    id: string
    title: string
    route: string
    lifecycle: string
    activation_status: string
    daily_lab_slug_policy: string
    public_projection_is_canonical: boolean
  }
  snapshot: {
    live_shadow_day: string
    current_state: string
    ml_prediction_count: number
    ml_evaluated: number
    ml_correct: number | null
    ml_evaluation_state: string
    improvement_cycles: number
    improvement_status: string
    current_effective_config: FixedProjectionRecord
  }
  runs: {
    records: Array<{
      run_id: string
      trading_date: string
      run_mode: string
      stage: string
      overall_status: string
      run_status: string
      quality_status: string
      actual_model_set: string[]
      morning_llm_prediction: {
        direction: string
        confidence: number
        summary: string
        rationale: string[]
        freeze: {
          frozen_for_comparison: boolean
          post_cutoff_edit_allowed: boolean
          evaluation_session: string
        }
        evaluation_status: string
        success: boolean | null
      }
      actual_market_result: {
        status: string
        kospi_close: number | null
        direction: string | null
        llm_success: boolean | null
      }
      llm_evaluation: {
        status: string
        success: boolean | null
        failure: boolean | null
      }
      ml_evaluation: {
        prediction_count: number
        status: string
        evaluated_count: number
        pending_count: number
        correct_count: number | null
      }
      improvement: {
        status: string
        proposal_id: string | null
        actual_applied: boolean
        observation_state: string
      }
      publications: {
        morning: { status: string; path: string | null }
        evening: { status: string; path: string | null }
      }
      evidence_refs: Array<{ kind: string; id: string }>
    }>
  }
  improvements: {
    records: FixedProjectionRecord[]
    summary: FixedProjectionRecord
  }
  findings: {
    records: FixedProjectionRecord[]
  }
  publication: {
    morning: { status: string; path: string | null }
    evening: { status: string; path: string | null }
  }
  security: FixedProjectionRecord
}

export interface StockpulseFixedViewModel {
  project: {
    id: string
    title: string
    route: string
    lifecycle: string
    activationStatus: string
  }
  snapshot: {
    dayLabel: string
    stateLabel: string
    morning: string
    actual: string
    llmResult: string
    ml: string
    improvement: string
    finding: string
  }
  run: StockpulseFixedProjection['runs']['records'][number]
  date: string
  rationale: string[]
  actualClose: string
  sourceCompleteness: string
  modelSet: string[]
  evaluationStatus: string
  evidenceRefs: Array<{ kind: string; id: string }>
  effectiveConfig: FixedProjectionRecord
  improvements: FixedProjectionRecord[]
  findings: FixedProjectionRecord[]
  publication: {
    morning: { status: string; href: string }
    evening: { status: string; href: string }
  }
  publicSecurityHits: string[]
}

export const STOCKPULSE_V1_FIXED_PUBLICATION_ROOT = 'https://gdevsnack-ai-labs.github.io/stockpulse-v1-fixed-publication'

const PUBLIC_PRIVATE_MARKERS: Array<[string, RegExp]> = [
  ['credential', /\b(?:password|api[_-]?key|secret|authorization|bearer\s+|cookie\s*:|set-cookie\s*:|ghp_|github_pat_|sk-[A-Za-z0-9_-]{8,}|AIza[A-Za-z0-9_-]{8,})/i],
  ['internal_path', /\/(?:home|root|tmp|var)\/|\b(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?\b/i],
  ['raw_prompt', /\b(?:system_prompt|raw_system_prompt|prompt_source|private_path)\b/i],
  ['traceback', /\b(?:traceback|guardrail_halt|same_tool_failure|execution\.log)\b/i],
]

function formatConfidence(value: number): string {
  return value.toFixed(2)
}

function titleCaseStatus(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1)
}

function reportPreviewHref(date: string, stage: 'morning' | 'evening'): string {
  return `${STOCKPULSE_V1_FIXED_PUBLICATION_ROOT}/reports/${date}/${stage}/`
}

export function publicProjectionSecurityHits(projection: unknown): string[] {
  const text = JSON.stringify(projection)
  return PUBLIC_PRIVATE_MARKERS
    .filter(([, pattern]) => pattern.test(text))
    .map(([label]) => label)
}

export function getStockpulseFixedViewModel(
  projection: StockpulseFixedProjection,
  selectedRun?: StockpulseFixedProjection['runs']['records'][number],
): StockpulseFixedViewModel {
  const run = selectedRun ?? projection.runs.records[0]
  if (!run) throw new Error('StockPulse V1 Fixed projection has no Run Board record')

  const actualDirection = run.actual_market_result.direction || '미확인'
  const llmResult = run.llm_evaluation.success === true
    ? 'Correct'
    : run.llm_evaluation.success === false
      ? 'Incorrect'
      : 'Pending'
  const finding = projection.findings.records.length > 0
    ? `${projection.findings.records.length} Finding`
    : '아직 승격된 Finding이 없습니다.'

  return {
    project: {
      id: projection.project.id,
      title: projection.project.title,
      route: projection.project.route,
      lifecycle: projection.project.lifecycle,
      activationStatus: projection.project.activation_status,
    },
    snapshot: {
      dayLabel: projection.snapshot.live_shadow_day.replace(/\s+Morning$/, ''),
      stateLabel: projection.snapshot.current_state === 'day1_complete' ? 'Day complete · Evening available' : projection.snapshot.current_state,
      morning: `${run.morning_llm_prediction.direction} ${formatConfidence(run.morning_llm_prediction.confidence)}`,
      actual: actualDirection,
      llmResult,
      ml: `${run.ml_evaluation.prediction_count} ${titleCaseStatus(run.ml_evaluation.status)}`,
      improvement: titleCaseStatus(run.improvement.status),
      finding,
    },
    run,
    date: run.trading_date,
    rationale: run.morning_llm_prediction.rationale,
    actualClose: run.actual_market_result.kospi_close === null ? '미확인' : run.actual_market_result.kospi_close.toLocaleString('en-US', { maximumFractionDigits: 2 }),
    sourceCompleteness: run.quality_status === 'ok' ? 'complete' : run.quality_status,
    modelSet: run.actual_model_set,
    evaluationStatus: run.ml_evaluation.status,
    evidenceRefs: run.evidence_refs,
    effectiveConfig: projection.snapshot.current_effective_config,
    improvements: projection.improvements.records,
    findings: projection.findings.records,
    publication: {
      morning: {
        status: projection.publication.morning.status,
        href: reportPreviewHref(run.trading_date, 'morning'),
      },
      evening: {
        status: projection.publication.evening.status,
        href: reportPreviewHref(run.trading_date, 'evening'),
      },
    },
    publicSecurityHits: publicProjectionSecurityHits(projection),
  }
}
