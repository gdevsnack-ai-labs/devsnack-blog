import Link from 'next/link'
import { ArrowLeft, BookOpen, Database, ExternalLink, FlaskConical, Gauge, GitBranch, Info } from 'lucide-react'
import { BenchmarkReleaseMatrix } from '@/components/benchmark-release-matrix'
import { PUBLIC_RELEASE_ID, benchmarkSuiteLabel, loadPublicBenchmarkRelease, type BenchmarkSuiteKey } from '@/lib/benchmarks/public-release'
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

const MODEL_GROUPS = [
  'Qwen3.6 35B-A3B',
  'Qwen3.8 Flash Next',
  'Gemma4',
  'Ornith 1.5',
  'North Mini',
  'N2 Mini',
] as const

const SUITE_DESCRIPTIONS = [
  {
    key: 'performance',
    description: '모델이 얼마나 빠르게 프롬프트를 읽고 답변을 생성하는지 봅니다. llama-bench를 이용해 prompt processing(PP)과 text generation(TG)을 측정합니다.',
    points: ['PP: 512 / 2K / 8K / 32K tokens', 'TG: 512 tokens', '단위: tokens/s', '정답률이나 지능이 아니라 같은 GB10에서의 순수 실행 속도에 가까운 microbenchmark입니다.'],
  },
  {
    key: 'server_performance',
    description: 'llama-server에 실제로 여러 요청이 동시에 들어왔을 때 얼마나 잘 처리하는지 봅니다.',
    points: ['Concurrency 1, 2, 4, 8', 'aggregate throughput · per-request throughput', 'p50 / p95 latency · failure rate', 'Performance가 모델 자체의 순수 속도에 가깝다면, Server-performance는 API 서버처럼 사용할 때의 처리 능력에 더 가깝습니다.'],
  },
  {
    key: 'knowledge',
    description: '일반 지식, 한국, 수학, 과학, 논리 문제를 얼마나 정확하게 푸는지 봅니다. 총 100문제를 5개 분야로 나눴습니다.',
    points: ['General · Korea · Math · Science · Logic', '각 분야 20문제, easy / medium / hard 포함', 'LLM judge 없이 multiple choice / numeric / exact match deterministic scoring', 'MMLU를 대체하려는 목적이 아니라, 같은 조건에서 로컬 모델의 기본 정확도 차이를 보기 위한 고정 dataset입니다.'],
  },
  {
    key: 'coding',
    description: '모델이 실제로 실행 가능한 Python 코드를 만들 수 있는지 봅니다. 생성한 코드를 파일로 저장한 뒤 pytest를 실행합니다.',
    points: ['12개의 작은 함수 구현 문제', 'prime 판정 · 문자열 처리 · 리스트 중복 제거', '빈도 계산 · clamp · chunk 처리', '설명을 잘하는지보다 실제로 테스트를 통과하는 코드를 생성했는지에 초점을 둡니다. 대규모 repository 수정 benchmark는 아닙니다.'],
  },
  {
    key: 'tool_call',
    description: '필요한 도구를 골라 올바른 방식으로 호출할 수 있는지 봅니다. 고정된 tool simulator 안에서 도구 선택부터 최종 완료까지 확인합니다.',
    points: ['single tool · tool selection · multi-step tool use · recovery · no-tool', 'tool 선택 · argument · 실행 성공 · 최종 task completion', 'OpenCode, Claude Code, Codex 같은 특정 agent framework 전체 성능을 의미하지 않습니다.'],
  },
  {
    key: 'agent_single',
    description: '하나의 agent가 여러 단계를 이어서 최종 작업을 끝낼 수 있는지 봅니다. 조회, 계산, 파일 사용, 최종 답변이 이어지는 작업을 평가합니다.',
    points: ['중간 tool call 실패 뒤 회복하면 최종 성공으로 인정', '실패한 호출 자체는 별도 metric으로 기록', '첫 시도의 완벽함보다 작업을 끝까지 완료하는 능력에 가깝습니다.'],
  },
  {
    key: 'agent_multi',
    description: '역할을 나누고 결과를 handoff하면서 여러 단계의 작업을 완료할 수 있는지 봅니다. 현재 evaluator에서는 Researcher와 Calculator 역할을 사용합니다.',
    points: ['task completion · role participation · handoff success', 'required dependency · tool execution · final answer', '실제 조직처럼 협업하는 여러 독립 AI 직원 전체가 아니라, 이번 release에서 정의한 role/tool handoff protocol 안의 결과입니다.'],
  },
] as const

const LIMITATION_COPY = [
  '이 benchmark는 DGX Spark GB10 + llama.cpp + 공개된 고정 recipe에서 나온 결과입니다. 다른 GPU, runtime, prompt format에서는 결과가 달라질 수 있습니다.',
  '같은 기반 모델이라도 quantization에 따라 속도와 evaluator 결과가 달라질 수 있어, 기반 모델명과 실제 variant·quantization을 함께 표시했습니다.',
  'Tool-call과 Agent 계열은 고정된 synthetic protocol을 사용하므로 OpenCode, Claude Code, Codex 같은 실제 개발 환경의 체감과 정확히 같지는 않을 수 있습니다.',
  'Knowledge 100문제는 모델의 모든 지식을 대표하는 절대적인 지능 점수가 아니라, 같은 조건에서 모델 간 차이를 비교하기 위한 고정 dataset입니다.',
  '서로 다른 7개 suite를 억지로 합친 종합 점수는 만들지 않았습니다. 필요한 작업에 맞춰 항목별로 비교하는 것이 더 유용합니다.',
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
            <p className="text-base font-semibold text-foreground">DGX Spark 한 대에서 로컬 LLM {release.scope.model_variant_count}개를 같은 조건으로 직접 돌려봤습니다.</p>
            <p>Qwen3.6, Qwen3.8 Flash Next, Gemma4, Ornith 1.5, North Mini, N2 Mini의 여러 GGUF·quantization 모델을 llama.cpp에서 실행하고, 속도부터 코딩·툴 사용·에이전트 작업까지 {release.scope.suite_count}개 항목으로 비교했습니다.</p>
            <p>어떤 모델이 무조건 가장 좋다는 순위를 만들기보다는, <strong className="text-foreground">같은 GB10에서 각 모델이 어떤 성격을 보이는지</strong> 확인하는 데 초점을 맞췄습니다. 그래서 속도, 코딩, Tool-call, Agent 결과처럼 서로 성격이 다른 점수를 하나의 총점으로 합치지 않고 그대로 보여줍니다.</p>
            <p>Knowledge·Tool-call·Agent 계열은 reasoning을 끈 상태에서 다시 검증했고, Performance·Server-performance·Coding은 기존에 정상적으로 측정된 결과를 재사용했습니다. 측정 방법과 evaluator version, dataset hash, source run 정보도 함께 공개해 결과가 어디서 나왔는지 확인할 수 있도록 했습니다.</p>
          </div>
          <p className="mt-4 max-w-5xl text-sm leading-relaxed text-muted-foreground"><strong className="text-foreground">Models covered:</strong> {release.models.map(model => `${model.model} ${model.variant}`).join(' · ')}</p>
          <p className="mt-4 max-w-4xl text-sm leading-relaxed text-muted-foreground">{release.scope.model_variant_count} model variants · {release.scope.suite_count} suites · llama.cpp · reasoning off</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border px-3 py-1">{release.scope.model_variant_count} model variants</span>
            <span className="rounded-full border border-border px-3 py-1">{release.scope.revalidated_evaluator_runs} revalidated evaluator runs</span>
            <span className="rounded-full border border-border px-3 py-1">{release.scope.reused_source_runs} reused source runs</span>
            <span className="rounded-full border border-border px-3 py-1">raw runs not public</span>
          </div>
        </header>

        <main className="mt-8 space-y-10">
          <section aria-labelledby="models-covered-heading">
            <div className="flex items-center gap-2"><Database className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="models-covered-heading" className="text-xl font-bold">테스트한 모델군</h2></div>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">이번 release에는 아래 6개 모델군의 {release.scope.model_variant_count}개 variant가 포함되어 있습니다.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {MODEL_GROUPS.map(model => <div key={model} className="rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold dark:bg-gray-900">{model}</div>)}
            </div>
            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">각 quantization과 tuning variant는 별도 모델로 취급했습니다. 같은 기반 모델이라도 Q4, Q5, Q6, Q8, NVFP4, MXFP4, UD, MTP 여부에 따라 실제 속도와 evaluator 결과가 달라질 수 있기 때문입니다.</p>
          </section>

          <BenchmarkReleaseMatrix models={release.models} />

          <section aria-labelledby="suite-guide-heading">
            <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="suite-guide-heading" className="text-xl font-bold">각 항목은 무엇을 보나요? <span className="ml-1 text-sm font-medium text-muted-foreground">Suite guide</span></h2></div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {SUITE_DESCRIPTIONS.map(item => <div key={item.key} className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-sm font-bold">{benchmarkSuiteLabel(item.key)}</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p><ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-muted-foreground">{item.points.map(point => <li key={point}>{point}</li>)}</ul></div>)}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-muted/30 p-5 md:p-6" aria-labelledby="methodology-heading">
            <div className="flex items-center gap-2"><FlaskConical className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="methodology-heading" className="text-xl font-bold">Methodology</h2></div>
            <div className="mt-4 max-w-4xl space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>이번 공개 결과는 두 종류의 source run을 함께 사용합니다. Knowledge·Tool-call·Agent-single·Agent-multi는 최종 evaluator 기준으로 다시 검증했고, Performance·Server-performance·Coding은 기존에 정상적으로 측정된 결과를 불필요하게 다시 돌리지 않고 재사용했습니다.</p>
              <p>전체 결과는 {release.scope.source_run_references}개의 source run reference로 추적할 수 있습니다. Raw run 전체를 웹에 공개하지는 않지만, release에 사용된 evaluator version, dataset hash, source run ID와 방법론을 함께 제공합니다.</p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revalidated evaluator runs</p><p className="mt-1 text-2xl font-bold">{release.scope.revalidated_evaluator_runs}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Knowledge·Tool-call·Agent 계열</p></div>
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reused source runs</p><p className="mt-1 text-2xl font-bold">{release.scope.reused_source_runs}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Performance·Server-performance·Coding</p></div>
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source references</p><p className="mt-1 text-2xl font-bold">{release.scope.source_run_references}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">공개 projection이 가리키는 전체 run</p></div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(release.suite_versions).map(([suite, version]) => <div key={suite} className="rounded-xl border border-border bg-white p-3 dark:bg-gray-900"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{benchmarkSuiteLabel(suite as BenchmarkSuiteKey)}</p><p className="mt-1 text-sm font-semibold">{version}</p></div>)}
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Environment</p><p className="mt-1 text-sm leading-relaxed">{release.scope.hardware} · {release.scope.runtime} · reasoning {release.scope.reasoning_mode}</p></div>
              <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source policy</p><p className="mt-1 text-sm leading-relaxed">{release.source_policy.revalidated_lane}. {release.source_policy.reused_lane}.</p></div>
            </div>
            <h3 className="mt-6 text-base font-bold">Dataset hashes</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">재현성을 위해 release에서 사용한 dataset의 SHA256을 함께 공개합니다. 이 hash는 같은 이름의 benchmark dataset이 실제로 동일한 내용인지 확인하기 위한 기준입니다.</p>
            <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-white dark:bg-gray-900"><table className="min-w-[700px] w-full text-left text-xs"><thead className="border-b border-border text-muted-foreground"><tr><th className="px-3 py-3 font-semibold">Dataset</th><th className="px-3 py-3 font-semibold">Scoring</th><th className="px-3 py-3 font-semibold">SHA256</th></tr></thead><tbody>{release.methodology.datasets.map(dataset => <tr key={dataset.id} className="border-b border-border/70 last:border-0"><th scope="row" className="px-3 py-3 font-semibold">{dataset.id}</th><td className="px-3 py-3">{dataset.scoring_type || '—'}</td><td className="break-all px-3 py-3 font-mono text-[10px] text-muted-foreground">{dataset.sha256 || '—'}</td></tr>)}</tbody></table></div>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/60 dark:bg-amber-950/20 md:p-6" aria-labelledby="limitations-heading">
            <div className="flex items-center gap-2"><Info className="h-5 w-5 text-amber-700 dark:text-amber-300" aria-hidden="true" /><h2 id="limitations-heading" className="text-xl font-bold">이 결과를 볼 때 참고할 점 <span className="ml-1 text-sm font-medium text-muted-foreground">Limitations</span></h2></div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed">{LIMITATION_COPY.map(item => <li key={item}>{item}</li>)}</ul>
          </section>

          <section className="rounded-2xl border border-border bg-muted/30 p-5 md:p-6" aria-labelledby="benchmark-resources-heading">
            <div className="flex items-center gap-2"><Database className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="benchmark-resources-heading" className="text-xl font-bold">데이터 다운로드와 재현성</h2></div>
            <div className="mt-3 max-w-4xl space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>사람이 보는 비교표와 같은 release를 machine-readable JSON으로도 공개합니다. JSON을 이용하면 모델별 비교, quantization 비교, suite별 ranking, 별도 chart와 후속 분석을 직접 만들 수 있습니다.</p>
              <p>이번 공개 데이터는 특정 시점의 <strong className="text-foreground">immutable release snapshot</strong>입니다. 같은 release ID의 수치를 나중에 조용히 수정하지 않고, 변경이 필요하면 새로운 revision 또는 release로 발행합니다.</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3" aria-label="Benchmark resources">
              <a href={`/data/benchmarks/${PUBLIC_RELEASE_ID}.json`} className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-sm text-background no-underline hover:opacity-80"><Database className="h-4 w-4" aria-hidden="true" /> Download JSON</a>
              <a href={`https://github.com/gdevsnack-ai-labs/devsnack-blog/blob/main/public/data/benchmarks/${PUBLIC_RELEASE_ID}.json`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm no-underline hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400"><GitBranch className="h-4 w-4" aria-hidden="true" /> GitHub source</a>
              <Link href="/labs/local-llm-benchmark" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm no-underline hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400"><ExternalLink className="h-4 w-4" aria-hidden="true" /> Local LLM Benchmark Lab</Link>
              <Link href="/lab/ornith15-server-quality-speed-benchmark" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm no-underline hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400"><BookOpen className="h-4 w-4" aria-hidden="true" /> 관련 Benchmark 글</Link>
            </div>
          </section>

          <section className="border-t border-border pt-6" aria-labelledby="benchmark-summary-heading">
            <h2 id="benchmark-summary-heading" className="text-xl font-bold">한 줄로 정리하면</h2>
            <div className="mt-3 max-w-4xl space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>이 페이지는 “어떤 LLM이 세상에서 가장 좋은가”를 정하기 위한 leaderboard가 아닙니다.</p>
              <p><strong className="text-foreground">내 DGX Spark GB10에서 실제 GGUF 모델들을 같은 조건으로 돌렸을 때, 각각 어떤 속도와 작업 성향을 보였는지 기록한 공개 benchmark입니다.</strong></p>
              <p>빠른 모델, 코딩을 잘하는 모델, tool 사용이 좋은 모델, agent task completion이 좋은 모델이 서로 다를 수 있습니다. 필요한 작업에 맞춰 원하는 항목을 직접 비교해보시면 됩니다.</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
