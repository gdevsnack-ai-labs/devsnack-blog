import Link from 'next/link'
import { ArrowLeft, FlaskConical } from 'lucide-react'
import { HubHeader } from '@/components/hub-header'
import { LabBoard } from '@/components/lab-board'
import { experiments } from '@/data/experiments'
import { getLabProjectProjections } from '@/lib/ia/hub-projections'
import { parseLabFilter } from '@/lib/labs'
import { buildRouteMetadata } from '@/lib/seo/metadata'

export const revalidate = 60

export const metadata = buildRouteMetadata({
  title: 'Lab Board — DevSnack',
  description: 'DevSnack AI 실험 Project를 상태와 주제별로 탐색하는 Lab Board',
  canonicalPath: '/labs/board',
})

type SearchParams = Promise<{ status?: string | string[] }>

export default async function LabBoardPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const projects = getLabProjectProjections(experiments).filter(project => !project.isDummy)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <Link href="/labs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Lab Home
        </Link>
        <div className="mt-6">
          <HubHeader
            eyebrow="Explore Projects"
            title="Lab Board"
            description="진행 중인 실험과 완료된 Project를 상태와 주제별로 찾아봅니다. 개별 실험의 상세 기록은 각 Project 페이지에서 확인할 수 있습니다."
            icon={FlaskConical}
          />
        </div>

        <LabBoard projects={projects} initialFilter={parseLabFilter(params.status)} basePath="/labs/board" showHeading={false} />

        <section className="mt-8 rounded-xl border border-border bg-muted/30 p-5" aria-labelledby="board-benchmark-heading">
          <h2 id="board-benchmark-heading" className="text-lg font-bold">Benchmark Project</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Local LLM 초기 실험은 현재 Standard·Custom Benchmark로 분리해 운영합니다.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/benchmarks" className="rounded-lg bg-foreground px-3 py-2 text-xs text-background no-underline hover:opacity-80">Standard Benchmark</Link>
            <Link href="/benchmarks/custom" className="rounded-lg border border-border bg-white px-3 py-2 text-xs no-underline hover:border-blue-300 hover:text-blue-600 dark:bg-gray-900 dark:hover:border-blue-700 dark:hover:text-blue-400">Custom Benchmarks</Link>
            <Link href="/labs/local-llm-benchmark" className="rounded-lg border border-border bg-white px-3 py-2 text-xs no-underline hover:border-blue-300 hover:text-blue-600 dark:bg-gray-900 dark:hover:border-blue-700 dark:hover:text-blue-400">초기 실험 기록</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
