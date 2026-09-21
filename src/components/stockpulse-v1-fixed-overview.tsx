import Link from 'next/link'
import { ArrowLeft, BarChart3, CheckCircle2, ExternalLink, FlaskConical } from 'lucide-react'
import { EditorialByline } from '@/components/editorial-byline'
import {
  STOCKPULSE_V1_FIXED_PUBLICATION_ROOT,
  type FixedProjectionRecord,
  type StockpulseFixedProjection,
} from '@/lib/stockpulse-v1-fixed'

function recordBoolean(record: FixedProjectionRecord, key: string): boolean {
  return record[key] === true
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

export function StockpulseV1FixedOverview({ projection }: { projection: StockpulseFixedProjection }) {
  const latest = projection.runs.records[0]
  const appliedCount = projection.improvements.records.filter(record => recordBoolean(record, 'actual_applied')).length
  const latestActual = latest?.actual_market_result.direction || '미확인'
  const latestLlm = latest?.llm_evaluation.success === true ? '맞음' : latest?.llm_evaluation.success === false ? '틀림' : '평가 대기'
  const mlPending = projection.snapshot.ml_evaluation_state !== 'evaluated'

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-10">
        <Link href="/labs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />Labs 대시보드
        </Link>

        <header className="mt-8 border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <FlaskConical className="h-4 w-4" aria-hidden="true" />StockPulse experiment · Editorial Summary
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">StockPulse V1 Fixed</h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
            AI가 KOSPI·KOSDAQ 방향을 예측하고 실제 장 마감 결과와 비교해, 다음 판단에 반영할 개선을 기록하는 Live Shadow 실험입니다.
          </p>
          <div className="mt-4"><EditorialByline context="lab" /></div>
        </header>

        <main className="mt-8 space-y-8">
          <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900/50 dark:bg-blue-950/20" aria-labelledby="project-summary-heading">
            <h2 id="project-summary-heading" className="text-xl font-bold">Project Summary</h2>
            <p className="mt-3 leading-relaxed">
              고정된 입력 snapshot에서 예측·실제 결과·평가·개선 적용을 분리해 관찰했습니다. 공개 페이지에는 독자가 확인할 수 있는 요약과 결과를 남기고, 날짜별 원자료 Run Board는 별도 운영 surface로 분리했습니다.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={`${STOCKPULSE_V1_FIXED_PUBLICATION_ROOT}/`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-sm text-background no-underline hover:opacity-80">Publication 보기 <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>
              <Link href="/labs/stockpulse-v1-fixed/runs" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm no-underline hover:border-blue-300 hover:text-blue-700 dark:hover:border-blue-700 dark:hover:text-blue-300">운영 Run Board 보기 <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" /></Link>
            </div>
          </section>

          <section aria-labelledby="verified-finding-heading">
            <div className="mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" /><h2 id="verified-finding-heading" className="text-xl font-bold">현재까지의 Finding</h2></div>
            <div className="rounded-xl border border-border bg-white p-5 leading-relaxed dark:bg-gray-900">
              {projection.runs.records.length}회 run과 {projection.snapshot.improvement_cycles}회의 개선 cycle을 운영했고, {appliedCount}개의 적용 결과를 공개 projection에 반영했습니다. 다만 현재 ML 평가가 아직 완료되지 않아, 개선 전략이 예측 정확도를 높였다는 결론까지는 확정하지 않습니다.
            </div>
          </section>

          <section aria-labelledby="key-results-heading">
            <div className="mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /><h2 id="key-results-heading" className="text-xl font-bold">핵심 결과</h2></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs text-muted-foreground">최근 run</p><p className="mt-2 text-xl font-bold">{latest ? formatDate(latest.trading_date) : '—'}</p></div>
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs text-muted-foreground">최근 실제 방향</p><p className="mt-2 text-xl font-bold">{latestActual}</p></div>
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs text-muted-foreground">최근 LLM 평가</p><p className="mt-2 text-xl font-bold">{latestLlm}</p></div>
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs text-muted-foreground">ML 평가</p><p className="mt-2 text-xl font-bold">{mlPending ? `${projection.snapshot.ml_prediction_count}개 대기` : `${projection.snapshot.ml_evaluated}개 완료`}</p></div>
            </div>
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/50 dark:bg-amber-950/20" aria-labelledby="limitations-heading">
            <h2 id="limitations-heading" className="text-xl font-bold">한계와 해석 범위</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">
              <li>ML 예측 {projection.snapshot.ml_prediction_count}개는 아직 평가 상태가 완료되지 않았습니다.</li>
              <li>현재 결과는 공개 projection 기준이며, 날짜별 원자료와 운영 세부 기록은 검색 색인에서 분리했습니다.</li>
              <li>짧은 운영 구간과 평가 대기 상태 때문에 개선 cycle의 인과 효과를 일반화하기 어렵습니다.</li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  )
}
