import Link from 'next/link'
import { ArrowRight, CheckCircle2, FlaskConical, ListFilter, Lightbulb } from 'lucide-react'
import { LabsProjectCard } from '@/components/labs-project-card'
import { experiments, type ExperimentCategory } from '@/data/experiments'
import { LAB_FILTERS, parseLabFilter, type LabFilter } from '@/lib/labs'

export const revalidate = 60

type SearchParams = Promise<{ status?: string | string[] }>

const GROUP_META: Record<ExperimentCategory, { label: string; description: string; icon: typeof FlaskConical }> = {
  running: { label: 'Running', description: '현재 직접 돌리고 있는 실험', icon: FlaskConical },
  planning: { label: 'Planning', description: '다음 실험으로 준비 중인 항목', icon: Lightbulb },
  completed: { label: 'Completed', description: '결과가 정리된 실험', icon: CheckCircle2 },
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

function SummaryCard({ category }: { category: ExperimentCategory }) {
  const meta = GROUP_META[category]
  const Icon = meta.icon
  const count = experiments.filter(experiment => experiment.category === category).length

  return (
    <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{meta.label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{count}</p>
      <p className="mt-1 text-xs text-muted-foreground">{meta.description}</p>
    </div>
  )
}

export default async function LabsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const filter = parseLabFilter(params.status)
  const visibleExperiments = filterExperiments(filter)
  const activeFilter = LAB_FILTERS.find(item => item.key === filter)?.label || '전체'

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <header className="max-w-3xl">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            <FlaskConical className="h-4 w-4" />
            DevSnack Experiment Dashboard
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">🧪 DevSnack Lab</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg">
            AI와 함께 직접 만들고, 테스트하고, 실패해보는 실험실
          </p>
        </header>

        <section aria-label="실험 요약" className="mt-8 grid gap-3 sm:grid-cols-3">
          <SummaryCard category="running" />
          <SummaryCard category="planning" />
          <SummaryCard category="completed" />
        </section>

        <section className="mt-8 border-b border-border pb-4" aria-label="실험 필터">
          <div className="flex flex-wrap items-center gap-2">
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
          </div>
        </section>

        <section className="mt-8" aria-labelledby="labs-projects-heading">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 id="labs-projects-heading" className="text-xl font-bold">{activeFilter} 실험</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                한 카드에서는 현재 상태와 최근 결과만 확인하고, 전체 기록은 실험 상세에서 봅니다.
              </p>
            </div>
            <span className="shrink-0 text-sm text-muted-foreground">{visibleExperiments.length}개</span>
          </div>

          {visibleExperiments.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleExperiments.map(experiment => (
                <LabsProjectCard key={experiment.id} experiment={experiment} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              이 상태의 실험이 없습니다.
            </div>
          )}
        </section>

        <div className="mt-10 flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          <span>기존 `/lab`은 비교 기준으로 그대로 유지됩니다.</span>
          <Link href="/lab" className="inline-flex shrink-0 items-center gap-1 font-medium text-foreground no-underline hover:text-blue-600 dark:hover:text-blue-400">
            기존 Lab 보기 <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
