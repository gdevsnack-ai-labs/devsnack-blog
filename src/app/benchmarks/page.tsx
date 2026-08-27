import Link from 'next/link'
import { BarChart3, BookOpen, CheckCircle2, FlaskConical } from 'lucide-react'
import { BenchmarkResultCard } from '@/components/benchmark-result-card'
import { HubHeader } from '@/components/hub-header'
import { RelatedAssets } from '@/components/related-assets'
import { LegacyBenchmarkSourceCard } from '@/components/legacy-benchmark-source-card'
import { getReclassifiedBenchmarkPosts } from '@/lib/ia/hub-data'
import { BENCHMARK_OVERVIEW, BENCHMARK_PROJECTIONS, getBenchmarksByCategory, getRelatedAssets, projectLegacyBenchmarkPosts } from '@/lib/ia/hub-projections'
import { buildRouteMetadata, absoluteSiteUrl } from '@/lib/seo/metadata'
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd, buildJsonLdGraph } from '@/lib/seo/structured-data'

export const revalidate = 60

export const metadata = buildRouteMetadata({
  title: 'Benchmarks — DevSnack',
  description: '실행 조건과 측정 프로토콜을 공개한 DevSnack Benchmark 결과 모음',
  canonicalPath: '/benchmarks',
  language: 'ko',
  koreanPath: '/benchmarks',
  englishPath: '/en/benchmarks',
  section: 'Benchmarks',
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

export default async function BenchmarksPage() {
  const legacyBenchmarks = projectLegacyBenchmarkPosts(await getReclassifiedBenchmarkPosts())
  const legacyCountForCategory = (category: typeof CATEGORY_META[number]['id']) => legacyBenchmarks.filter(benchmark => {
    const domains = benchmark.asset.domain || []
    if (category === 'llm') return domains.includes('llm')
    if (category === 'inference') return domains.includes('inference')
    if (category === 'hardware') return domains.includes('hardware')
    return domains.includes('creative_ai')
  }).length
  const countForCategory = (category: typeof CATEGORY_META[number]) => getBenchmarksByCategory(category.id).length + legacyCountForCategory(category.id)
  const availableCategories = CATEGORY_META.filter(category => countForCategory(category) > 0)
  const related = getRelatedAssets('project:local-llm-benchmark')
  const relatedKnowledge = Array.from(
    new Map(BENCHMARK_PROJECTIONS.flatMap(benchmark => benchmark.relatedKnowledge).map(knowledge => [knowledge.href, knowledge])).values(),
  )
  const benchmarkFamilies = Array.from(
    BENCHMARK_PROJECTIONS.reduce((groups, benchmark) => {
      const current = groups.get(benchmark.family) || []
      current.push(benchmark)
      groups.set(benchmark.family, current)
      return groups
    }, new Map<string, typeof BENCHMARK_PROJECTIONS>()),
  )
  const jsonLd = buildJsonLdGraph(
    buildCollectionPageJsonLd({
      name: 'DevSnack Benchmarks',
      description: '실행 조건과 측정 프로토콜을 공개한 DevSnack Benchmark 결과 모음',
      url: absoluteSiteUrl('/benchmarks'),
      language: 'ko',
      section: 'Benchmarks',
      breadcrumbs: [],
      parts: [
        ...BENCHMARK_PROJECTIONS.map((benchmark, index) => ({ name: benchmark.title, url: absoluteSiteUrl(benchmark.contentHref), position: index + 1 })),
        ...legacyBenchmarks.map((benchmark, index) => ({ name: benchmark.title, url: absoluteSiteUrl(benchmark.href), position: BENCHMARK_PROJECTIONS.length + index + 1 })),
      ],
    }),
    buildBreadcrumbJsonLd([
      { name: '홈', url: absoluteSiteUrl('/') },
      { name: 'Benchmarks', url: absoluteSiteUrl('/benchmarks') },
    ], 'ko'),
  )

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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

        <section className="mt-8 rounded-2xl border border-border bg-white p-5 dark:bg-gray-900 md:p-6" aria-labelledby="benchmark-overview-heading">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"><CheckCircle2 className="h-5 w-5" aria-hidden="true" /></div>
            <div>
              <h2 id="benchmark-overview-heading" className="text-lg font-bold">Evaluation Overview</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">실제 production 입력을 고정하고, hard contract와 외부 one-shot calibration을 분리해 읽는 총괄 페이지입니다.</p>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-muted/40 p-4"><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Target</dt><dd className="mt-1 text-sm font-semibold">{BENCHMARK_OVERVIEW.protocol.target}</dd></div>
            <div className="rounded-xl bg-muted/40 p-4"><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fixed fixtures</dt><dd className="mt-1 text-sm font-semibold">{BENCHMARK_OVERVIEW.protocol.fixtureCount} · {BENCHMARK_OVERVIEW.protocol.fixtures.join(' / ')}</dd></div>
            <div className="rounded-xl bg-muted/40 p-4"><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">External lane</dt><dd className="mt-1 text-sm font-semibold">1-shot JSON injection</dd></div>
          </dl>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hard gate</p><p className="mt-1 text-sm leading-relaxed">{BENCHMARK_OVERVIEW.protocol.hardGate}</p></div>
            <div className="rounded-xl border border-border p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What is not a hard score</p><p className="mt-1 text-sm leading-relaxed">{BENCHMARK_OVERVIEW.protocol.softQuality}</p></div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/60 dark:bg-amber-950/20 md:p-6" aria-labelledby="benchmark-calibration-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">{BENCHMARK_OVERVIEW.calibration.date} · Contract calibration</p>
              <h2 id="benchmark-calibration-heading" className="mt-1 text-lg font-bold">{BENCHMARK_OVERVIEW.calibration.title}</h2>
              <p className="mt-1 max-w-4xl text-sm leading-relaxed text-muted-foreground">{BENCHMARK_OVERVIEW.calibration.summary}</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">{BENCHMARK_OVERVIEW.calibration.status}</span>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-xl border border-amber-200 bg-white/70 p-4 dark:border-amber-900/60 dark:bg-gray-950/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">External one-shot</p>
              <p className="mt-2 text-sm font-bold">{BENCHMARK_OVERVIEW.calibration.external.model}</p>
              <p className="mt-3 text-3xl font-bold text-emerald-700 dark:text-emerald-300">{BENCHMARK_OVERVIEW.calibration.external.firstPass}</p>
              <p className="mt-1 text-xs text-muted-foreground">first-pass contract result</p>
              <p className="mt-3 text-sm leading-relaxed">{BENCHMARK_OVERVIEW.calibration.external.note}</p>
              <Link href={BENCHMARK_OVERVIEW.calibration.projectHref} className="mt-4 inline-flex rounded-lg border border-border px-3 py-2 text-sm no-underline hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400">Project timeline →</Link>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border bg-white/70 dark:bg-gray-950/30">
              <table className="min-w-[720px] w-full text-left text-xs">
                <caption className="sr-only">Hook contract calibration before and after matrix</caption>
                <thead className="border-b border-border text-muted-foreground">
                  <tr><th className="px-3 py-3 font-semibold">Model</th><th className="px-3 py-3 font-semibold">1st before</th><th className="px-3 py-3 font-semibold">1st after</th><th className="px-3 py-3 font-semibold">Final before</th><th className="px-3 py-3 font-semibold">Final after</th><th className="px-3 py-3 font-semibold">Attempts after</th><th className="px-3 py-3 font-semibold">Generation</th></tr>
                </thead>
                <tbody>
                  {BENCHMARK_OVERVIEW.calibration.local.map(row => <tr key={row.model} className="border-b border-border/70 last:border-0"><th scope="row" className="px-3 py-3 font-semibold">{row.model}</th><td className="px-3 py-3 text-muted-foreground">{row.beforeFirst}</td><td className="px-3 py-3 font-semibold text-emerald-700 dark:text-emerald-300">{row.afterFirst}</td><td className="px-3 py-3 text-muted-foreground">{row.beforeEventual}</td><td className="px-3 py-3 font-semibold text-emerald-700 dark:text-emerald-300">{row.afterEventual}</td><td className="px-3 py-3">{row.afterAttempts}</td><td className="px-3 py-3">{row.generationSpeed}</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Remaining failure patterns</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{BENCHMARK_OVERVIEW.calibration.remaining.map(item => <li key={item}>{item}</li>)}</ul></div>
            <p className="text-sm leading-relaxed text-muted-foreground">{BENCHMARK_OVERVIEW.calibration.limitation}</p>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="benchmark-collections-heading">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 id="benchmark-collections-heading" className="text-xl font-bold">Collections</h2>
              <p className="mt-1 text-sm text-muted-foreground">현재 published result가 있는 측정 영역만 표시합니다.</p>
            </div>
            <span className="text-xs text-muted-foreground">{BENCHMARK_PROJECTIONS.length + legacyBenchmarks.length} result</span>
          </div>
          {availableCategories.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {availableCategories.map(category => {
                const count = countForCategory(category)
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

        <section className="mt-10 rounded-2xl border border-border bg-muted/30 p-5 md:p-6" aria-labelledby="benchmark-family-heading">
          <div className="mb-4">
            <h2 id="benchmark-family-heading" className="text-lg font-bold">Model Families</h2>
            <p className="mt-1 text-sm text-muted-foreground">모델이 늘어나도 결과를 패밀리별로 찾아볼 수 있습니다.</p>
          </div>
          <nav aria-label="Benchmark model families" className="flex flex-wrap gap-2">
            {benchmarkFamilies.map(([family, items]) => (
              <a
                key={family}
                href={`#${familyAnchor(family)}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm no-underline hover:border-blue-300 hover:text-blue-600 dark:bg-gray-900 dark:hover:border-blue-700 dark:hover:text-blue-400"
              >
                <span className="font-semibold">{family}</span>
                <span className="text-xs text-muted-foreground">{items.length} result</span>
              </a>
            ))}
          </nav>
        </section>

        <section className="mt-10" aria-labelledby="recent-benchmarks-heading">
          <div className="mb-4">
            <h2 id="recent-benchmarks-heading" className="text-xl font-bold">Latest Result</h2>
            <p className="mt-1 text-sm text-muted-foreground">가장 최근에 검증된 Benchmark Asset입니다.</p>
          </div>
          {benchmarkFamilies.length > 0 ? (
            <div className="space-y-8">
              {benchmarkFamilies.map(([family, items]) => (
                <section key={family} id={familyAnchor(family)} className="scroll-mt-6" aria-labelledby={`${familyAnchor(family)}-heading`}>
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <h3 id={`${familyAnchor(family)}-heading`} className="text-lg font-bold">{family}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{items.map(item => item.measurement).join(' · ')}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{items.length} published result</span>
                  </div>
                  <div className="space-y-4">
                    {items.map(benchmark => <BenchmarkResultCard key={benchmark.asset.assetId} benchmark={benchmark} />)}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No published benchmark yet</div>
          )}
        </section>

        {legacyBenchmarks.length > 0 && (
          <section className="mt-10" aria-labelledby="legacy-benchmark-heading">
            <div className="mb-4">
              <h2 id="legacy-benchmark-heading" className="text-xl font-bold">Reclassified DevSnack Results</h2>
              <p className="mt-1 text-sm text-muted-foreground">기존 `/devsnack` URL을 유지하면서 Benchmark 결과로 연결한 원문입니다.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {legacyBenchmarks.map(benchmark => <LegacyBenchmarkSourceCard key={benchmark.asset.assetId} benchmark={benchmark} />)}
            </div>
          </section>
        )}

        <section className="mt-10 rounded-2xl border border-border bg-muted/30 p-5 md:p-6" aria-labelledby="benchmark-knowledge-heading">
          <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="benchmark-knowledge-heading" className="text-lg font-bold">Related Knowledge</h2></div>
          <div className="mt-4 flex flex-wrap gap-2">
            {relatedKnowledge.map(knowledge => (
              <Link key={knowledge.href} href={knowledge.href} className="rounded-lg border border-border bg-white px-3 py-2 text-sm no-underline hover:border-blue-300 hover:text-blue-600 dark:bg-gray-900 dark:hover:border-blue-700 dark:hover:text-blue-400">{knowledge.title}</Link>
            ))}
          </div>
        </section>

        <RelatedAssets links={related} title="Relations from the Benchmark Project" />
      </div>
    </div>
  )
}
