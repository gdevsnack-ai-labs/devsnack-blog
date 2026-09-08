import Link from 'next/link'
import { ArrowRight, FlaskConical, Sparkles } from 'lucide-react'
import { HubHeader } from '@/components/hub-header'
import { LegacyLabSourceCard } from '@/components/legacy-lab-source-card'
import { experiments } from '@/data/experiments'
import { getReclassifiedLabPosts } from '@/lib/ia/hub-data'
import { projectLegacyLabPosts } from '@/lib/ia/hub-projections'
import { getFeaturedExperiment, getProjectFinding, getLabBoardMetadata, getLatestResult, getRecentFindings, LAB_FILTERS } from '@/lib/labs'
import { buildRouteMetadata } from '@/lib/seo/metadata'

export const revalidate = 60

export const metadata = buildRouteMetadata({
  title: 'Lab — DevSnack',
  description: 'AI로 만들 수 있는 것과 아직 안 되는 것을 직접 실험하고, 모델·에이전트·게임·콘텐츠·자동화의 결과와 배움을 기록하는 Lab',
  canonicalPath: '/labs',
})

function LatestFinding({ experiment }: { experiment: ReturnType<typeof getFeaturedExperiment> }) {
  if (!experiment) return null
  const finding = getProjectFinding(experiment)?.statement
  const currentProject = experiment.id === 'stockpulse-v1-fixed'
  const boardStatus = getLabBoardMetadata(experiment).status
  const boardStatusLabel = LAB_FILTERS.find(item => item.key === boardStatus)?.label || boardStatus

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white dark:border-blue-900/60 dark:from-blue-950/30 dark:via-gray-900 dark:to-gray-900" aria-labelledby="latest-finding-heading">
      <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_220px] md:p-7">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300"><Sparkles className="h-4 w-4" aria-hidden="true" />{currentProject ? 'Current Project' : 'Latest Verified Finding'}</div>
          <h2 id="latest-finding-heading" className="mt-3 text-2xl font-bold leading-tight md:text-3xl">{experiment.name}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{currentProject ? 'AI의 KOSPI·KOSDAQ 예측을 실제 장 마감 결과와 비교하고, 무엇이 맞고 틀렸는지와 다음 개선 방향을 기록하는 실험입니다.' : finding || experiment.description}</p>
          <p className="mt-4 text-xs text-muted-foreground">{currentProject ? '시장 예측과 실제 결과를 비교하는 실험' : `${boardStatusLabel} · ${getLatestResult(experiment)?.date || '날짜 미기록'}`}</p>
        </div>
        <div className="flex items-end md:justify-end"><Link href={`/labs/${experiment.id}`} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background no-underline transition-opacity hover:opacity-80 md:w-auto">{currentProject ? '실험 보기' : 'Finding과 Run 보기'} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
      </div>
    </section>
  )
}

function FindingStrip({ experimentId }: { experimentId: string }) {
  const experiment = experiments.find(item => item.id === experimentId)
  if (!experiment) return null
  const finding = getProjectFinding(experiment)?.statement
  if (!finding) return null
  return <Link href={`/labs/${experiment.id}`} className="group rounded-xl border border-border bg-white p-4 no-underline transition-colors hover:border-blue-300 dark:bg-gray-900 dark:hover:border-blue-700"><div className="flex items-start justify-between gap-3"><h3 className="line-clamp-2 text-sm font-bold leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400">{experiment.name}</h3><ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /></div><p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{finding}</p></Link>
}

export default async function LabsPage() {
  const legacyLabPosts = projectLegacyLabPosts(await getReclassifiedLabPosts())
  const featured = getFeaturedExperiment(experiments.filter(experiment => experiment.id !== 'local-llm-benchmark'))
  const recentFindings = getRecentFindings(experiments.filter(experiment => experiment.id !== 'local-llm-benchmark'), 3)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <HubHeader eyebrow="Explore · Build · Test" title="🧪 DevSnack Lab" description="AI로 만들 수 있는 것과 아직 안 되는 것을 직접 실험합니다. 모델·에이전트·게임·콘텐츠·자동화를 주제별로 나눠, 실제로 만들고 돌려본 결과와 배움을 기록합니다." icon={FlaskConical} />

        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Lab destinations">
          <Link href="/labs/board" className="rounded-lg bg-foreground px-3 py-2 text-sm text-background no-underline hover:opacity-80">Lab Board 보기</Link>
          <Link href="/demos" className="rounded-lg border border-border bg-white px-3 py-2 text-sm no-underline hover:border-blue-300 hover:text-blue-600 dark:bg-gray-900 dark:hover:border-blue-700 dark:hover:text-blue-400">Showcase 보기</Link>
          <Link href="/benchmarks" className="rounded-lg border border-border bg-white px-3 py-2 text-sm no-underline hover:border-blue-300 hover:text-blue-600 dark:bg-gray-900 dark:hover:border-blue-700 dark:hover:text-blue-400">Benchmarks 보기</Link>
        </nav>

        <LatestFinding experiment={featured} />

        {recentFindings.length > 0 && <section className="mt-10" aria-labelledby="recent-findings-heading"><div className="mb-4 flex items-end justify-between gap-3"><h2 id="recent-findings-heading" className="text-xl font-bold">Recent Verified Findings</h2><span className="text-xs text-muted-foreground">{recentFindings.length}개</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{recentFindings.map(experiment => <FindingStrip key={experiment.id} experimentId={experiment.id} />)}</div></section>}

        {legacyLabPosts.length > 0 && (
          <section className="mt-10" aria-labelledby="lab-notes-heading">
            <div className="mb-4">
              <h2 id="lab-notes-heading" className="text-xl font-bold">Lab Notes</h2>
              <p className="mt-1 text-sm text-muted-foreground">실험 중 겪은 문제와 배움을 짧게 남긴 기록입니다.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {legacyLabPosts.map(post => <LegacyLabSourceCard key={post.asset.assetId} post={post} />)}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
