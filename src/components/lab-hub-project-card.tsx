import Link from 'next/link'
import { ArrowRight, Box, FlaskConical, Hammer, Sparkles } from 'lucide-react'
import type { LabProjectProjection } from '@/lib/ia/hub-projections'
import type { LabBoardStatus } from '@/lib/labs'

const TYPE_META = {
  Experiment: { icon: FlaskConical, className: 'text-blue-600 dark:text-blue-400' },
  Build: { icon: Hammer, className: 'text-orange-600 dark:text-orange-400' },
  System: { icon: Box, className: 'text-green-600 dark:text-green-400' },
  'Creative Test': { icon: Sparkles, className: 'text-purple-600 dark:text-purple-400' },
} as const

const STATUS_META: Record<LabBoardStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  next: { label: 'Next', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  backlog: { label: 'Backlog', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  paused: { label: 'Paused', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  completed: { label: 'Completed', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
}

export function LabHubProjectCard({ project }: { project: LabProjectProjection }) {
  const meta = TYPE_META[project.displayType]
  const Icon = meta.icon
  const status = STATUS_META[project.boardStatus]

  return (
    <Link href={project.href} className="group flex min-w-0 h-full flex-col rounded-xl border border-border bg-white p-5 no-underline transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:bg-gray-900 dark:hover:border-blue-700">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex min-w-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${meta.className}`}>
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{project.displayType}</span>
          <span className="text-muted-foreground">·</span>
          <span className="truncate">{project.domain.join(' · ')}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${status.className}`}>
            {status.label}
          </span>
          {project.statusConfidence === 'inferred' && <span className="text-[10px] text-muted-foreground" title="기존 기록을 바탕으로 한 상태 투영">추정</span>}
        </div>
      </div>
      <h3 className="mt-4 line-clamp-2 text-lg font-bold leading-snug transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">{project.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{project.description}</p>

      {project.projectFinding ? (
        <div className="mt-4 flex-1 rounded-lg border-l-2 border-blue-400 bg-blue-50/60 px-3 py-2.5 dark:border-blue-600 dark:bg-blue-950/20">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Project Finding</p>
          <p className="mt-1 line-clamp-4 text-sm leading-relaxed">{project.projectFinding}</p>
        </div>
      ) : (
        <div className="mt-4 flex-1 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Next Action</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{project.nextAction || (project.isDummy ? '아이디어로 보관 중인 Project입니다.' : '다음 활동을 정리 중인 Project입니다.')}</p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
        <span>{project.latestDate ? `최근 활동 ${project.latestDate}` : '활동 기록 준비 중'}</span>
        <span className="inline-flex items-center gap-1 font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">Project 보기 <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
      </div>
    </Link>
  )
}
