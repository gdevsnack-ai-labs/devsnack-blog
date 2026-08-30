'use client'

import { useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Database,
  Layers3,
  RefreshCw,
  Server,
} from 'lucide-react'
import type { HermesUsageReport, HermesUsageRow } from '@/lib/hermes-usage'

interface HermesUsageDashboardProps {
  report: HermesUsageReport
  capturedAt: string
  isStale: boolean
}

type Granularity = 'daily' | 'weekly' | 'monthly'
type Range = '30' | '90' | 'all'

const numberFormat = new Intl.NumberFormat('ko-KR')

function formatNumber(value: number | undefined | null): string {
  return numberFormat.format(Number(value || 0))
}

function formatCompact(value: number | undefined | null): string {
  const number = Number(value || 0)
  const absolute = Math.abs(number)
  if (absolute >= 1_000_000_000) return `${(number / 1_000_000_000).toFixed(2)}B`
  if (absolute >= 1_000_000) return `${(number / 1_000_000).toFixed(2)}M`
  if (absolute >= 1_000) return `${(number / 1_000).toFixed(1)}K`
  return formatNumber(number)
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function Card({ icon: Icon, label, value, detail, tone }: {
  icon: typeof Activity
  label: string
  value: string
  detail: string
  tone: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{detail}</p>
    </div>
  )
}

function BreakdownTable({ title, rows, dimension }: {
  title: string
  rows: HermesUsageRow[]
  dimension: 'model' | 'source' | 'task' | 'provider'
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="px-2 py-2 font-medium">{dimension === 'model' ? '모델' : dimension === 'source' ? 'Source' : dimension === 'task' ? 'Task' : 'Provider'}</th>
              <th className="px-2 py-2 text-right font-medium">전체 토큰</th>
              <th className="px-2 py-2 text-right font-medium">Input + Output</th>
              <th className="px-2 py-2 text-right font-medium">Calls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.slice(0, 12).map((row, index) => {
              const label = row[dimension] || (dimension === 'task' ? '(main)' : '(unknown)')
              return (
                <tr key={`${dimension}-${label}-${index}`} className="hover:bg-muted/30">
                  <td className="max-w-[220px] truncate px-2 py-2.5 font-medium" title={label}>{label}</td>
                  <td className="px-2 py-2.5 text-right font-mono text-xs">{formatCompact(row.total_tokens)}</td>
                  <td className="px-2 py-2.5 text-right font-mono text-xs text-muted-foreground">{formatCompact((row.input_tokens || 0) + (row.output_tokens || 0))}</td>
                  <td className="px-2 py-2.5 text-right font-mono text-xs text-muted-foreground">{formatNumber(row.api_calls)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="py-5 text-center text-sm text-muted-foreground">데이터가 없습니다.</p>}
      </div>
    </section>
  )
}

function TrendBars({ rows }: { rows: Array<{ period: string; total_tokens: number }> }) {
  const max = Math.max(1, ...rows.map(row => row.total_tokens))
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex min-w-[680px] items-end gap-1.5" style={{ height: 250 }}>
        {rows.map(row => {
          const height = Math.max(4, Math.round((row.total_tokens / max) * 190))
          return (
            <div key={row.period} className="flex h-full min-w-[18px] flex-1 flex-col items-center justify-end gap-2">
              <span className="text-[9px] text-muted-foreground">{formatCompact(row.total_tokens)}</span>
              <div className="w-full max-w-8 rounded-t bg-blue-500 transition-all dark:bg-blue-400" style={{ height }} title={`${row.period}: ${formatNumber(row.total_tokens)} tokens`} />
              <span className="whitespace-nowrap text-[9px] text-muted-foreground">{row.period}</span>
            </div>
          )
        })}
      </div>
      {rows.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">표시할 추이 데이터가 없습니다.</p>}
    </div>
  )
}

export function HermesUsageDashboard({ report, capturedAt, isStale }: HermesUsageDashboardProps) {
  const [granularity, setGranularity] = useState<Granularity>('daily')
  const [range, setRange] = useState<Range>('30')
  const [model, setModel] = useState('all')
  const usage = report.metadata
  const models = useMemo(() => report.model_totals.map(row => row.model).filter((value): value is string => !!value), [report.model_totals])

  const trendRows = useMemo(() => {
    const selectedRows = report[granularity].filter(row => model === 'all' || row.model === model)
    const byPeriod = new Map<string, number>()
    for (const row of selectedRows) byPeriod.set(row.period || '(unknown)', (byPeriod.get(row.period || '(unknown)') || 0) + row.total_tokens)
    const all = Array.from(byPeriod, ([period, total_tokens]) => ({ period, total_tokens }))
    if (range === 'all') return all
    return all.slice(-Number(range))
  }, [granularity, model, range, report])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-gradient-to-b from-background to-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                  <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" /> DevSnack AI Lab
                </span>
                <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">Aggregate only</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">DevSnack 모델 사용량</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                DevSnack AI Lab에서 사용하는 모델별 토큰 사용량을 확인합니다. 현재 공개 snapshot은 프로필·채널·작업을 구분하지 않는 aggregate이며, 화면에는 모델·토큰·호출 수만 익명 집계로 표시합니다.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> 마지막 수집</div>
              <p className="mt-1 font-medium">{formatDate(capturedAt)}</p>
              <p className="mt-1 text-xs text-muted-foreground">12시간마다 · KST 00:00 / 12:00</p>
            </div>
          </div>

          {isStale && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div><p className="font-medium">마지막 스냅샷이 예상 수집 주기보다 오래됐어요.</p><p className="mt-1 text-xs opacity-80">현재 화면은 마지막으로 확인된 정상 데이터입니다.</p></div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-6 md:py-10">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6" aria-label="DevSnack model usage summary">
          <Card icon={Activity} label="전체 기록 토큰" value={formatCompact(usage.usage_token_totals.total_tokens)} detail="Input + Output + Cache" tone="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
          <Card icon={Layers3} label="Input + Output" value={formatCompact(usage.usage_token_totals.input_tokens + usage.usage_token_totals.output_tokens)} detail="대화 생성 기준" tone="bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400" />
          <Card icon={Database} label="Cache Read" value={formatCompact(usage.usage_token_totals.cache_read_tokens)} detail="캐시 읽기 토큰" tone="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" />
          <Card icon={Server} label="Reasoning" value={formatCompact(usage.usage_token_totals.reasoning_tokens)} detail="전체 합계와 별도" tone="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
          <Card icon={Clock3} label="API Calls" value={formatCompact(usage.usage_token_totals.api_calls)} detail="기록된 호출 수" tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
          <Card icon={CheckCircle2} label="Sessions" value={formatCompact(usage.session_count)} detail={`${formatNumber(models.length)}개 모델`} tone="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" />
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" /><h2 className="text-lg font-bold">사용량 추이</h2></div>
              <p className="mt-1 text-sm text-muted-foreground">선택한 모델의 세션 시작일 기준 토큰 합계입니다.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <label className="flex items-center gap-2"><span className="text-xs text-muted-foreground">단위</span><select value={granularity} onChange={event => setGranularity(event.target.value as Granularity)} className="rounded-lg border border-border bg-background px-2.5 py-2"><option value="daily">일별</option><option value="weekly">주별</option><option value="monthly">월별</option></select></label>
              <label className="flex items-center gap-2"><span className="text-xs text-muted-foreground">기간</span><select value={range} onChange={event => setRange(event.target.value as Range)} className="rounded-lg border border-border bg-background px-2.5 py-2"><option value="30">최근 30개</option><option value="90">최근 90개</option><option value="all">전체</option></select></label>
              <label className="flex items-center gap-2"><span className="text-xs text-muted-foreground">모델</span><select value={model} onChange={event => setModel(event.target.value)} className="max-w-[230px] rounded-lg border border-border bg-background px-2.5 py-2"><option value="all">전체 모델</option>{models.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
            </div>
          </div>
          <div className="mt-5"><TrendBars rows={trendRows} /></div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <BreakdownTable title="모델별 누적 토큰 사용량" rows={report.model_totals} dimension="model" />
        </section>

        <section className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-100">
          <h2 className="font-semibold">집계 방법</h2>
          <p className="mt-2 leading-relaxed">전체 기록 토큰은 <code className="rounded bg-blue-100 px-1 py-0.5 text-xs dark:bg-blue-900/50">input + output + cache_read + cache_write</code>입니다. Reasoning tokens는 별도 기록이며 합계에 중복 포함하지 않습니다. 수집기가 API 호출별 토큰 시각을 보존하지 않으므로 일별 데이터는 세션 시작일(KST)에 배정됩니다.</p>
        </section>
      </main>
    </div>
  )
}
