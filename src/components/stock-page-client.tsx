'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { BlogHeader } from '@/components/blog-header'
import { Pagination } from '@/components/pagination'
import { stockpulseV1ExternalReports, type StockPulseExternalReport, type StockPulseReportType } from '@/lib/stockpulse-migration'

const PAGE_SIZE = 24
const allReports = stockpulseV1ExternalReports

const TYPE_LABEL: Record<StockPulseReportType, string> = {
  morning: 'Morning',
  close: 'Market Close',
  daily: 'Daily Report',
}

function getPage(value: string | null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
}

function getMonthRange(month?: string) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return null
  const [year, monthNumber] = month.split('-').map(Number)
  if (monthNumber < 1 || monthNumber > 12) return null
  const next = monthNumber === 12 ? `${year + 1}-01` : `${year}-${String(monthNumber + 1).padStart(2, '0')}`
  return { start: `${month}-01`, end: `${next}-01` }
}

function getReports(page: number, type?: StockPulseReportType, month?: string, query?: string) {
  let filtered = allReports
  if (type) filtered = filtered.filter(report => report.report_type === type)
  const range = getMonthRange(month)
  if (range) filtered = filtered.filter(report => report.report_date >= range.start && report.report_date < range.end)
  if (query) {
    const needle = query.trim().toLowerCase()
    filtered = filtered.filter(report => `${report.title} ${report.excerpt}`.toLowerCase().includes(needle))
  }
  const from = (page - 1) * PAGE_SIZE
  return { reports: filtered.slice(from, from + PAGE_SIZE), count: filtered.length }
}

function reportBadges(report: StockPulseExternalReport) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">{TYPE_LABEL[report.report_type]}</span>
      {report.migration_class === 'duplicate_candidate' && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">duplicate candidate</span>}
      {report.lifecycle_status === 'consolidated' && <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">consolidated</span>}
    </div>
  )
}

function ReportCard({ report }: { report: StockPulseExternalReport }) {
  return (
    <a href={report.external_url} className="group block rounded-xl border border-border bg-white p-4 no-underline transition-all hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md dark:bg-gray-900 dark:hover:border-green-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">{reportBadges(report)}</div>
        <span className="shrink-0 text-xs text-muted-foreground">{report.report_date}</span>
      </div>
      <h3 className="mt-3 line-clamp-2 font-semibold leading-snug text-foreground transition-colors group-hover:text-green-600 dark:group-hover:text-green-400">{report.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{report.excerpt}</p>
      <p className="mt-3 text-xs font-medium text-green-700 dark:text-green-300">GitHub Pages에서 읽기 →</p>
    </a>
  )
}

function StockPulseHubView({ page, type, month, query }: { page: number; type?: StockPulseReportType; month?: string; query?: string }) {
  const { reports, count } = getReports(page, type, month, query)
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const months = [...new Set(allReports.map(report => report.report_date.slice(0, 7)))].sort().reverse()

  return (
    <div className="min-h-screen bg-background">
      <BlogHeader title="StockPulse" subtitle="Daily market publication · KOSPI / KOSDAQ" icon="trending" color="green" />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="rounded-2xl border border-green-200 bg-green-50/60 p-6 dark:border-green-900/50 dark:bg-green-950/20 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-green-700 dark:text-green-300">StockPulse v1 archive</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-4xl">매일 읽는 한국 증시 리포트</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">Daily Report 전문은 GitHub Pages publication에서 보존합니다. 이 페이지는 DevSnack의 Feed Hub이자 Archive Gateway로서 최신 Report와 외부 원문을 연결합니다.</p>
          <div className="mt-5 rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            <strong>현재 상태: v1 실험 종료 · Daily Feed 발행 중단</strong>
            <span className="mt-1 block">StockPulse v1은 예측→실제 결과 평가→LLM/ML 비교→개선 시도 루프를 구축했습니다. 다만 개선 전략의 실제 효과는 충분히 규명하지 못했으며, v2는 재설계 후 별도 Lab으로 시작합니다.</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href="https://gdevsnack-ai-labs.github.io/stockpulse-publication/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-lg bg-green-700 px-3 py-2 text-sm font-medium text-white no-underline hover:bg-green-800">StockPulse Publication</a>
            <a href="https://gdevsnack-ai-labs.github.io/stockpulse-publication/archive/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-lg border border-green-300 px-3 py-2 text-sm font-medium text-green-800 no-underline hover:bg-green-100 dark:border-green-800 dark:text-green-200 dark:hover:bg-green-900/30">전체 Archive</a>
            <Link href="/labs/stockpulse-ai-self-improvement" className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm font-medium no-underline hover:border-green-300 hover:text-green-700 dark:hover:border-green-700 dark:hover:text-green-300">v1 실험 결과</Link>
          </div>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-4" aria-label="StockPulse archive summary">
          {[
            ['Daily Reports', '68', 'v1 전체 보존'],
            ['Morning', '32', '전망 Report'],
            ['Market Close', '24', '장 마감 Report'],
            ['General Daily', '12', 'legacy 일반 시황'],
          ].map(([label, value, note]) => (
            <div key={label} className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>
          ))}
        </section>

        <section className="mt-10" aria-labelledby="stockpulse-reports-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 id="stockpulse-reports-heading" className="text-2xl font-bold">v1 Report Archive</h2><p className="mt-1 text-sm text-muted-foreground">외부 publication의 날짜별 원문으로 이동합니다.</p></div><p className="text-sm text-muted-foreground">{count}개 · {page}/{totalPages}페이지</p></div>
          <div className="mb-5 flex flex-wrap gap-2 rounded-xl border border-border bg-muted/30 p-3">
            <Link href="/stock" className={`rounded-lg px-3 py-1.5 text-sm no-underline ${!type && !month && !query ? 'bg-foreground text-background' : 'hover:bg-muted'}`}>전체</Link>
            {(['morning', 'close', 'daily'] as StockPulseReportType[]).map(key => <Link key={key} href={`/stock?type=${key}`} className={`rounded-lg px-3 py-1.5 text-sm no-underline ${type === key ? 'bg-foreground text-background' : 'hover:bg-muted'}`}>{TYPE_LABEL[key]}</Link>)}
            <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">월<select defaultValue={month || ''} onChange={event => { window.location.href = event.target.value ? `/stock?month=${event.target.value}` : '/stock' }} className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"><option value="">전체</option>{months.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
          </div>
          {reports.length === 0 ? <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">해당 조건의 Report가 없습니다.</p> : <div className="grid gap-4">{reports.map(report => <ReportCard key={`${report.source_record_id}-${report.target_path}`} report={report} />)}</div>}
          <Pagination page={page} totalPages={totalPages} searchParams={{ type, month, query }} />
        </section>
      </main>
    </div>
  )
}

function StockPulseHubQueryView() {
  const searchParams = useSearchParams()
  const rawType = searchParams.get('type')
  const type = rawType === 'morning' || rawType === 'close' || rawType === 'daily' ? rawType : undefined
  return <StockPulseHubView page={getPage(searchParams.get('page'))} type={type} month={searchParams.get('month') || undefined} query={searchParams.get('query') || undefined} />
}

export function StockPageClient() {
  return <Suspense fallback={<StockPulseHubView page={1} />}><StockPulseHubQueryView /></Suspense>
}
