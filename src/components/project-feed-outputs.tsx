import Link from 'next/link'
import { ArrowUpRight, Bot, ChartNoAxesCombined, Radio } from 'lucide-react'
import type { ProjectFeedOutput } from '@/lib/ia/feed-output-projection'
import { feedProjectForBlog } from '@/lib/ia/feed-projects'
import { normalizeProvenance } from '@/lib/provenance'

function formatDate(value: string | null): string {
  if (!value) return '날짜 미기록'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}

export function ProjectFeedOutputs({ outputs }: { outputs: ProjectFeedOutput[] }) {
  if (outputs.length === 0) return null
  const feedProject = feedProjectForBlog(outputs[0].blogId)
  const isStockPulse = outputs[0].blogId === 'stockpulse'
  const Icon = isStockPulse ? ChartNoAxesCombined : Bot
  const feedName = isStockPulse ? 'StockPulse Feed' : 'AI Tech Feed'

  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/15" aria-labelledby="project-feed-outputs-heading">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="project-feed-outputs-heading" className="text-xl font-bold">Recent Feed Outputs</h2>
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-gray-900/60 dark:text-emerald-300">System → produces → Feed</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            이 Project가 실제로 생성한 최근 {feedName}입니다. 제목을 선택하면 해당 Feed 원문으로 이동합니다.
          </p>
          <div className="mt-4 space-y-2">
            {outputs.map(output => {
              const provenance = normalizeProvenance(output.provenance)
              return (
                <Link key={output.id} href={output.href} className="group flex items-start gap-3 rounded-lg border border-emerald-200/80 bg-white/80 p-3 no-underline transition-colors hover:border-emerald-400 hover:bg-white dark:border-emerald-900/50 dark:bg-gray-900/50 dark:hover:border-emerald-700">
                  <Radio className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block line-clamp-2 text-sm font-medium text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300">{output.title}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span>{formatDate(output.published)}</span>
                      {provenance?.session && <span>· {provenance.session}</span>}
                      {provenance?.source_count !== undefined && <span>· 출처 {provenance.source_count}개</span>}
                    </span>
                  </span>
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-emerald-600" aria-hidden="true" />
                </Link>
              )
            })}
          </div>
          {feedProject && (
            <Link href={isStockPulse ? '/stock' : '/aitech'} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 no-underline hover:underline dark:text-emerald-300">
              {feedProject.label} 전체 보기 <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
