import Link from 'next/link'
import { ArrowLeft, BookOpen, Database, ExternalLink, FlaskConical, Gauge, GitBranch, Info } from 'lucide-react'
import { BenchmarkReleaseMatrix } from '@/components/benchmark-release-matrix'
import { PUBLIC_RELEASE_ID, benchmarkSuiteLabel, loadPublicBenchmarkRelease } from '@/lib/benchmarks/public-release'
import { absoluteSiteUrl, buildRouteMetadata } from '@/lib/seo/metadata'
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildCollectionPageJsonLd, buildJsonLdGraph } from '@/lib/seo/structured-data'

export const dynamic = 'force-static'
export const revalidate = false
export const dynamicParams = false

export function generateStaticParams() {
  return [{ releaseId: PUBLIC_RELEASE_ID }]
}

export async function generateMetadata({ params }: { params: Promise<{ releaseId: string }> }) {
  const { releaseId } = await params
  if (releaseId !== PUBLIC_RELEASE_ID) return { title: 'Benchmark Release Not Found' }
  const release = loadPublicBenchmarkRelease(releaseId)
  return buildRouteMetadata({
    title: 'DGX Spark GB10 로컬 LLM 벤치마크 — 18개 GGUF 모델 비교',
    description: 'NVIDIA DGX Spark GB10에서 18개 GGUF 모델을 동일 조건으로 비교했습니다. llama.cpp 속도·서버 처리량, Knowledge, Coding, Tool-call, Single/Multi Agent 결과와 공개 JSON을 확인할 수 있습니다.',
    canonicalPath: `/benchmarks/${releaseId}`,
    language: 'ko',
    section: 'Benchmarks',
    kind: 'article',
    keywords: ['NVIDIA DGX Spark', 'GB10', 'local LLM benchmark', 'GGUF', 'llama.cpp', 'Qwen', 'Gemma', 'Ornith', 'coding benchmark', 'tool call benchmark', 'agent benchmark', 'local AI'],
  })
}

const SUITE_DESCRIPTIONS = [
  ['performance', 'llama-bench 기반 prompt processing / token generation engine microbenchmark'],
  ['server_performance', 'llama-server 동시성별 aggregate throughput과 latency 측정'],
  ['knowledge', '고정 100문제 dataset의 deterministic answer accuracy'],
  ['coding', '생성 코드의 pytest 통과율과 failure type'],
  ['tool_call', 'tool 선택·argument·execution 성공률'],
  ['agent_single', '단일 agent loop의 단계·tool 사용·완료율'],
  ['agent_multi', 'role/tool handoff와 multi-step task completion'],
] as const

export default async function BenchmarkReleasePage({ params }: { params: Promise<{ releaseId: string }> }) {
  const { releaseId } = await params
  if (releaseId !== PUBLIC_RELEASE_ID) return null
  const release = loadPublicBenchmarkRelease(releaseId)
  const jsonUrl = absoluteSiteUrl(`/data/benchmarks/${releaseId}.json`)
  const benchmarkKeywords = ['NVIDIA DGX Spark', 'GB10', 'local LLM benchmark', 'GGUF', 'llama.cpp', 'Qwen', 'Gemma', 'Ornith', 'coding benchmark', 'tool call benchmark', 'agent benchmark', 'local AI']
  const jsonLd = buildJsonLdGraph(
    buildArticleJsonLd({
      type: 'TechArticle',
      title: 'DGX Spark GB10 로컬 LLM 벤치마크 — 18개 GGUF 모델 비교',
      description: 'NVIDIA DGX Spark GB10에서 llama.cpp로 18개 GGUF 모델 변형을 동일 조건으로 비교한 공개 benchmark release입니다.',
      url: absoluteSiteUrl(`/benchmarks/${releaseId}`),
      language: 'ko',
      section: 'Benchmark',
      published: release.generated_at,
      modified: release.generated_at,
      keywords: benchmarkKeywords,
      about: { '@type': 'Thing', name: 'Measured local LLM benchmark on NVIDIA DGX Spark GB10' },
      isPartOf: { '@type': 'CollectionPage', name: 'DevSnack Benchmarks', url: absoluteSiteUrl('/benchmarks') },
    }),
    {
      '@type': 'Dataset',
      name: 'GB10 LLM Benchmark v1 public dataset',
      description: 'Versioned public JSON dataset containing 18 GGUF model variants measured across seven llama.cpp benchmark suites on NVIDIA DGX Spark GB10.',
      url: jsonUrl,
      inLanguage: 'ko-KR',
      isAccessibleForFree: true,
      creator: { '@type': 'Organization', name: 'DevSnack', url: absoluteSiteUrl('/') },
      publisher: { '@type': 'Organization', name: 'DevSnack Blog', url: absoluteSiteUrl('/') },
      datePublished: release.generated_at,
      dateModified: release.generated_at,
      keywords: benchmarkKeywords.join(', '),
      measurementTechnique: 'Versioned llama.cpp benchmark recipes with reasoning-off evaluator conditions and source-run provenance.',
      variableMeasured: ['Prompt processing throughput', 'Token generation throughput', 'Server latency', 'Knowledge accuracy', 'Coding pass rate', 'Tool-call success', 'Agent task completion'],
      distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: jsonUrl }],
    },
    buildCollectionPageJsonLd({
      name: 'DGX Spark GB10 — Local LLM Benchmark',
      description: '18개 모델 변형과 7개 suite를 비교한 GB10 로컬 LLM Benchmark 공개 release',
      url: absoluteSiteUrl(`/benchmarks/${releaseId}`),
      language: 'ko',
      section: 'Benchmarks',
      breadcrumbs: [],
      parts: release.models.map((model, index) => ({ name: `${model.model} ${model.variant}`, url: absoluteSiteUrl(`/benchmarks/${releaseId}#${model.model_id}`), position: index + 1 })),
    }),
    buildBreadcrumbJsonLd([
      { name: '홈', url: absoluteSiteUrl('/') },
      { name: 'Benchmarks', url: absoluteSiteUrl('/benchmarks') },
      { name: 'GB10 LLM Benchmark', url: absoluteSiteUrl(`/benchmarks/${releaseId}`) },
    ], 'ko'),
  )

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        <Link href="/benchmarks" className="inline-flex items-center gap-1 text-sm text-muted-foreground no-underline hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Benchmarks로 돌아가기</Link>
        <header className="mt-6 border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300"><Gauge className="h-4 w-4" aria-hidden="true" /> Public Benchmark Release <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] normal-case dark:bg-blue-900/30">{release.generated_at}</span></div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">DGX Spark GB10 — Local LLM Benchmark</h1>
          <div className="mt-5 max-w-4xl space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>이 페이지는 NVIDIA DGX Spark GB10에서 직접 실행한 local LLM benchmark release입니다. 동일한 hardware와 recipe 조건에서 llama.cpp 기반 GGUF 모델의 속도와 실제 평가 결과를 비교했습니다.</p>
            <p>18개 model variants를 Performance, Server-performance, Knowledge, Coding, Tool-call, Agent-single, Agent-multi 7개 suite로 측정했습니다. evaluator lane은 reasoning OFF이며, Performance·Server-performance·Coding의 기존 정식 결과와 새 evaluator revalidation 결과를 구분해 기록합니다.</p>
            <p>전체 score는 모델의 절대 순위나 보편적인 품질 점수가 아니라 동일 조건 내 비교값입니다. 원본 raw run은 공개하지 않고, 재현에 필요한 methodology·dataset hash·source run provenance와 machine-readable JSON만 제공합니다.</p>
          </div>
          <p className="mt-4 max-w-5xl text-sm leading-relaxed text-muted-foreground"><strong className="text-foreground">Models covered:</strong> {release.models.map(model => `${model.model} ${model.variant}`).join(' · ')}</p>
          <p className="mt-4 max-w-4xl text-sm leading-relaxed text-muted-foreground">{release.scope.model_variant_count} model variants · {release.scope.suite_count} suites · llama.cpp · reasoning off</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border px-3 py-1">18 model variants</span>
            <span className="rounded-full border border-border px-3 py-1">72 revalidated evaluator runs</span>
            <span className="rounded-full border border-border px-3 py-1">54 reused source runs</span>
            <span className="rounded-full border border-border px-3 py-1">raw runs not public</span>
          </div>
        </header>

        <main className="mt-8 space-y-10">
          <BenchmarkReleaseMatrix models={release.models} />

          <section aria-labelledby="suite-guide-heading">
            <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="suite-guide-heading" className="text-xl font-bold">Suite guide</h2></div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {SUITE_DESCRIPTIONS.map(([key, description]) => <div key={key} className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-sm font-bold">{benchmarkSuiteLabel(key)}</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p></div>)}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-muted/30 p-5 md:p-6" aria-labelledby="methodology-heading">
            <div className="flex items-center gap-2"><FlaskConical className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="methodology-heading" className="text-xl font-bold">Methodology</h2></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(release.suite_versions).map(([suite, version]) => <div key={suite} className="rounded-xl border border-border bg-white p-3 dark:bg-gray-900"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{suite}</p><p className="mt-1 text-sm font-semibold">{version}</p></div>)}
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Environment</p><p className="mt-1 text-sm leading-relaxed">{release.scope.hardware} · {release.scope.runtime} · reasoning {release.scope.reasoning_mode}</p></div>
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source policy</p><p className="mt-1 text-sm leading-relaxed">{release.source_policy.revalidated_lane}. {release.source_policy.reused_lane}.</p></div>
            </div>
            <h3 className="mt-6 text-base font-bold">Dataset hashes</h3>
            <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-white dark:bg-gray-900"><table className="min-w-[700px] w-full text-left text-xs"><thead className="border-b border-border text-muted-foreground"><tr><th className="px-3 py-3 font-semibold">Dataset</th><th className="px-3 py-3 font-semibold">Scoring</th><th className="px-3 py-3 font-semibold">SHA256</th></tr></thead><tbody>{release.methodology.datasets.map(dataset => <tr key={dataset.id} className="border-b border-border/70 last:border-0"><th scope="row" className="px-3 py-3 font-semibold">{dataset.id}</th><td className="px-3 py-3">{dataset.scoring_type || '—'}</td><td className="break-all px-3 py-3 font-mono text-[10px] text-muted-foreground">{dataset.sha256 || '—'}</td></tr>)}</tbody></table></div>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/60 dark:bg-amber-950/20 md:p-6" aria-labelledby="limitations-heading">
            <div className="flex items-center gap-2"><Info className="h-5 w-5 text-amber-700 dark:text-amber-300" aria-hidden="true" /><h2 id="limitations-heading" className="text-xl font-bold">Limitations</h2></div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed">{release.methodology.limitations.map(item => <li key={item}>{item}</li>)}</ul>
          </section>

          <section className="flex flex-wrap gap-3 border-t border-border pt-6" aria-label="Benchmark resources">
            <a href={`/data/benchmarks/${PUBLIC_RELEASE_ID}.json`} className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-sm text-background no-underline hover:opacity-80"><Database className="h-4 w-4" aria-hidden="true" /> Download JSON</a>
            <a href={`https://github.com/gdevsnack-ai-labs/devsnack-blog/blob/main/public/data/benchmarks/${PUBLIC_RELEASE_ID}.json`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm no-underline hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400"><GitBranch className="h-4 w-4" aria-hidden="true" /> GitHub source</a>
            <Link href="/labs/local-llm-benchmark" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm no-underline hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400"><ExternalLink className="h-4 w-4" aria-hidden="true" /> Local LLM Benchmark Lab</Link>
            <Link href="/lab/ornith15-server-quality-speed-benchmark" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm no-underline hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400"><BookOpen className="h-4 w-4" aria-hidden="true" /> 관련 Benchmark 글</Link>
          </section>
        </main>
      </div>
    </div>
  )
}
