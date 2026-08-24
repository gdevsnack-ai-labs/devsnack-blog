import Link from 'next/link'
import { ArrowRight, Gauge, Server, Target } from 'lucide-react'
import type { BenchmarkProjection } from '@/lib/ia/hub-projections'

export function BenchmarkResultCard({ benchmark }: { benchmark: BenchmarkProjection }) {
  return (
    <article className="rounded-2xl border border-blue-200 bg-white p-5 dark:border-blue-900/60 dark:bg-gray-900 md:p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
        <Gauge className="h-4 w-4" aria-hidden="true" />
        Published Benchmark Result
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] normal-case text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{benchmark.asset.primaryType}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] normal-case text-muted-foreground">{benchmark.family}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] normal-case text-muted-foreground">{benchmark.measurement}</span>
      </div>
      <h2 className="mt-3 text-xl font-bold leading-tight md:text-2xl">{benchmark.title}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Target className="h-3.5 w-3.5" aria-hidden="true" />Target</div>
          <p className="mt-1 text-sm font-semibold">{benchmark.target}</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Server className="h-3.5 w-3.5" aria-hidden="true" />Environment</div>
          <p className="mt-1 text-sm font-semibold">{benchmark.environment}</p>
        </div>
      </div>
      <dl className="mt-5 space-y-3 text-sm">
        <div><dt className="font-semibold">Method / Protocol</dt><dd className="mt-1 leading-relaxed text-muted-foreground">{benchmark.method}</dd></div>
        <div><dt className="font-semibold">Result</dt><dd className="mt-1 leading-relaxed text-muted-foreground">{benchmark.result}</dd></div>
        <div><dt className="font-semibold">Interpretation</dt><dd className="mt-1 leading-relaxed text-muted-foreground">{benchmark.interpretation}</dd></div>
      </dl>
      <div className="mt-5 grid gap-3 border-t border-border pt-4 text-xs text-muted-foreground sm:grid-cols-2">
        <p><strong className="text-foreground">Baseline:</strong> {benchmark.baseline}</p>
        <p><strong className="text-foreground">Limitations:</strong> {benchmark.limitations}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={benchmark.contentHref} className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-sm text-background no-underline hover:opacity-80">
          결과 원문 보기 <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link href={benchmark.projectHref} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm no-underline hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400">
          Project 보기
        </Link>
      </div>
    </article>
  )
}
