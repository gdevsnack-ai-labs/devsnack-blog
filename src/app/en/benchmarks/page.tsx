import Link from 'next/link'
import { Database, Gauge, Info, Languages } from 'lucide-react'
import { BenchmarkReleaseMatrix } from '@/components/benchmark-release-matrix'
import { getPublicBenchmarkFamilies, loadPublicBenchmarkRelease, PUBLIC_RELEASE_ID } from '@/lib/benchmarks/public-release'
import { absoluteSiteUrl, buildRouteMetadata } from '@/lib/seo/metadata'
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildCollectionPageJsonLd, buildJsonLdGraph } from '@/lib/seo/structured-data'

export const revalidate = 60

export const metadata = buildRouteMetadata({
  title: 'DGX Spark GB10 — Local LLM Benchmark | DevSnack',
  description: 'A reproducible comparison of 24 GGUF model variants across eight llama.cpp benchmark suites on an NVIDIA DGX Spark GB10, including speed, coding, internal and external tool-call, and agent results.',
  canonicalPath: '/en/benchmarks',
  language: 'en',
  koreanPath: '/benchmarks',
  englishPath: '/en/benchmarks',
  section: 'Benchmarks',
  searchPolicy: 'index',
  keywords: ['DGX Spark GB10', 'local LLM benchmark', 'GGUF', 'llama.cpp', 'MTP', 'coding benchmark', 'tool-call benchmark', 'tool-eval-bench', 'agent benchmark'],
})

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function tps(value: unknown): string {
  const n = finiteNumber(value)
  return n === null ? '—' : `${n.toFixed(1)} t/s`
}

function performanceTg(model: Record<string, unknown>): string {
  const suite = record(record(model.suites).performance)
  return tps(record(record(suite.metrics).tg).mean_tps)
}

function serverThroughput(model: Record<string, unknown>, concurrency: number): string {
  const suite = record(record(model.suites).server_performance)
  const conditions = Array.isArray(suite.conditions) ? suite.conditions.map(record) : []
  const condition = conditions.find(item => item.concurrency === concurrency)
  return tps(record(record(condition).aggregate_generation_throughput_tps).mean)
}

export default function EnglishBenchmarksPage() {
  const release = loadPublicBenchmarkRelease()
  const families = getPublicBenchmarkFamilies(release)
  const models = release.models as Array<Record<string, unknown>>
  const qwen = models.find(model => model.model_id === 'qwen3-6-35b-a3b-turbo')
  const n25 = models.find(model => model.model_id === 'n2-5-mini-q4-k-m')
  const north = models.find(model => model.model_id === 'north-mini-ud-q4')
  const highlights = [
    qwen && `Qwen3.6 35B-A3B TURBO: TG ${performanceTg(qwen)}, single-slot c1 ${serverThroughput(qwen, 1)}.`,
    n25 && `N2.5 Mini Q4_K_M: TG ${performanceTg(n25)} under the same public release conditions.`,
    north && `North Mini UD-Q4: aggregate c8 throughput ${serverThroughput(north, 8)}.`,
  ].filter((value): value is string => Boolean(value))

  const jsonUrl = absoluteSiteUrl(`/data/benchmarks/${PUBLIC_RELEASE_ID}.json`)
  const jsonLd = buildJsonLdGraph(
    buildArticleJsonLd({
      type: 'TechArticle',
      title: 'DGX Spark GB10 — Local LLM Benchmark',
      description: `A reproducible comparison of ${release.scope.model_variant_count} GGUF model variants across ${release.scope.suite_count} llama.cpp benchmark suites on NVIDIA DGX Spark GB10.`,
      url: absoluteSiteUrl('/en/benchmarks'),
      language: 'en',
      section: 'Benchmarks',
      published: release.generated_at,
      modified: release.generated_at,
      keywords: ['DGX Spark GB10', 'local LLM benchmark', 'GGUF', 'llama.cpp', 'MTP', 'coding benchmark', 'tool-call benchmark', 'tool-eval-bench', 'agent benchmark'],
      about: { '@type': 'Thing', name: 'Measured local LLM benchmark on NVIDIA DGX Spark GB10' },
      isPartOf: { '@type': 'CollectionPage', name: 'DevSnack English Benchmarks', url: absoluteSiteUrl('/en/benchmarks') },
    }),
    buildCollectionPageJsonLd({
      name: 'DGX Spark GB10 — Local LLM Benchmark',
      description: `${release.scope.model_variant_count} model variants and ${release.scope.suite_count} suites compared under a versioned llama.cpp release contract.`,
      url: absoluteSiteUrl('/en/benchmarks'),
      language: 'en',
      section: 'Benchmarks',
      breadcrumbs: [],
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', url: absoluteSiteUrl('/en') },
      { name: 'Benchmarks', url: absoluteSiteUrl('/en/benchmarks') },
    ], 'en'),
  )

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        <header className="mt-6 border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300"><Gauge className="h-4 w-4" aria-hidden="true" /> English Standard Benchmark <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] normal-case dark:bg-blue-900/30">Release {release.generated_at}</span></div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm"><Link href="/benchmarks" className="text-blue-700 no-underline hover:underline dark:text-blue-300">한국어 원문</Link><span className="text-muted-foreground">·</span><Link href="/en" className="inline-flex items-center gap-1 text-muted-foreground no-underline hover:text-foreground"><Languages className="h-4 w-4" /> English pilot</Link></div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">DGX Spark GB10 — Local LLM Benchmark</h1>
          <p className="mt-5 max-w-5xl text-base leading-relaxed text-muted-foreground">This is the English projection of DevSnack’s current Standard Benchmark release: {release.scope.model_variant_count} GGUF model variants run with llama.cpp on an NVIDIA DGX Spark GB10 across {release.scope.suite_count} suites covering speed, serving, knowledge, coding, tool use, and agent task completion.</p>
          <p className="mt-3 max-w-5xl text-sm leading-relaxed text-muted-foreground">Representative results are shown below. MTP and non-MTP rows use different execution paths, so each result must be read together with its variant, quantization, and serving condition.</p>
          <ul className="mt-4 grid gap-2 text-sm leading-relaxed text-muted-foreground md:grid-cols-3">{highlights.map(item => <li key={item} className="rounded-xl border border-border bg-white p-3 dark:bg-gray-900">{item}</li>)}</ul>
        </header>

        <main className="mt-8 space-y-10">
          <section aria-labelledby="english-models-heading">
            <div className="flex items-center gap-2"><Database className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="english-models-heading" className="text-xl font-bold">Model families in this release</h2></div>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">The model-family pages are currently maintained on the Korean source route. The measurements, JSON release, and protocol are shared across both language surfaces.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{families.map(family => <Link key={family.slug} href={`/benchmarks/models/${family.slug}`} className="rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold no-underline hover:border-blue-300 hover:text-blue-600 dark:bg-gray-900 dark:hover:border-blue-700 dark:hover:text-blue-400">{family.name}<span className="ml-2 text-xs font-normal text-muted-foreground">{family.variant_count} variants · Korean detail →</span></Link>)}</div>
          </section>

          <BenchmarkReleaseMatrix models={release.models} locale="en" />

          <section aria-labelledby="english-suite-heading">
            <div className="flex items-center gap-2"><Info className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="english-suite-heading" className="text-xl font-bold">What the eight suites measure</h2></div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><h3 className="font-bold">Performance</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Prompt processing and token generation speed from llama-bench-style measurements.</p></div>
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><h3 className="font-bold">Server-performance</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Aggregate and per-request throughput across concurrent llama-server slots.</p></div>
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><h3 className="font-bold">Knowledge</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Deterministic knowledge, Korea, math, science, and logic questions.</p></div>
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><h3 className="font-bold">Coding</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Executable Python generation evaluated by tests, not explanation quality alone.</p></div>
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><h3 className="font-bold">Tool-call</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Tool selection, arguments, recovery, and final task completion in a fixed simulator.</p></div>
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><h3 className="font-bold">External tool-eval-bench</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">A separate 69-scenario deterministic tool-use protocol. Each variant exposes its actual scored/attempted denominator; current N2/N2.5 Mini runs score 65 after four grammar transport failures, while Laguna S 2.1 scores all 69.</p></div>
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><h3 className="font-bold">Agent-single / Agent-multi</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Single-agent completion and role handoff under the release’s fixed protocols.</p></div>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/60 dark:bg-amber-950/20 md:p-6" aria-labelledby="english-limitations-heading">
            <div className="flex items-center gap-2"><Info className="h-5 w-5 text-amber-700 dark:text-amber-300" aria-hidden="true" /><h2 id="english-limitations-heading" className="text-xl font-bold">Limitations</h2></div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed"><li>Results are observations from NVIDIA DGX Spark GB10, llama.cpp, and the versioned public recipes; other hardware, runtimes, or prompt formats may differ.</li><li>Quantization and MTP mode can change both speed and evaluator outcomes, so there is no universal single “best model” score.</li><li>Knowledge, coding, tool-call, external tool-eval-bench, and agent suites use bounded protocols. They are not a complete measure of general intelligence or every real-world coding environment.</li><li>External tool-eval-bench is currently available for eight N2/N2.5 Mini variants and one Laguna S 2.1 variant; each row shows its actual scored/attempted denominator, and blank cells mean not measured, not zero.</li><li>Laguna S 2.1’s Knowledge result uses legacy v1 with 25 questions; the matrix shows its version and denominator, so it should not be ranked directly against the current Standard Knowledge v1.2 100-question results.</li><li>The release is an immutable public projection. New measurements should update the matrix through a new revision rather than silently rewriting this snapshot.</li></ul>
          </section>

          <section className="rounded-2xl border border-border bg-muted/30 p-5 md:p-6" aria-labelledby="english-resources-heading">
            <div className="flex items-center gap-2"><Database className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="english-resources-heading" className="text-xl font-bold">Data and source</h2></div>
            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">The same machine-readable JSON projection powers the Korean and English benchmark views. Use it to build your own charts or compare model variants without treating the table as a universal leaderboard.</p>
            <div className="mt-5 flex flex-wrap gap-3"><a href={jsonUrl} className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-sm text-background no-underline hover:opacity-80"><Database className="h-4 w-4" /> Download release JSON</a><Link href="/benchmarks" className="inline-flex rounded-lg border border-border px-3 py-2 text-sm no-underline hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400">Open Korean Standard Benchmark →</Link></div>
          </section>
        </main>
      </div>
    </div>
  )
}
