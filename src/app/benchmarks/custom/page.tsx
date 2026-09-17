import Link from 'next/link'
import { Archive, ArrowLeft, BookOpen } from 'lucide-react'
import { BenchmarkResultCard } from '@/components/benchmark-result-card'
import { HubHeader } from '@/components/hub-header'
import { LegacyBenchmarkSourceCard } from '@/components/legacy-benchmark-source-card'
import { RelatedAssets } from '@/components/related-assets'
import { getReclassifiedBenchmarkPosts } from '@/lib/ia/hub-data'
import { BENCHMARK_PROJECTIONS, getRelatedAssets, projectLegacyBenchmarkPosts } from '@/lib/ia/hub-projections'
import { absoluteSiteUrl, buildRouteMetadata } from '@/lib/seo/metadata'
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd, buildJsonLdGraph } from '@/lib/seo/structured-data'

export const revalidate = 60

export const metadata = buildRouteMetadata({
  title: 'Custom Benchmarks — DevSnack',
  description: '표준 7-suite Benchmark에 포함하지 않는 특정 모델·사용 사례·serving·품질·심층 분석 측정과 DevSnack 원문',
  canonicalPath: '/benchmarks/custom',
  language: 'ko',
  section: 'Benchmarks',
  keywords: ['custom benchmark', 'DGX Spark', 'GB10', 'local LLM benchmark', 'GGUF', 'llama.cpp', 'Qwen', 'Ornith', 'North Mini', 'Nex-N2-mini'],
})

const CATEGORY_META = [
  { id: 'llm' as const, label: 'LLM', description: '모델·양자화·실사용 성능' },
  { id: 'inference' as const, label: 'Inference', description: 'prefill·decode·speculative decoding' },
  { id: 'hardware' as const, label: 'Hardware', description: '장비와 메모리 환경' },
  { id: 'generative-ai' as const, label: 'Generative AI', description: '이미지·영상·음악 생성 측정' },
]

function familyAnchor(family: string): string {
  return `benchmark-family-${family.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

export default async function CustomBenchmarksPage() {
  const customBenchmarks = projectLegacyBenchmarkPosts(await getReclassifiedBenchmarkPosts())
  const archiveCountForCategory = (category: typeof CATEGORY_META[number]['id']) => {
    const currentArchiveCount = BENCHMARK_PROJECTIONS.filter(benchmark => benchmark.categoryIds.includes(category)).length
    const customArchiveCount = customBenchmarks.filter(benchmark => {
      const domains = benchmark.asset.domain || []
      if (category === 'llm') return domains.includes('llm')
      if (category === 'inference') return domains.includes('inference')
      if (category === 'hardware') return domains.includes('hardware')
      return domains.includes('creative_ai')
    }).length
    return currentArchiveCount + customArchiveCount
  }
  const availableCategories = CATEGORY_META.filter(category => archiveCountForCategory(category.id) > 0)
  const benchmarkFamilies = Array.from(
    BENCHMARK_PROJECTIONS.reduce((groups, benchmark) => {
      const current = groups.get(benchmark.family) || []
      current.push(benchmark)
      groups.set(benchmark.family, current)
      return groups
    }, new Map<string, typeof BENCHMARK_PROJECTIONS>()),
  )
  const related = getRelatedAssets('project:local-llm-benchmark')
  const relatedKnowledge = Array.from(
    new Map(BENCHMARK_PROJECTIONS.flatMap(benchmark => benchmark.relatedKnowledge).map(knowledge => [knowledge.href, knowledge])).values(),
  )
  const archiveUrl = absoluteSiteUrl('/benchmarks/custom')
  const jsonLd = buildJsonLdGraph(
    buildCollectionPageJsonLd({
      name: 'Custom Benchmarks',
      description: '표준 7-suite Benchmark에 포함하지 않는 특정 모델·사용 사례·serving·품질·심층 분석 기록 모음',
      url: archiveUrl,
      language: 'ko',
      section: 'Benchmarks',
      breadcrumbs: [],
      parts: [
        ...BENCHMARK_PROJECTIONS.map((benchmark, index) => ({ name: benchmark.title, url: absoluteSiteUrl(benchmark.contentHref), position: index + 1 })),
        ...customBenchmarks.map((benchmark, index) => ({ name: benchmark.title, url: absoluteSiteUrl(benchmark.href), position: BENCHMARK_PROJECTIONS.length + index + 1 })),
      ],
    }),
    buildBreadcrumbJsonLd([
      { name: '홈', url: absoluteSiteUrl('/') },
      { name: 'Benchmarks', url: absoluteSiteUrl('/benchmarks') },
      { name: 'Custom Benchmarks', url: archiveUrl },
    ], 'ko'),
  )

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <Link href="/benchmarks" className="inline-flex items-center gap-1 text-sm text-muted-foreground no-underline hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Benchmarks로 돌아가기</Link>
        <div className="mt-6">
          <HubHeader
            eyebrow="Custom Measurements"
            title="Custom Benchmarks"
            description="표준 7-suite Benchmark에 포함하지 않는 특정 모델·사용 사례·serving·품질·심층 분석 측정과 DevSnack 원문입니다. 각 결과는 고유한 protocol을 사용하므로 표준 Benchmark와 직접 순위를 비교하지 않습니다."
            icon={Archive}
          />
        </div>

        <main className="mt-8 space-y-10">
          <section aria-labelledby="archive-overview-heading" className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/60 dark:bg-amber-950/20 md:p-6">
            <h2 id="archive-overview-heading" className="text-lg font-bold">Custom Benchmark를 보는 방법</h2>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">아래 결과는 표준 7-suite matrix에 넣기 어려운 특정 모델·사용 사례·serving·품질 측정입니다. 각 글의 고유한 조건과 목적을 확인하고, 표준 Benchmark와는 별도의 결과로 해석해 주세요.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {availableCategories.map(category => <div key={category.id} className="rounded-xl border border-amber-200/80 bg-white/70 p-4 dark:border-amber-900/60 dark:bg-gray-950/30"><p className="text-sm font-bold">{category.label}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{category.description}</p><p className="mt-3 text-2xl font-bold">{archiveCountForCategory(category.id)}<span className="ml-1 text-xs font-normal text-muted-foreground">custom</span></p></div>)}
            </div>
          </section>

          <section aria-labelledby="custom-results-heading">
            <div className="mb-4">
              <h2 id="custom-results-heading" className="text-xl font-bold">Custom Benchmark Results</h2>
              <p className="mt-1 text-sm text-muted-foreground">표준 suite 밖에서 특정 모델이나 사용 사례를 깊게 살펴본 개별 결과입니다.</p>
            </div>
            {benchmarkFamilies.length > 0 ? <div className="space-y-8">{benchmarkFamilies.map(([family, items]) => <section key={family} id={familyAnchor(family)} className="scroll-mt-6" aria-labelledby={`${familyAnchor(family)}-heading`}><div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h3 id={`${familyAnchor(family)}-heading`} className="text-lg font-bold">{family}</h3><p className="mt-1 text-xs text-muted-foreground">{items.map(item => item.measurement).join(' · ')}</p></div><span className="text-xs text-muted-foreground">{items.length} custom result</span></div><div className="space-y-4">{items.map(benchmark => <BenchmarkResultCard key={benchmark.asset.assetId} benchmark={benchmark} />)}</div></section>)}</div> : <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No custom benchmark yet</div>}
          </section>

          {customBenchmarks.length > 0 && <section aria-labelledby="custom-articles-heading"><div className="mb-4"><h2 id="custom-articles-heading" className="text-xl font-bold">Individual Benchmark Articles</h2><p className="mt-1 text-sm text-muted-foreground">특정 모델과 사용 사례를 다룬 개별 DevSnack benchmark 원문입니다.</p></div><div className="grid gap-4 md:grid-cols-2">{customBenchmarks.map(benchmark => <LegacyBenchmarkSourceCard key={benchmark.asset.assetId} benchmark={benchmark} />)}</div></section>}

          <section className="rounded-2xl border border-border bg-muted/30 p-5 md:p-6" aria-labelledby="archive-knowledge-heading">
            <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="archive-knowledge-heading" className="text-lg font-bold">Related Knowledge</h2></div>
            <div className="mt-4 flex flex-wrap gap-2">{relatedKnowledge.map(knowledge => <Link key={knowledge.href} href={knowledge.href} className="rounded-lg border border-border bg-white px-3 py-2 text-sm no-underline hover:border-blue-300 hover:text-blue-600 dark:bg-gray-900 dark:hover:border-blue-700 dark:hover:text-blue-400">{knowledge.title}</Link>)}</div>
          </section>

          <RelatedAssets links={related} title="Relations from the Benchmark Project" />
        </main>
      </div>
    </div>
  )
}
