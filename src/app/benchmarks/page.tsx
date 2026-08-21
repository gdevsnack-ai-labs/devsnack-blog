import type { Metadata } from 'next'
import Link from 'next/link'
import { BarChart3, BookOpen, FlaskConical } from 'lucide-react'
import { BenchmarkResultCard } from '@/components/benchmark-result-card'
import { HubHeader } from '@/components/hub-header'
import { RelatedAssets } from '@/components/related-assets'
import { BENCHMARK_PROJECTIONS, getBenchmarksByCategory, getRelatedAssets } from '@/lib/ia/hub-projections'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Benchmarks — DevSnack',
  description: '실행 조건과 측정 프로토콜을 공개한 DevSnack Benchmark 결과 모음',
}

const CATEGORY_META = [
  { id: 'llm' as const, label: 'LLM', description: '모델·양자화·실사용 성능' },
  { id: 'inference' as const, label: 'Inference', description: 'prefill·decode·speculative decoding' },
  { id: 'hardware' as const, label: 'Hardware', description: '장비와 메모리 환경' },
  { id: 'generative-ai' as const, label: 'Generative AI', description: '이미지·영상·음악 생성 측정' },
]

export default function BenchmarksPage() {
  const availableCategories = CATEGORY_META.filter(category => getBenchmarksByCategory(category.id).length > 0)
  const related = getRelatedAssets('project:local-llm-benchmark')

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <HubHeader
          eyebrow="Measured Results"
          title="Benchmarks"
          description="조건을 고정하고 직접 측정한 결과를 모읍니다. Research 자료나 계획이 아니라, Target·Environment·Protocol·Result를 확인할 수 있는 published benchmark만 보여줍니다."
          icon={BarChart3}
        />

        <section className="mt-8 rounded-2xl border border-border bg-white p-5 dark:bg-gray-900 md:p-6" aria-labelledby="benchmark-start-heading">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"><FlaskConical className="h-5 w-5" aria-hidden="true" /></div>
            <div>
              <h2 id="benchmark-start-heading" className="text-lg font-bold">정식 Benchmark의 기준</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Target, Environment, Method / Protocol, Baseline, Result, Comparison, Interpretation, Limitations가 확인되는 경우에만 이 영역에 올립니다.</p>
            </div>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="benchmark-collections-heading">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 id="benchmark-collections-heading" className="text-xl font-bold">Collections</h2>
              <p className="mt-1 text-sm text-muted-foreground">현재 published result가 있는 측정 영역만 표시합니다.</p>
            </div>
            <span className="text-xs text-muted-foreground">{BENCHMARK_PROJECTIONS.length} result</span>
          </div>
          {availableCategories.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {availableCategories.map(category => {
                const count = getBenchmarksByCategory(category.id).length
                return (
                  <div key={category.id} className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900">
                    <p className="text-sm font-bold">{category.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{category.description}</p>
                    <p className="mt-3 text-2xl font-bold">{count}<span className="ml-1 text-xs font-normal text-muted-foreground">published</span></p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No published benchmark yet</div>
          )}
        </section>

        <section className="mt-10" aria-labelledby="recent-benchmarks-heading">
          <div className="mb-4">
            <h2 id="recent-benchmarks-heading" className="text-xl font-bold">Latest Result</h2>
            <p className="mt-1 text-sm text-muted-foreground">가장 최근에 검증된 Benchmark Asset입니다.</p>
          </div>
          {BENCHMARK_PROJECTIONS.length > 0 ? (
            <div className="space-y-4">
              {BENCHMARK_PROJECTIONS.map(benchmark => <BenchmarkResultCard key={benchmark.asset.assetId} benchmark={benchmark} />)}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No published benchmark yet</div>
          )}
        </section>

        <section className="mt-10 rounded-2xl border border-border bg-muted/30 p-5 md:p-6" aria-labelledby="benchmark-knowledge-heading">
          <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="benchmark-knowledge-heading" className="text-lg font-bold">Related Knowledge</h2></div>
          <div className="mt-4 flex flex-wrap gap-2">
            {BENCHMARK_PROJECTIONS.flatMap(benchmark => benchmark.relatedKnowledge).map(knowledge => (
              <Link key={knowledge.href} href={knowledge.href} className="rounded-lg border border-border bg-white px-3 py-2 text-sm no-underline hover:border-blue-300 hover:text-blue-600 dark:bg-gray-900 dark:hover:border-blue-700 dark:hover:text-blue-400">{knowledge.title}</Link>
            ))}
          </div>
        </section>

        <RelatedAssets links={related} title="Relations from the Benchmark Project" />
      </div>
    </div>
  )
}
