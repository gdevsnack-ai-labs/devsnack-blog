import Link from 'next/link'
import { ArrowRight, FlaskConical } from 'lucide-react'
import type { Experiment } from '@/data/experiments'
import { getDomainLabel, getKeyFinding, getLatestResult } from '@/lib/labs'

const STATUS_CLASS: Record<string, string> = {
  진행중: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  완료: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  예정: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  보류: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  미정: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

const CATEGORY_CLASS: Record<string, string> = {
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-green-600 dark:text-green-400',
  orange: 'text-orange-600 dark:text-orange-400',
  purple: 'text-purple-600 dark:text-purple-400',
}

export function LabsProjectCard({ experiment }: { experiment: Experiment }) {
  const keyFinding = getKeyFinding(experiment)
  const latestActivity = getLatestResult(experiment)
  const categoryClass = CATEGORY_CLASS[experiment.color] || CATEGORY_CLASS.blue

  return (
    <Link
      href={`/labs/${experiment.id}`}
      className="group flex h-full min-h-[286px] flex-col rounded-xl border border-border bg-white p-5 no-underline transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:bg-gray-900 dark:hover:border-blue-700"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex min-w-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${categoryClass}`}>
          <FlaskConical className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{getDomainLabel(experiment)}</span>
        </div>
        <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[experiment.status] || STATUS_CLASS.미정}`}>
          {experiment.status}
        </span>
      </div>

      <h2 className="mt-4 line-clamp-2 text-lg font-bold leading-snug transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
        {experiment.name}
      </h2>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {experiment.description}
      </p>

      <div className="mt-4 flex-1 rounded-lg border-l-2 border-blue-400 bg-blue-50/60 px-3 py-2.5 dark:border-blue-600 dark:bg-blue-950/20">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Key Finding</p>
        <p className="mt-1 line-clamp-4 text-sm leading-relaxed text-foreground">
          {keyFinding || '핵심 발견을 정리 중인 실험입니다.'}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
        <span>
          {latestActivity?.date ? `최근 활동 ${latestActivity.date}` : experiment.startedAt ? `${experiment.startedAt} 시작` : '기록 준비 중'}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 font-medium text-foreground transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
          실험 보기 <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
