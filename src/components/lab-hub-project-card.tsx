import Link from 'next/link'
import { ArrowRight, Box, FlaskConical, Hammer, Sparkles } from 'lucide-react'
import type { LabProjectProjection } from '@/lib/ia/hub-projections'

const TYPE_META = {
  Experiment: { icon: FlaskConical, className: 'text-blue-600 dark:text-blue-400' },
  Build: { icon: Hammer, className: 'text-orange-600 dark:text-orange-400' },
  System: { icon: Box, className: 'text-green-600 dark:text-green-400' },
  'Creative Test': { icon: Sparkles, className: 'text-purple-600 dark:text-purple-400' },
} as const

export function LabHubProjectCard({ project }: { project: LabProjectProjection }) {
  const meta = TYPE_META[project.displayType]
  const Icon = meta.icon

  return (
    <Link href={project.href} className="group flex min-w-0 h-full flex-col rounded-xl border border-border bg-white p-5 no-underline transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:bg-gray-900 dark:hover:border-blue-700">
      <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${meta.className}`}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{project.displayType}</span>
        <span className="text-muted-foreground">·</span>
        <span className="truncate">{project.domain.join(' · ')}</span>
      </div>
      <h3 className="mt-4 line-clamp-2 text-lg font-bold leading-snug transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">{project.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{project.description}</p>

      {project.finding ? (
        <div className="mt-4 flex-1 rounded-lg border-l-2 border-blue-400 bg-blue-50/60 px-3 py-2.5 dark:border-blue-600 dark:bg-blue-950/20">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Latest Finding</p>
          <p className="mt-1 line-clamp-4 text-sm leading-relaxed">{project.finding}</p>
        </div>
      ) : (
        <div className="mt-4 flex-1 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Project Context</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{project.isDummy ? '아직 공개 Finding이 없는 계획 항목입니다.' : '반복적으로 운영되는 시스템과 Build입니다.'}</p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
        <span>{project.latestDate ? `최근 기록 ${project.latestDate}` : project.isDummy ? '계획 중' : '기록 준비 중'}</span>
        <span className="inline-flex items-center gap-1 font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">Project 보기 <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
      </div>
    </Link>
  )
}
