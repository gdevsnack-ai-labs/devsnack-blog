import Link from 'next/link'
import { ArrowLeft, Database, Gauge, Info, Terminal } from 'lucide-react'
import { notFound } from 'next/navigation'
import {
  BENCHMARK_SUITE_KEYS,
  PUBLIC_RELEASE_ID,
  benchmarkMtpLabel,
  benchmarkSuiteLabel,
  getPublicBenchmarkFamily,
  getPublicBenchmarkModelSlugs,
  loadPublicBenchmarkRelease,
  type BenchmarkSuiteKey,
  type PublicBenchmarkModel,
} from '@/lib/benchmarks/public-release'
import { absoluteSiteUrl, buildRouteMetadata } from '@/lib/seo/metadata'
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildJsonLdGraph } from '@/lib/seo/structured-data'

export const dynamic = 'force-static'
export const revalidate = false
export const dynamicParams = false

export function generateStaticParams() {
  return getPublicBenchmarkModelSlugs().map(modelSlug => ({ modelSlug }))
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function number(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function percent(value: unknown): string {
  const n = number(value)
  return n === null ? '—' : `${(n * 100).toFixed(1)}%`
}

function tps(value: unknown): string {
  const n = number(value)
  return n === null ? '—' : `${n.toFixed(1)} t/s`
}

function suiteSummary(model: PublicBenchmarkModel, suiteKey: BenchmarkSuiteKey): string {
  const suite = record(model.suites[suiteKey])
  if (suite.status !== 'available') return 'unavailable'
  if (suiteKey === 'performance') {
    const metrics = record(suite.metrics)
    return `PP ${tps(record(metrics.pp).mean_tps)} · TG ${tps(record(metrics.tg).mean_tps)}`
  }
  if (suiteKey === 'server_performance') {
    const conditions = Array.isArray(suite.conditions) ? suite.conditions.map(record) : []
    const c1 = conditions.find(condition => condition.concurrency === 1)
    const c8 = conditions.find(condition => condition.concurrency === 8) || conditions.at(-1)
    return `c1 ${tps(record(record(c1).aggregate_generation_throughput_tps).mean)} · c8 ${tps(record(record(c8).aggregate_generation_throughput_tps).mean)}`
  }
  const total = number(suite.total)
  const passed = number(suite.passed) ?? number(suite.correct)
  return total !== null && passed !== null ? `${passed}/${total} · ${percent(suite.pass_rate)}` : percent(suite.pass_rate)
}

function modelServerCondition(model: PublicBenchmarkModel): string {
  const condition = record(model.suites.server_performance.condition)
  const spec = condition.spec_type === 'mtp' || condition.spec_type === 'draft-mtp' ? 'native MTP' : 'non-MTP'
  const thinking = condition.thinking_mode ? ` · reasoning ${String(condition.thinking_mode)}` : ''
  return `${spec}${thinking}`
}

export function generateMetadata({ params }: { params: Promise<{ modelSlug: string }> }) {
  const release = loadPublicBenchmarkRelease()
  return params.then(({ modelSlug }) => {
    const family = getPublicBenchmarkFamily(release, modelSlug)
    if (!family) return { title: 'Benchmark Model Not Found' }
    return buildRouteMetadata({
      title: `${family.name} — DGX Spark GB10 Benchmark`,
      description: `${family.name}의 DGX Spark GB10 실제 측정 결과, 양자화·variant·MTP 조건별 비교와 llama-server 실행 recipe입니다.`,
      canonicalPath: `/benchmarks/models/${modelSlug}`,
      language: 'ko',
      section: 'Benchmarks',
      kind: 'article',
      keywords: ['DGX Spark', 'GB10', family.name, 'llama.cpp', 'llama-server', 'MTP', 'GGUF', 'local LLM'],
    })
  })
}

export default async function BenchmarkModelPage({ params }: { params: Promise<{ modelSlug: string }> }) {
  const { modelSlug } = await params
  const release = loadPublicBenchmarkRelease()
  const family = getPublicBenchmarkFamily(release, modelSlug)
  if (!family) notFound()

  const models = release.models.filter(model => model.model_family_slug === modelSlug)
  if (models.length === 0) notFound()

  const jsonLd = buildJsonLdGraph(
    buildArticleJsonLd({
      type: 'TechArticle',
      title: `${family.name} — DGX Spark GB10 Benchmark`,
      description: family.summary,
      url: absoluteSiteUrl(`/benchmarks/models/${modelSlug}`),
      language: 'ko',
      section: 'Benchmark',
      published: family.last_updated,
      modified: family.last_updated,
      keywords: ['DGX Spark', 'GB10', family.name, 'llama.cpp', 'MTP', 'GGUF'],
      about: { '@type': 'Thing', name: family.name },
      isPartOf: { '@type': 'CollectionPage', name: 'DevSnack Benchmarks', url: absoluteSiteUrl('/benchmarks') },
    }),
    buildBreadcrumbJsonLd([
      { name: '홈', url: absoluteSiteUrl('/') },
      { name: 'Benchmarks', url: absoluteSiteUrl('/benchmarks') },
      { name: '통합 Benchmark', url: absoluteSiteUrl('/benchmarks') },
      { name: family.name, url: absoluteSiteUrl(`/benchmarks/models/${modelSlug}`) },
    ], 'ko'),
  )

  const info = [
    ['Architecture', family.architecture],
    ['Parameters', family.parameters],
    ['Context length', family.context_length ? `${family.context_length} tokens` : undefined],
    ['Model files', family.model_files],
    ['Reasoning', family.reasoning],
    ['Speculative decoding', family.speculative],
  ].filter(([, value]) => value !== undefined && value !== '') as Array<[string, unknown]>

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        <Link href="/benchmarks" className="inline-flex items-center gap-1 text-sm text-muted-foreground no-underline hover:text-foreground"><ArrowLeft className="h-4 w-4" /> 통합 Benchmark로 돌아가기</Link>
        <header className="mt-6 border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300"><Gauge className="h-4 w-4" aria-hidden="true" /> Benchmark Model Family <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] normal-case dark:bg-blue-900/30">Updated {family.last_updated}</span></div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">{family.name}</h1>
          <p className="mt-4 max-w-4xl text-base leading-relaxed text-muted-foreground">{family.summary}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="rounded-full border border-border px-3 py-1">{family.variant_count} variants</span><span className="rounded-full border border-border px-3 py-1">{release.scope.hardware}</span><span className="rounded-full border border-border px-3 py-1">{release.scope.runtime}</span></div>
        </header>

        <main className="mt-8 space-y-10">
          <section aria-labelledby="model-info-heading">
            <div className="flex items-center gap-2"><Info className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="model-info-heading" className="text-xl font-bold">기본 모델 정보</h2></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Model family</p><p className="mt-1 text-sm font-semibold">{family.name}</p></div>
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Measured variants</p><p className="mt-1 text-sm font-semibold">{family.variant_count}</p></div>
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last updated</p><p className="mt-1 text-sm font-semibold">{family.last_updated}</p></div>
              {info.map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{String(value)}</p></div>)}
            </div>
          </section>

          <section aria-labelledby="model-results-heading">
            <div className="flex items-center gap-2"><Database className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="model-results-heading" className="text-xl font-bold">DGX Spark GB10 측정 결과</h2></div>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-white dark:bg-gray-900"><table className="min-w-[1180px] w-full text-left text-xs"><thead className="border-b border-border bg-muted/40 text-muted-foreground"><tr><th className="px-3 py-3 font-semibold">Variant</th>{BENCHMARK_SUITE_KEYS.map(suite => <th key={suite} className="px-3 py-3 font-semibold">{benchmarkSuiteLabel(suite)}</th>)}</tr></thead><tbody>{models.map(model => <tr key={model.model_id} className="border-b border-border/70 last:border-0"><th scope="row" className="px-3 py-3 align-top"><div className="font-semibold">{model.variant}</div><div className="mt-1 font-normal text-muted-foreground">{model.quantization} · {benchmarkMtpLabel(model.mtp_mode)} · {modelServerCondition(model)}</div></th>{BENCHMARK_SUITE_KEYS.map(suite => <td key={suite} className="px-3 py-3 align-top leading-relaxed"><div className="font-medium">{suiteSummary(model, suite)}</div></td>)}</tr>)}</tbody></table></div>
            <p className="mt-2 text-xs text-muted-foreground">서로 다른 MTP/non-MTP 조건은 통합 총점으로 합산하지 않으며, 각 variant의 실제 조건을 함께 표시합니다.</p>
          </section>

          <section aria-labelledby="server-command-heading">
            <div className="flex items-center gap-2"><Terminal className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="server-command-heading" className="text-xl font-bold">실제 llama-server 실행 명령</h2></div>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">아래 명령은 실제 benchmark runner가 사용한 llama-server flag 조합입니다. 공개 페이지에서는 로컬 모델 경로·host·port만 placeholder로 치환했습니다.</p>
            <div className="mt-4 space-y-4">{models.map(model => <article key={model.model_id} className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{model.variant} · {benchmarkMtpLabel(model.mtp_mode)}</h3><span className="text-xs text-muted-foreground">Server: {modelServerCondition(model)}</span></div><pre className="mt-3 overflow-x-auto rounded-lg bg-gray-100 p-4 text-xs leading-relaxed text-gray-800 dark:bg-gray-950 dark:text-gray-200"><code>{model.server_command || 'Command not included in this projection.'}</code></pre></article>)}</div>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/60 dark:bg-amber-950/20" aria-labelledby="model-limitations-heading"><div className="flex items-center gap-2"><Info className="h-5 w-5 text-amber-700 dark:text-amber-300" aria-hidden="true" /><h2 id="model-limitations-heading" className="text-xl font-bold">해석할 때 참고할 점</h2></div><ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed"><li>측정값은 NVIDIA DGX Spark GB10 + llama.cpp + 고정 evaluator 조건의 관찰값입니다.</li><li>MTP와 non-MTP는 실행 경로가 다르므로 속도 수치를 조건 없이 직접 비교하면 안 됩니다.</li><li>Knowledge·Coding·Tool-call·Agent suite는 각각 다른 고정 protocol을 사용하며 종합 지능 점수는 아닙니다.</li></ul></section>

          <section className="rounded-2xl border border-border bg-muted/30 p-5 md:p-6" aria-labelledby="model-resources-heading"><div className="flex items-center gap-2"><Database className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="model-resources-heading" className="text-xl font-bold">데이터와 업데이트</h2></div><p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">이 제품군 페이지는 최신 통합 projection에서 자동으로 구성됩니다. 같은 모델의 새 양자화나 MTP/non-MTP 측정이 추가되면 새 URL을 만들지 않고 이 페이지의 variant matrix와 마지막 업데이트 날짜를 갱신합니다.</p><div className="mt-4 flex flex-wrap gap-3"><a href={`/data/benchmarks/${PUBLIC_RELEASE_ID}.json`} className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-sm text-background no-underline hover:opacity-80"><Database className="h-4 w-4" /> Download current JSON</a><Link href={`/benchmarks/${PUBLIC_RELEASE_ID}`} className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm no-underline hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400">전체 모델 비교 →</Link></div></section>
        </main>
      </div>
    </div>
  )
}
