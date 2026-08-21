import Link from 'next/link'
import { ArrowRight, CheckCircle2, FlaskConical, Lightbulb, ListFilter, Sparkles } from 'lucide-react'
import { LabsProjectCard } from '@/components/labs-project-card'
import { experiments, type Experiment, type ExperimentCategory } from '@/data/experiments'
import { getFeaturedExperiment, getKeyFinding, getLatestResult, getRecentFindings, LAB_FILTERS, parseLabFilter, type LabFilter } from '@/lib/labs'

export const revalidate = 60

type SearchParams = Promise<{ status?: string | string[] }>

const GROUP_META: Record<ExperimentCategory, { label: string; icon: typeof FlaskConical }> = {
  running: { label: 'Running', icon: FlaskConical },
  planning: { label: 'Planning', icon: Lightbulb },
  completed: { label: 'Completed', icon: CheckCircle2 },
}

const FILTER_TO_CATEGORY: Record<Exclude<LabFilter, 'all'>, ExperimentCategory> = {
  running: 'running',
  planning: 'planning',
  completed: 'completed',
}

function filterExperiments(filter: LabFilter) {
  if (filter === 'all') return experiments
  return experiments.filter(experiment => experiment.category === FILTER_TO_CATEGORY[filter])
}

function CompactSummary({ category }: { category: ExperimentCategory }) {
  const meta = GROUP_META[category]
  const Icon = meta.icon
  const count = experiments.filter(experiment => experiment.category === category).length

  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2.5 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{meta.label}</span>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="mt-1 text-xl font-bold tracking-tight">{count}</p>
    </div>
  )
}

function FeaturedExperiment({ experiment }: { experiment: Experiment }) {
  const finding = getKeyFinding(experiment) || getLatestResult(experiment)?.result || '핵심 발견을 정리 중인 실험입니다.'
  const latestActivity = getLatestResult(experiment)

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white dark:border-blue-900/60 dark:from-blue-950/30 dark:via-gray-900 dark:to-gray-900" aria-labelledby="latest-experiment-heading">
      <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_220px] md:p-7">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
            <Sparkles className="h-4 w-4" />
            Latest Experiment
          </div>
          <h2 id="latest-experiment-heading" className="mt-3 text-2xl font-bold leading-tight md:text-3xl">{experiment.name}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{experiment.description}</p>

          <div className="mt-5 border-l-2 border-blue-500 pl-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Key Finding</p>
            <p className="mt-2 max-w-3xl text-base leading-relaxed">{finding}</p>
          </div>

          {latestActivity && (
            <p className="mt-4 text-xs text-muted-foreground">
              Latest Activity · {latestActivity.date || '날짜 미기록'} · {latestActivity.name}
            </p>
          )}
        </div>

        <div className="flex items-end md:justify-end">
          <Link href={`/labs/${experiment.id}`} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background no-underline transition-opacity hover:opacity-80 md:w-auto">
            실험 결과 보기 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function FindingCard({ experiment }: { experiment: Experiment }) {
  const activity = getLatestResult(experiment)
  const finding = getKeyFinding(experiment)

  if (!finding) return null

  return (
    <Link href={`/labs/${experiment.id}`} className="group rounded-xl border border-border bg-white p-4 no-underline transition-colors hover:border-blue-300 dark:bg-gray-900 dark:hover:border-blue-700">
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400">{experiment.name}</h3>
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground">{finding}</p>
      <p className="mt-3 text-xs text-muted-foreground">{activity?.date || '날짜 미기록'}</p>
    </Link>
  )
}

export default async function LabsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const filter = parseLabFilter(params.status)
  const visibleExperiments = filterExperiments(filter)
  const activeFilter = LAB_FILTERS.find(item => item.key === filter)?.label || '전체'
  const featuredExperiment = getFeaturedExperiment(experiments)
  const recentFindings = getRecentFindings(experiments)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <header className="max-w-3xl">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            <FlaskConical className="h-4 w-4" />
            Experiment Feed
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">🧪 DevSnack Lab</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg">
            직접 만들고, 돌려보고, 실패하면서 확인한 것들
          </p>
        </header>

        {featuredExperiment && <FeaturedExperiment experiment={featuredExperiment} />}

        {recentFindings.length > 0 && (
          <section className="mt-10" aria-labelledby="recent-findings-heading">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 id="recent-findings-heading" className="text-xl font-bold">Recent Findings</h2>
                <p className="mt-1 text-sm text-muted-foreground">최근 작업보다, 실험을 통해 확인한 핵심 결과를 먼저 보여줍니다.</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{recentFindings.length} findings</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {recentFindings.map(experiment => <FindingCard key={experiment.id} experiment={experiment} />)}
            </div>
          </section>
        )}

        <section className="mt-12" aria-labelledby="labs-projects-heading">
          <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 id="labs-projects-heading" className="text-xl font-bold">Projects</h2>
              <p className="mt-1 text-sm text-muted-foreground">전체 실험을 상태별로 탐색합니다.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 md:w-[330px]">
              <CompactSummary category="running" />
              <CompactSummary category="planning" />
              <CompactSummary category="completed" />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2" aria-label="실험 필터">
            <div className="mr-1 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <ListFilter className="h-4 w-4" />
              상태
            </div>
            {LAB_FILTERS.map(item => {
              const active = item.key === filter
              const href = item.key === 'all' ? '/labs' : `/labs?status=${item.key}`
              return (
                <Link
                  key={item.key}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-full px-3 py-1.5 text-sm no-underline transition-colors ${
                    active
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
            <span className="ml-auto text-sm text-muted-foreground">{activeFilter} {visibleExperiments.length}개</span>
          </div>

          <div className="mt-5">
            {visibleExperiments.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleExperiments.map(experiment => <LabsProjectCard key={experiment.id} experiment={experiment} />)}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                이 상태의 실험이 없습니다.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
