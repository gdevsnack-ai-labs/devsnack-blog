import Link from 'next/link'
import { ArrowRight, Database, Gauge, ShieldCheck } from 'lucide-react'
import type { PublicBenchmarkRelease } from '@/lib/benchmarks/public-release'
import { PUBLIC_RELEASE_ID } from '@/lib/benchmarks/public-release'

export function BenchmarkReleaseCard({ release }: { release: PublicBenchmarkRelease }) {
  return (
    <article className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/60 dark:bg-blue-950/20 md:p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
        <Gauge className="h-4 w-4" aria-hidden="true" />
        Public benchmark release
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] normal-case text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">{release.generated_at}</span>
      </div>
      <h2 className="mt-3 text-xl font-bold md:text-2xl">DGX Spark GB10 — Local LLM Benchmark</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {release.scope.model_variant_count}개 모델 변형을 {release.scope.suite_count}개 suite로 비교한 공개 release입니다. 72개 revalidated evaluator run과 기존 정식 결과를 재사용한 source run을 분리해 기록했습니다.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-white/80 p-3 dark:bg-gray-950/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Database className="h-3.5 w-3.5" aria-hidden="true" />Model variants</div>
          <p className="mt-1 text-lg font-bold">{release.scope.model_variant_count}</p>
        </div>
        <div className="rounded-xl bg-white/80 p-3 dark:bg-gray-950/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Gauge className="h-3.5 w-3.5" aria-hidden="true" />Revalidated runs</div>
          <p className="mt-1 text-lg font-bold">{release.scope.revalidated_evaluator_runs}</p>
        </div>
        <div className="rounded-xl bg-white/80 p-3 dark:bg-gray-950/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />Raw runs public</div>
          <p className="mt-1 text-lg font-bold">No</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={`/benchmarks/${PUBLIC_RELEASE_ID}`} className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-sm text-background no-underline hover:opacity-80">
          모델 비교표 보기 <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <a href={`/data/benchmarks/${PUBLIC_RELEASE_ID}.json`} className="inline-flex items-center rounded-lg border border-border bg-white/70 px-3 py-2 text-sm no-underline hover:border-blue-300 hover:text-blue-600 dark:bg-gray-950/30 dark:hover:border-blue-700 dark:hover:text-blue-400">
          Download JSON
        </a>
      </div>
    </article>
  )
}
