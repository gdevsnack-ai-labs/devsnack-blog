'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  CircleDot,
  ExternalLink,
  FlaskConical,
} from 'lucide-react'
import {
  getStockpulseFixedViewModel,
  STOCKPULSE_V1_FIXED_PUBLICATION_ROOT,
  type FixedProjectionRecord,
  type StockpulseFixedProjection,
  type StockpulseFixedViewModel,
} from '@/lib/stockpulse-v1-fixed'

function formatDate(value: string): string {
  const [, month, day] = value.split('-')
  return month && day ? `${month}/${day}` : value
}

function statusClass(status: string): string {
  if (status === 'available' || status === 'evaluated' || status === 'complete') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
  if (status === 'pending') return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
  if (status === 'none' || status === 'not_started') return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
  return 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
}

function textValue(value: unknown, fallback = '—'): string {
  if (typeof value === 'string' && value.trim()) return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

function publicReaderText(value: string): string {
  return value.replace(/\bYura\s+(?:Morning|LLM)\b/gi, 'LLM')
}

function SnapshotMetric({ label, value, note, tone = 'default' }: { label: string; value: string; note: string; tone?: 'default' | 'positive' | 'warning' }) {
  const toneClass = tone === 'positive'
    ? 'border-emerald-300/25 bg-emerald-300/10'
    : tone === 'warning'
      ? 'border-amber-300/25 bg-amber-300/10'
      : 'border-white/10 bg-white/[0.06]'

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs font-medium text-slate-300">{label}</p>
      <p className="mt-2 text-xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-300">{note}</p>
    </div>
  )
}

function BoardPublicationLink({ href, label, status }: { href: string | null; label: string; status: string }) {
  if (!href) {
    return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" aria-disabled="true">{label} <span className={`rounded-full px-1.5 py-0.5 ${statusClass(status)}`}>{status}</span></span>
  }
  return <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 no-underline hover:underline dark:text-blue-300">{label} <ArrowUpRight className="h-3 w-3" aria-hidden="true" /></Link>
}

function mlEvaluationSummary(view: StockpulseFixedViewModel): string {
  const { prediction_count: predictionCount, evaluated_count: evaluatedCount, pending_count: pendingCount, status } = view.run.ml_evaluation
  if (status === 'evaluated') return `${evaluatedCount}개 평가 완료 · ${predictionCount}개 예측`
  if (pendingCount > 0) return `${pendingCount}개 예측 평가 대기 · 각 예측은 5개 거래 세션 후 확인`
  return '아직 평가할 예측이 없습니다.'
}

function RunDetail({ view }: { view: StockpulseFixedViewModel }) {
  const evening = view.run.evening_analysis
  const improvement = evening?.improvement
  return (
    <div className="space-y-5 rounded-2xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/60 dark:bg-blue-950/15 md:p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">이날의 판단과 결과</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{publicReaderText(view.run.morning_llm_prediction.summary)}</p>
      </div>
      {evening?.summary && (
        <div>
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">실제 결과</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{publicReaderText(evening.summary)}</p>
        </div>
      )}
      {(evening?.failure_analysis || evening?.actual_driver_analysis) && (
        <div>
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">판단에서 확인한 점</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{publicReaderText(evening.failure_analysis || evening.actual_driver_analysis || '')}</p>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-blue-100 bg-white p-4 dark:border-blue-900/40 dark:bg-gray-900">
          <p className="text-xs text-muted-foreground">ML 평가</p>
          <p className="mt-2 text-sm font-semibold">{mlEvaluationSummary(view)}</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-white p-4 dark:border-blue-900/40 dark:bg-gray-900">
          <p className="text-xs text-muted-foreground">예측 결과</p>
          <p className="mt-2 text-sm font-semibold">KOSPI {view.actualClose} · {view.snapshot.actual}</p>
        </div>
      </div>
      {improvement?.action_detail && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">다음 판단에 반영할 개선</p>
          <p className="mt-2 text-sm leading-relaxed">{publicReaderText(improvement.action_detail)}</p>
          {improvement.expected_impact && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">확인할 효과: {publicReaderText(improvement.expected_impact)}</p>}
        </div>
      )}
      {view.runtimeImprovement.used && view.runtimeImprovement.applicationNote && (
        <p className="text-xs leading-relaxed text-muted-foreground">이번 판단 반영: {publicReaderText(view.runtimeImprovement.applicationNote)}</p>
      )}
    </div>
  )
}

function improvementText(record: FixedProjectionRecord, key: string): string | null {
  const change = record.requested_change
  if (!change || typeof change !== 'object') return null
  const value = (change as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() ? value : null
}

function improvementFailure(record: FixedProjectionRecord): string | null {
  const change = record.requested_change
  if (!change || typeof change !== 'object') return null
  const evaluation = (change as Record<string, unknown>).evaluation
  if (!evaluation || typeof evaluation !== 'object') return null
  const value = (evaluation as Record<string, unknown>).fail_reason
  return typeof value === 'string' && value.trim() ? value : null
}

function ImprovementLedger({ improvements, runDateById }: { improvements: FixedProjectionRecord[]; runDateById: Map<string, string> }) {
  if (improvements.length === 0) return null
  return (
    <section aria-labelledby="improvement-ledger-heading">
      <div className="mb-4">
        <h2 id="improvement-ledger-heading" className="text-xl font-bold">다음 개선</h2>
        <p className="mt-1 text-sm text-muted-foreground">실제 판단에서 확인된 문제와 그 다음 판단에 반영할 변화를 기록합니다.</p>
      </div>
      <div className="space-y-3">
        {improvements.map((record, index) => {
          const date = runDateById.get(String(record.run_id)) || '날짜 미기록'
          const failureValue = improvementFailure(record)
          const failure = failureValue ? publicReaderText(failureValue) : null
          const action = publicReaderText(improvementText(record, 'action_detail') || '다음 판단에서 같은 문제를 다시 확인합니다.')
          const expectedImpactValue = improvementText(record, 'expected_impact')
          const expectedImpact = expectedImpactValue ? publicReaderText(expectedImpactValue) : null
          const applied = record.actual_applied === true && record.readback_verified === true
          return (
            <article key={`${String(record.run_id)}-${index}`} className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{date} 판단의 개선</h3>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${applied ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'}`}>{applied ? '설정 반영 완료' : '반영 대기'}</span>
              </div>
              {failure && <p className="mt-3 text-sm leading-relaxed text-muted-foreground"><strong className="text-foreground">확인된 문제:</strong> {failure}</p>}
              <p className="mt-3 text-sm leading-relaxed"><strong>다음 변경:</strong> {action}</p>
              {expectedImpact && <p className="mt-2 text-sm leading-relaxed text-muted-foreground"><strong className="text-foreground">확인할 효과:</strong> {expectedImpact}</p>}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function FindingsSection({ view }: { view: StockpulseFixedViewModel }) {
  if (view.findings.length === 0) return null
  return (
    <section aria-labelledby="findings-heading">
      <div className="mb-4">
        <h2 id="findings-heading" className="text-xl font-bold">Verified Findings</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {view.findings.map((record, index) => <article key={`${textValue(record.finding_id)}-${index}`} className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/60 dark:bg-blue-950/15"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{textValue(record.title, 'Finding')}</h3><span className="text-xs text-muted-foreground">{textValue(record.status)}</span></div><p className="mt-2 text-sm leading-relaxed">{textValue(record.statement)}</p></article>)}
      </div>
    </section>
  )
}

function runDetailId(runId: string, suffix = ''): string {
  const safeId = runId.replace(/[^a-zA-Z0-9_-]/g, '-')
  return `stockpulse-run-detail-${safeId}${suffix ? `-${suffix}` : ''}`
}

function mlStatusLabel(view: StockpulseFixedViewModel): string {
  return view.run.ml_evaluation.status === 'evaluated' ? '평가 완료' : view.run.ml_evaluation.pending_count > 0 ? '평가 대기' : '대기 없음'
}

function RunBoard({ views }: { views: StockpulseFixedViewModel[] }) {
  const [expandedRun, setExpandedRun] = useState<string | null>(views[0]?.run.run_id ?? null)
  const onToggle = (runId: string) => setExpandedRun(current => current === runId ? null : runId)

  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-border bg-white dark:bg-gray-900 md:block">
        <table className="min-w-[860px] w-full border-collapse text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Morning</th><th className="px-4 py-3 font-medium">Actual</th><th className="px-4 py-3 font-medium">Result</th><th className="px-4 py-3 font-medium">ML</th><th className="px-4 py-3 font-medium">Reports</th><th className="px-4 py-3 font-medium">Detail</th></tr></thead>
          <tbody>
            {views.map(view => {
              const expanded = expandedRun === view.run.run_id
              const detailId = runDetailId(view.run.run_id)
              return (
                <Fragment key={view.run.run_id}>
                  <tr className="border-b border-border align-top"><td className="px-4 py-4 font-medium">{formatDate(view.date)}</td><td className="px-4 py-4"><strong>{view.snapshot.morning}</strong></td><td className="px-4 py-4"><strong>{view.snapshot.actual}</strong><span className="mt-1 block text-xs text-muted-foreground">{view.actualClose}</span></td><td className="px-4 py-4">{view.snapshot.llmResult === 'Correct' ? <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300"><Check className="h-4 w-4" aria-hidden="true" />맞음</span> : <span className="font-semibold">{view.snapshot.llmResult === 'Incorrect' ? '틀림' : '평가 대기'}</span>}</td><td className="px-4 py-4"><span className="font-medium">{mlStatusLabel(view)}</span></td><td className="px-4 py-4"><div className="flex min-w-40 flex-col gap-2"><BoardPublicationLink href={view.publication.morning.href} label="Morning" status={view.publication.morning.status} /><BoardPublicationLink href={view.publication.evening.href} label="Evening" status={view.publication.evening.status} /></div></td><td className="px-4 py-4"><button type="button" onClick={() => onToggle(view.run.run_id)} aria-expanded={expanded} aria-controls={detailId} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:border-blue-300 hover:text-blue-700 dark:hover:border-blue-700 dark:hover:text-blue-300">{expanded ? '접기' : '상세 보기'}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" /></button></td></tr>
                  {expanded && <tr><td colSpan={7} className="p-3"><div id={detailId}><RunDetail view={view} /></div></td></tr>}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {views.map(view => {
          const expanded = expandedRun === view.run.run_id
          const detailId = runDetailId(view.run.run_id, 'mobile')
          return (
            <div key={view.run.run_id}>
              <article className="rounded-2xl border border-border bg-white p-4 dark:bg-gray-900">
                <div className="flex items-center justify-between gap-3"><div><p className="text-xs text-muted-foreground">Date</p><p className="mt-1 font-semibold">{formatDate(view.date)}</p></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${view.snapshot.llmResult === 'Correct' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>{view.snapshot.llmResult === 'Correct' ? '맞음' : view.snapshot.llmResult === 'Incorrect' ? '틀림' : '평가 대기'}</span></div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-muted-foreground">Morning</dt><dd className="mt-1 font-semibold">{view.snapshot.morning}</dd></div><div><dt className="text-xs text-muted-foreground">Actual</dt><dd className="mt-1 font-semibold">{view.snapshot.actual} · {view.actualClose}</dd></div><div><dt className="text-xs text-muted-foreground">ML</dt><dd className="mt-1 font-semibold">{mlStatusLabel(view)}</dd></div></dl>
                <div className="mt-4 grid grid-cols-2 gap-2"><BoardPublicationLink href={view.publication.morning.href} label="Morning" status={view.publication.morning.status} /><BoardPublicationLink href={view.publication.evening.href} label="Evening" status={view.publication.evening.status} /></div>
                <button type="button" onClick={() => onToggle(view.run.run_id)} aria-expanded={expanded} aria-controls={detailId} className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-foreground px-3 py-2.5 text-xs font-medium text-background">{expanded ? '상세 접기' : '이날의 판단과 결과'}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" /></button>
              </article>
              {expanded && <div id={detailId} className="mt-3"><RunDetail view={view} /></div>}
            </div>
          )
        })}
      </div>
    </>
  )
}

export function StockpulseV1FixedLab({ projection }: { projection: StockpulseFixedProjection }) {
  const views = projection.runs.records.map(run => getStockpulseFixedViewModel(projection, run))
  const view = views[0]
  if (!view) throw new Error('StockPulse V1 Fixed projection has no Run Board record')
  const runIds = views.map(item => item.run.run_id).join('|')
  const runDateById = new Map(projection.runs.records.map(run => [run.run_id, run.trading_date]))

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <Link href="/labs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Labs 대시보드</Link>

        <header className="mt-6 overflow-hidden rounded-[1.75rem] bg-slate-950 text-white shadow-xl shadow-slate-950/10 md:mt-8">
          <div className="p-5 md:p-8">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300"><FlaskConical className="h-4 w-4" aria-hidden="true" />StockPulse experiment</div>
                <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">StockPulse V1 Fixed</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">AI가 KOSPI·KOSDAQ 방향을 예측하고, 실제 장 마감 결과와 비교해 다음 판단을 개선하는 실험입니다.</p>
                <div className="mt-5 flex flex-wrap items-center gap-2 text-sm"><span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1.5 font-semibold text-emerald-300"><CircleDot className="h-3.5 w-3.5" aria-hidden="true" />Active</span><span className="rounded-full bg-white/10 px-3 py-1.5 text-slate-200">최근 run · {formatDate(view.date)}</span></div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SnapshotMetric label="Morning 예측" value={view.snapshot.morning} note="KOSPI 방향" />
              <SnapshotMetric label="장 마감" value={`${view.snapshot.actual}`} note={`KOSPI ${view.actualClose} · ${formatDate(view.date)}`} tone="positive" />
              <SnapshotMetric label="예측 결과" value={view.snapshot.llmResult === 'Correct' ? '맞음' : view.snapshot.llmResult === 'Incorrect' ? '틀림' : '평가 대기'} note="Morning 예측과 실제 비교" tone={view.snapshot.llmResult === 'Correct' ? 'positive' : 'warning'} />
              <SnapshotMetric label="ML 평가" value={view.run.ml_evaluation.status === 'evaluated' ? '평가 완료' : '평가 대기'} note={view.run.ml_evaluation.status === 'evaluated' ? `${view.run.ml_evaluation.evaluated_count}개 평가 완료` : `${view.run.ml_evaluation.pending_count}개 예측 평가 대기 · 5개 거래 세션 후 확인`} tone="warning" />
            </div>
          </div>
          {view.findings.length > 0 && <div className="border-t border-white/10 bg-white/[0.03] px-5 py-4 md:px-8"><div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="text-slate-400">Verified Finding</span><span className="font-medium text-slate-200">{view.snapshot.finding}</span></div></div>}
        </header>

        <main className="mt-8 space-y-12">
          <section aria-labelledby="run-board-heading">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div><div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="run-board-heading" className="text-xl font-bold">Run Board</h2></div><p className="mt-1 text-sm text-muted-foreground">날짜별 예측과 실제 장 마감 결과를 확인합니다.</p></div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span>최근 {views.length}회</span><Link href={`${STOCKPULSE_V1_FIXED_PUBLICATION_ROOT}/`} className="inline-flex items-center gap-1 font-medium text-blue-700 no-underline hover:underline dark:text-blue-300">Publication home <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></Link></div>
            </div>

            <RunBoard key={runIds} views={views} />
          </section>

          <ImprovementLedger improvements={view.improvements} runDateById={runDateById} />
          <FindingsSection view={view} />
        </main>
      </div>
    </div>
  )
}
