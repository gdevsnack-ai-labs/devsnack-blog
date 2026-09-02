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
  FileText,
  FlaskConical,
  GitBranch,
  LockKeyhole,
  Settings2,
  Sparkles,
  Target,
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

function jsonValue(value: unknown): string {
  return JSON.stringify(value, null, 2)
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

function ReportLink({ href, label, status }: { href: string; label: string; status: string }) {
  return (
    <Link href={href} className="group flex min-w-0 w-full items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 no-underline transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:bg-gray-900 dark:hover:border-blue-700 dark:hover:bg-blue-950/20">
      <span className="flex min-w-0 items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
        <span className="min-w-0 truncate text-sm font-medium">{label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        <span className={`rounded-full px-2 py-0.5 font-medium ${statusClass(status)}`}>{status}</span>
        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  )
}

function EvidenceDetails({ view }: { view: StockpulseFixedViewModel }) {
  return (
    <details className="group rounded-xl border border-border bg-white dark:bg-gray-900">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-muted-foreground" aria-hidden="true" />Evidence detail</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-border px-4 pb-4 pt-3">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Run ID</p>
            <p className="mt-1 break-all font-mono text-xs">{view.run.run_id}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Source completeness</p>
            <p className="mt-1 font-semibold">{view.sourceCompleteness}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Model set</p>
            <p className="mt-1 leading-relaxed">{view.modelSet.join(' · ')}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Evaluation status</p>
            <p className="mt-1 font-semibold">ML {view.evaluationStatus} · LLM {view.run.llm_evaluation.status}</p>
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xs font-semibold text-muted-foreground">Evidence IDs</p>
          <ul className="mt-2 space-y-1 rounded-lg bg-slate-950 p-3 font-mono text-[11px] text-slate-200">
            {view.evidenceRefs.map(ref => <li key={`${ref.kind}-${ref.id}`}><span className="text-slate-500">{ref.kind}</span> · {ref.id}</li>)}
          </ul>
        </div>
      </div>
    </details>
  )
}

function RunDetail({ view }: { view: StockpulseFixedViewModel }) {
  return (
    <div className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/60 dark:bg-blue-950/15 md:p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">Run detail</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{view.run.morning_llm_prediction.summary}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-white p-3 dark:bg-gray-900"><p className="text-xs text-muted-foreground">Actual KOSPI close</p><p className="mt-1 text-lg font-bold">{view.actualClose}</p></div>
        <div className="rounded-xl border border-border bg-white p-3 dark:bg-gray-900"><p className="text-xs text-muted-foreground">Actual direction</p><p className="mt-1 text-lg font-bold">{view.snapshot.actual}</p></div>
        <div className="rounded-xl border border-border bg-white p-3 dark:bg-gray-900"><p className="text-xs text-muted-foreground">Improvement</p><p className="mt-1 text-lg font-bold">{view.snapshot.improvement}</p></div>
        <div className="rounded-xl border border-border bg-white p-3 dark:bg-gray-900"><p className="text-xs text-muted-foreground">Run status</p><p className="mt-1 text-lg font-bold">{view.run.run_status}</p></div>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground">Morning rationale summary</p>
        <ul className="mt-2 grid gap-2 text-sm leading-relaxed sm:grid-cols-2">
          {view.rationale.map(item => <li key={item} className="rounded-lg border border-blue-100 bg-white px-3 py-2 dark:border-blue-900/40 dark:bg-gray-900">{item}</li>)}
        </ul>
      </div>
      <EvidenceDetails view={view} />
    </div>
  )
}

function ImprovementLedger({ view }: { view: StockpulseFixedViewModel }) {
  return (
    <section aria-labelledby="improvement-ledger-heading">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><GitBranch className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="improvement-ledger-heading" className="text-xl font-bold">Improvement Ledger</h2></div>
          <p className="mt-1 text-sm text-muted-foreground">실패가 평가된 뒤에만 proposal lifecycle을 시작합니다.</p>
        </div>
        <span className="text-xs text-muted-foreground">{view.improvements.length} records</span>
      </div>
      {view.improvements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6">
          <p className="text-base font-semibold">No evaluated failure → No proposal</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Day 1 ML은 아직 50개 모두 pending이고 평가된 failure가 없으므로, 변경 제안이나 Applied 상태를 만들지 않았습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {view.improvements.map((record, index) => <ImprovementRecord key={`${textValue(record.proposal_id)}-${index}`} record={record} />)}
        </div>
      )}
    </section>
  )
}

function ImprovementRecord({ record }: { record: FixedProjectionRecord }) {
  const applied = record.actual_applied === true && record.effective_runtime_readback !== null
  return (
    <article className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{textValue(record.proposal_id, 'Proposal')}</h3>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(textValue(record.status))}`}>{textValue(record.status)}</span>
      </div>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-muted-foreground">Trigger</dt><dd className="mt-1">{textValue(record.trigger)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Observation state</dt><dd className="mt-1">{textValue(record.observation_state)}</dd></div>
        <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Requested change</dt><dd className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">{jsonValue(record.requested_change)}</dd></div>
        <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Effective read-back</dt><dd className="mt-1 font-medium">{applied ? 'Verified' : 'Not verified — Applied로 표시하지 않음'}</dd></div>
      </dl>
    </article>
  )
}

function FindingsSection({ view }: { view: StockpulseFixedViewModel }) {
  return (
    <section aria-labelledby="findings-heading">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="findings-heading" className="text-xl font-bold">Findings</h2></div>
          <p className="mt-1 text-sm text-muted-foreground">재현 가능한 material result만 Recent Findings로 승격합니다.</p>
        </div>
        <span className="text-xs text-muted-foreground">{view.findings.length} promoted</span>
      </div>
      {view.findings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6"><p className="text-base font-semibold">아직 승격된 Finding이 없습니다.</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Day 1 성공 하나만으로는 material Finding을 만들지 않습니다. 후속 run과 재현 가능한 evidence가 쌓이면 이 영역과 `/labs` Recent Findings에 연결합니다.</p></div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">{view.findings.map((record, index) => <article key={`${textValue(record.finding_id)}-${index}`} className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/60 dark:bg-blue-950/15"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{textValue(record.title, 'Finding')}</h3><span className="text-xs text-muted-foreground">{textValue(record.status)}</span></div><p className="mt-2 text-sm leading-relaxed">{textValue(record.statement)}</p></article>)}</div>
      )}
    </section>
  )
}

function runDetailId(runId: string, suffix = ''): string {
  const safeId = runId.replace(/[^a-zA-Z0-9_-]/g, '-')
  return `stockpulse-run-detail-${safeId}${suffix ? `-${suffix}` : ''}`
}

function RunBoard({ views }: { views: StockpulseFixedViewModel[] }) {
  const [expandedRun, setExpandedRun] = useState<string | null>(views[0]?.run.run_id ?? null)
  const onToggle = (runId: string) => setExpandedRun(current => current === runId ? null : runId)

  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-border bg-white dark:bg-gray-900 md:block">
        <table className="min-w-[980px] w-full border-collapse text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Morning LLM</th><th className="px-4 py-3 font-medium">Market Result</th><th className="px-4 py-3 font-medium">LLM Result</th><th className="px-4 py-3 font-medium">ML Evaluation</th><th className="px-4 py-3 font-medium">Improvement</th><th className="px-4 py-3 font-medium">Reports</th><th className="px-4 py-3 font-medium">Detail</th></tr></thead>
          <tbody>
            {views.map(view => {
              const expanded = expandedRun === view.run.run_id
              const detailId = runDetailId(view.run.run_id)
              return (
                <Fragment key={view.run.run_id}>
                  <tr key={view.run.run_id} className="border-b border-border align-top"><td className="px-4 py-4 font-medium">{formatDate(view.date)}</td><td className="px-4 py-4"><strong>{view.snapshot.morning}</strong></td><td className="px-4 py-4"><strong>{view.snapshot.actual}</strong><span className="mt-1 block text-xs text-muted-foreground">{view.actualClose}</span></td><td className="px-4 py-4">{view.snapshot.llmResult === 'Correct' ? <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300"><Check className="h-4 w-4" aria-hidden="true" />Correct</span> : <span className="font-semibold">{view.snapshot.llmResult}</span>}</td><td className="px-4 py-4"><span className="font-medium">{view.run.ml_evaluation.evaluated_count}/{view.run.ml_evaluation.pending_count} · {titleCase(view.run.ml_evaluation.status)}</span></td><td className="px-4 py-4"><span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">{view.snapshot.improvement}</span></td><td className="px-4 py-4"><div className="flex min-w-44 flex-col gap-2"><Link href={view.publication.morning.href} className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 no-underline hover:underline dark:text-blue-300">Morning <ArrowUpRight className="h-3 w-3" aria-hidden="true" /></Link><Link href={view.publication.evening.href} className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 no-underline hover:underline dark:text-blue-300">Evening <ArrowUpRight className="h-3 w-3" aria-hidden="true" /></Link></div></td><td className="px-4 py-4"><button type="button" onClick={() => onToggle(view.run.run_id)} aria-expanded={expanded} aria-controls={detailId} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:border-blue-300 hover:text-blue-700 dark:hover:border-blue-700 dark:hover:text-blue-300">{expanded ? '접기' : '상세 보기'}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" /></button></td></tr>
                  {expanded && <tr key={`${view.run.run_id}-detail`}><td colSpan={8} className="p-3"><div id={detailId}><RunDetail view={view} /></div></td></tr>}
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
                <div className="flex items-center justify-between gap-3"><div><p className="text-xs text-muted-foreground">Date</p><p className="mt-1 font-semibold">{formatDate(view.date)}</p></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${view.snapshot.llmResult === 'Correct' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>{view.snapshot.llmResult}</span></div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-muted-foreground">Morning LLM</dt><dd className="mt-1 font-semibold">{view.snapshot.morning}</dd></div><div><dt className="text-xs text-muted-foreground">Market result</dt><dd className="mt-1 font-semibold">{view.snapshot.actual} · {view.actualClose}</dd></div><div><dt className="text-xs text-muted-foreground">ML evaluation</dt><dd className="mt-1 font-semibold">{view.run.ml_evaluation.evaluated_count}/{view.run.ml_evaluation.pending_count} · {titleCase(view.run.ml_evaluation.status)}</dd></div><div><dt className="text-xs text-muted-foreground">Improvement</dt><dd className="mt-1 font-semibold">{view.snapshot.improvement}</dd></div></dl>
                <div className="mt-4 grid grid-cols-2 gap-2"><Link href={view.publication.morning.href} className="inline-flex items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium no-underline hover:border-blue-300 hover:text-blue-700 dark:hover:border-blue-700 dark:hover:text-blue-300">Morning <ArrowUpRight className="h-3 w-3" aria-hidden="true" /></Link><Link href={view.publication.evening.href} className="inline-flex items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium no-underline hover:border-blue-300 hover:text-blue-700 dark:hover:border-blue-700 dark:hover:text-blue-300">Evening <ArrowUpRight className="h-3 w-3" aria-hidden="true" /></Link></div>
                <button type="button" onClick={() => onToggle(view.run.run_id)} aria-expanded={expanded} aria-controls={detailId} className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-foreground px-3 py-2.5 text-xs font-medium text-background">{expanded ? '상세 접기' : 'Run detail 열기'}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" /></button>
              </article>
              {expanded && <div id={detailId} className="mt-3"><RunDetail view={view} /></div>}
            </div>
          )
        })}
      </div>
    </>
  )
}

function titleCase(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1)
}

export function StockpulseV1FixedLab({ projection }: { projection: StockpulseFixedProjection }) {
  const views = projection.runs.records.map(run => getStockpulseFixedViewModel(projection, run))
  const view = views[0]
  if (!view) throw new Error('StockPulse V1 Fixed projection has no Run Board record')
  const runIds = views.map(item => item.run.run_id).join('|')

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <Link href="/labs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Labs 대시보드</Link>

        <header className="mt-6 overflow-hidden rounded-[1.75rem] bg-slate-950 text-white shadow-xl shadow-slate-950/10 md:mt-8">
          <div className="p-5 md:p-8">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300"><FlaskConical className="h-4 w-4" aria-hidden="true" />Experiment dashboard <span className="text-slate-600">·</span> StockPulse</div>
                <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">StockPulse V1 Fixed</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">Daily article reader가 아니라, 예측·실제 결과·평가·개선의 상태를 한 화면에서 확인하는 별도 Live Shadow Lab입니다.</p>
                <div className="mt-5 flex flex-wrap items-center gap-2 text-sm"><span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1.5 font-semibold text-emerald-300"><CircleDot className="h-3.5 w-3.5" aria-hidden="true" />Active</span><span className="rounded-full bg-white/10 px-3 py-1.5 text-slate-200">Live Shadow</span><span className="rounded-full bg-white/10 px-3 py-1.5 text-slate-200">{view.snapshot.dayLabel}</span><span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-emerald-200">{view.snapshot.stateLabel}</span><span className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-slate-300">Read-only snapshot</span></div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <SnapshotMetric label="Morning" value={view.snapshot.morning} note="LLM prediction" />
              <SnapshotMetric label="Actual" value={view.snapshot.actual} note={`KOSPI ${view.actualClose}`} tone="positive" />
              <SnapshotMetric label="LLM result" value={view.snapshot.llmResult} note="Morning vs actual" tone="positive" />
              <SnapshotMetric label="ML evaluation" value={view.snapshot.ml} note="evaluated 0 · pending 50" tone="warning" />
              <SnapshotMetric label="Improvement" value={view.snapshot.improvement} note="No evaluated failure" />
            </div>
          </div>
          <div className="border-t border-white/10 bg-white/[0.03] px-5 py-4 md:px-8"><div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="text-slate-400">Latest meaningful finding</span><span className="font-medium text-slate-200">{view.snapshot.finding}</span></div></div>
        </header>

        <main className="mt-8 space-y-12">
          <section aria-labelledby="run-board-heading">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div><div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="run-board-heading" className="text-xl font-bold">Run Board</h2></div><p className="mt-1 text-sm text-muted-foreground">하루별 article 목록이 아니라, 실제 실험 record를 요약합니다.</p></div>
              <span className="text-xs text-muted-foreground">{view.date} · {views.length} {views.length === 1 ? 'run' : 'runs'}</span>
            </div>

            <RunBoard key={runIds} views={views} />
          </section>

          <ImprovementLedger view={view} />
          <FindingsSection view={view} />

          <section aria-labelledby="publication-preview-heading">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="publication-preview-heading" className="text-xl font-bold">Morning / Evening publication</h2></div><p className="mt-1 text-sm text-muted-foreground">Lab에는 요약만 두고, 실제 report 원문은 static publication preview로 연결합니다.</p></div><Link href={`${STOCKPULSE_V1_FIXED_PUBLICATION_ROOT}/`} className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 no-underline hover:underline dark:text-blue-300">Publication home <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></Link></div>
            <div className="grid gap-3 sm:grid-cols-2"><ReportLink href={view.publication.morning.href} label="Morning report · 2026-09-02" status={view.publication.morning.status} /><ReportLink href={view.publication.evening.href} label="Evening report · 2026-09-02" status={view.publication.evening.status} /></div>
          </section>

          <section aria-labelledby="config-heading">
            <div className="mb-4 flex items-center gap-2"><Settings2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="config-heading" className="text-xl font-bold">Runtime evidence</h2></div>
            <details className="group rounded-2xl border border-border bg-white dark:bg-gray-900"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden"><span>Current effective config <span className="ml-2 text-xs font-normal text-muted-foreground">Evidence detail</span></span><ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" /></summary><div className="border-t border-border p-4"><pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-200">{jsonValue(view.effectiveConfig)}</pre><p className="mt-3 text-xs leading-relaxed text-muted-foreground">이 config는 현재 runtime snapshot이며 Day 1 improvement application으로 표시하지 않습니다.</p></div></details>
          </section>

          <section aria-labelledby="ia-relations-heading">
            <div className="mb-4 flex items-center gap-2"><Target className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="ia-relations-heading" className="text-xl font-bold">Project context &amp; relations</h2></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Link href="/labs" className="rounded-xl border border-border bg-white p-4 no-underline transition-colors hover:border-blue-300 dark:bg-gray-900 dark:hover:border-blue-700"><p className="text-xs text-muted-foreground">Hub</p><p className="mt-2 font-semibold">DevSnack Labs</p><p className="mt-1 text-xs text-muted-foreground">/labs · Active project</p></Link><Link href="/labs/stockpulse-ai-self-improvement" className="rounded-xl border border-border bg-white p-4 no-underline transition-colors hover:border-blue-300 dark:bg-gray-900 dark:hover:border-blue-700"><p className="text-xs text-muted-foreground">Historical relation</p><p className="mt-2 font-semibold">Completed V1</p><p className="mt-1 text-xs text-muted-foreground">기존 route 보존</p></Link><Link href="/stock" className="rounded-xl border border-border bg-white p-4 no-underline transition-colors hover:border-blue-300 dark:bg-gray-900 dark:hover:border-blue-700"><p className="text-xs text-muted-foreground">Data hub</p><p className="mt-2 font-semibold">StockPulse Feed</p><p className="mt-1 text-xs text-muted-foreground">/stock · unchanged</p></Link><Link href={`${STOCKPULSE_V1_FIXED_PUBLICATION_ROOT}/`} className="rounded-xl border border-border bg-white p-4 no-underline transition-colors hover:border-blue-300 dark:bg-gray-900 dark:hover:border-blue-700"><p className="text-xs text-muted-foreground">Published as</p><p className="mt-2 font-semibold">V1 Fixed · Live Shadow</p><p className="mt-1 text-xs text-muted-foreground">GitHub Pages publication</p></Link></div>
          </section>

          <footer className="border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground"><p className="flex items-center gap-2 font-medium text-foreground"><LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />Public boundary</p><p className="mt-2">이 화면은 public projection snapshot만 사용하며 private execution material과 raw model records를 투영하지 않습니다. Daily Lab slug는 생성하지 않습니다.</p></footer>
        </main>
      </div>
    </div>
  )
}
