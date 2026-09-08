'use client'

import { useState } from 'react'
import { FlaskConical, Hammer, Sparkles } from 'lucide-react'
import { LabHubProjectCard } from '@/components/lab-hub-project-card'
import type { LabProjectProjection } from '@/lib/ia/hub-projections'
import type { LabFilter } from '@/lib/labs'

type PublicFilter = 'all' | 'active' | 'paused' | 'completed'

const PUBLIC_FILTERS: Array<{ key: PublicFilter; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'active', label: '진행 중' },
  { key: 'paused', label: '보류' },
  { key: 'completed', label: '완료' },
]

const COLLECTION_META = {
  experiments: { label: 'Experiments', description: 'AI 모델·에이전트·자동화의 가설을 검증하는 실험', icon: FlaskConical },
  'builds-systems': { label: 'Builds & Systems', description: '직접 만들고 반복적으로 운영하는 도구와 시스템', icon: Hammer },
  'creative-tests': { label: 'Creative Tests', description: '이미지·영상·게임 등 생성형 AI의 가능성을 시험하는 실험', icon: Sparkles },
} as const

const COLLECTION_ORDER = ['experiments', 'builds-systems', 'creative-tests'] as const

function publicFilter(value: LabFilter): PublicFilter {
  return value === 'active' || value === 'paused' || value === 'completed' ? value : 'all'
}

export function LabBoard({ projects, initialFilter, basePath = '/labs', showHeading = true }: { projects: LabProjectProjection[]; initialFilter: LabFilter; basePath?: string; showHeading?: boolean }) {
  const [filter, setFilter] = useState<PublicFilter>(publicFilter(initialFilter))
  const visibleProjects = filter === 'all'
    ? projects
    : projects.filter(project => project.boardStatus === filter)

  function selectFilter(next: PublicFilter) {
    setFilter(next)
    const query = next === 'all' ? '' : `?status=${next}`
    window.history.replaceState(null, '', `${basePath}${query}`)
  }

  return (
    <section className="mt-8 rounded-xl border border-border bg-white p-5 dark:bg-gray-900" aria-labelledby={showHeading ? 'lab-board-heading' : undefined} aria-label={showHeading ? undefined : 'Lab project board'}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        {showHeading ? <h2 id="lab-board-heading" className="text-xl font-bold">Lab Board</h2> : <span className="text-sm font-semibold text-muted-foreground">Project status</span>}
        <span className="text-xs text-muted-foreground" aria-live="polite">{visibleProjects.length} projects</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Lab project status filter">
        {PUBLIC_FILTERS.map(item => {
          const active = item.key === filter
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={active}
              onClick={() => selectFilter(item.key)}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${active ? 'border-foreground bg-foreground text-background' : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'}`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <div id="lab-project-collections" className="mt-6 space-y-8">
        {visibleProjects.length > 0 ? COLLECTION_ORDER.map(collection => {
          const collectionProjects = visibleProjects.filter(project => project.collection === collection)
          if (collectionProjects.length === 0) return null
          const meta = COLLECTION_META[collection]
          const Icon = meta.icon
          return (
            <section key={collection} aria-labelledby={`lab-${collection}-heading`}>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2"><Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h3 id={`lab-${collection}-heading`} className="text-lg font-bold">{meta.label}</h3></div>
                  <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">{collectionProjects.length} projects</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {collectionProjects.map(project => <LabHubProjectCard key={project.id} project={project} />)}
              </div>
            </section>
          )
        }) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">이 상태의 Project가 없습니다.</div>
        )}
      </div>
    </section>
  )
}
