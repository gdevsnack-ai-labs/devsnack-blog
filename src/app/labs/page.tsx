import Link from 'next/link'
import { ArrowRight, FlaskConical, Hammer, Play, Sparkles } from 'lucide-react'
import { HubHeader } from '@/components/hub-header'
import { LabHubProjectCard } from '@/components/lab-hub-project-card'
import { LegacyLabSourceCard } from '@/components/legacy-lab-source-card'
import { RelatedAssets } from '@/components/related-assets'
import { experiments } from '@/data/experiments'
import { DEMO_ASSETS } from '@/lib/ia'
import { getReclassifiedLabPosts } from '@/lib/ia/hub-data'
import { getLabCollectionProjects, getRelatedAssets, projectLegacyLabPosts } from '@/lib/ia/hub-projections'
import { getFeaturedExperiment, getProjectFinding, getLabBoardMetadata, getLabStatusCounts, getLatestResult, getRecentFindings, LAB_FILTERS, parseLabFilter, type LabFilter } from '@/lib/labs'
import { buildRouteMetadata } from '@/lib/seo/metadata'

export const revalidate = 60

export const metadata = buildRouteMetadata({
  title: 'Lab — DevSnack',
  description: '직접 만들고, 돌려보고, 실패하면서 확인한 DevSnack의 Experiment·Build·System·Creative Test 기록',
  canonicalPath: '/labs',
})

type SearchParams = Promise<{ status?: string | string[] }>

const COLLECTION_META = {
  experiments: { label: 'Experiments', description: '질문을 세우고 실제로 검증한 Project', icon: FlaskConical },
  'builds-systems': { label: 'Builds & Systems', description: '직접 만들고 반복적으로 운영하는 Build와 System', icon: Hammer },
  'creative-tests': { label: 'Creative Tests', description: '생성형 AI의 가능성과 한계를 시험한 Project', icon: Sparkles },
} as const

function filterProjects<T extends { boardStatus: Exclude<LabFilter, 'all'> }>(projects: T[], filter: LabFilter): T[] {
  if (filter === 'all') return projects
  return projects.filter(project => project.boardStatus === filter)
}

function LatestFinding({ experiment }: { experiment: ReturnType<typeof getFeaturedExperiment> }) {
  if (!experiment) return null
  const finding = getProjectFinding(experiment)?.statement
  if (!finding) return null
  const boardStatus = getLabBoardMetadata(experiment).status
  const boardStatusLabel = LAB_FILTERS.find(item => item.key === boardStatus)?.label || boardStatus

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white dark:border-blue-900/60 dark:from-blue-950/30 dark:via-gray-900 dark:to-gray-900" aria-labelledby="latest-finding-heading">
      <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_220px] md:p-7">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300"><Sparkles className="h-4 w-4" aria-hidden="true" />Latest Verified Finding</div>
          <h2 id="latest-finding-heading" className="mt-3 text-2xl font-bold leading-tight md:text-3xl">{experiment.name}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{finding}</p>
          <p className="mt-4 text-xs text-muted-foreground">Project Context · {boardStatusLabel} · {getLatestResult(experiment)?.date || '날짜 미기록'}</p>
        </div>
        <div className="flex items-end md:justify-end"><Link href={`/labs/${experiment.id}`} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background no-underline transition-opacity hover:opacity-80 md:w-auto">Finding과 Run 보기 <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
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

function CollectionSection({ collection, projects }: { collection: keyof typeof COLLECTION_META; projects: ReturnType<typeof getLabCollectionProjects> }) {
  const meta = COLLECTION_META[collection]
  const Icon = meta.icon
  const projectCount = projects.length
  return (
    <section className="mt-10" aria-labelledby={`lab-${collection}-heading`}>
      <div className="mb-4 flex items-end justify-between gap-3"><div><div className="flex items-center gap-2"><Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id={`lab-${collection}-heading`} className="text-xl font-bold">{meta.label}</h2></div><p className="mt-1 text-sm text-muted-foreground">{meta.description}</p></div><span className="text-xs text-muted-foreground">{projectCount} projects</span></div>
      {projectCount > 0 ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projects.map(project => <LabHubProjectCard key={project.id} project={project} />)}</div> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">이 Collection에는 아직 Project가 없습니다.</div>}
    </section>
  )
}

export default async function LabsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const filter = parseLabFilter(params.status)
  const legacyLabPosts = projectLegacyLabPosts(await getReclassifiedLabPosts())
  const labProjects = getLabCollectionProjects(experiments, 'experiments').concat(getLabCollectionProjects(experiments, 'builds-systems'), getLabCollectionProjects(experiments, 'creative-tests'))
  const featured = getFeaturedExperiment(experiments.filter(experiment => experiment.id !== 'local-llm-benchmark'))
  const recentFindings = getRecentFindings(experiments.filter(experiment => experiment.id !== 'local-llm-benchmark'), 3)
  const statusCounts = getLabStatusCounts(labProjects.map(project => project.experiment))
  const visibleExperiments = filterProjects(labProjects.filter(project => project.collection === 'experiments'), filter)
  const visibleBuilds = filterProjects(labProjects.filter(project => project.collection === 'builds-systems'), filter)
  const visibleCreativeTests = filterProjects(labProjects.filter(project => project.collection === 'creative-tests'), filter)
  const activeFilter = LAB_FILTERS.find(item => item.key === filter)?.label || '전체'
  const boardFilters = LAB_FILTERS.slice(1) as Array<{ key: Exclude<LabFilter, 'all'>; label: string }>
  const showcase = DEMO_ASSETS.slice(0, 4)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <HubHeader eyebrow="Make · Run · Learn" title="🧪 DevSnack Lab" description="직접 만들고, 돌려보고, 실패하면서 확인한 것들. Project는 Context이고, 아래의 Finding·Result·Artifact가 실제로 읽고 보는 Information Asset입니다." icon={FlaskConical} />

        <LatestFinding experiment={featured} />

        {recentFindings.length > 0 && <section className="mt-10" aria-labelledby="recent-findings-heading"><div className="mb-4 flex items-end justify-between gap-3"><div><h2 id="recent-findings-heading" className="text-xl font-bold">Recent Verified Findings</h2><p className="mt-1 text-sm text-muted-foreground">최근 활동이나 발행물이 아니라, 근거가 있는 Project Finding만 보여줍니다.</p></div><span className="text-xs text-muted-foreground">{recentFindings.length} findings</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{recentFindings.map(experiment => <FindingStrip key={experiment.id} experimentId={experiment.id} />)}</div></section>}

        {legacyLabPosts.length > 0 && (
          <section className="mt-10" aria-labelledby="legacy-lab-source-heading">
            <div className="mb-4">
              <h2 id="legacy-lab-source-heading" className="text-xl font-bold">Reclassified Lab Sources</h2>
              <p className="mt-1 text-sm text-muted-foreground">기존 `/devsnack` URL을 유지하면서 Experiment 원문으로 연결한 기록입니다.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {legacyLabPosts.map(post => <LegacyLabSourceCard key={post.asset.assetId} post={post} />)}
            </div>
          </section>
        )}

        <section className="mt-10 rounded-xl border border-border bg-white p-5 dark:bg-gray-900" aria-labelledby="lab-board-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="lab-board-heading" className="text-xl font-bold">Lab Board</h2>
              <p className="mt-1 text-sm text-muted-foreground">기존 Project metadata에서 현재 상태와 다음 작업을 읽어 보여줍니다.</p>
            </div>
            <span className="text-xs text-muted-foreground">{labProjects.length} projects · {activeFilter}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {boardFilters.map(item => {
              const active = item.key === filter
              const href = `/labs?status=${item.key}`
              return <Link key={item.key} href={href} aria-current={active ? 'page' : undefined} className={`rounded-lg border px-3 py-2.5 no-underline transition-colors ${active ? 'border-foreground bg-foreground text-background' : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'}`}><span className="block text-xs">{item.label}</span><strong className="mt-1 block text-lg leading-none">{statusCounts[item.key]}</strong></Link>
            })}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>전체 Project를 상태별로 필터링합니다.</span>
            {filter !== 'all' && <Link href="/labs" className="no-underline hover:text-foreground">전체 보기</Link>}
          </div>
        </section>

        <CollectionSection collection="experiments" projects={visibleExperiments} />
        <CollectionSection collection="builds-systems" projects={visibleBuilds} />
        <CollectionSection collection="creative-tests" projects={visibleCreativeTests} />

        <section className="mt-10" aria-labelledby="lab-showcase-heading"><div className="mb-4 flex items-end justify-between gap-3"><div><div className="flex items-center gap-2"><Play className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="lab-showcase-heading" className="text-xl font-bold">Showcase</h2></div><p className="mt-1 text-sm text-muted-foreground">Lab에서 나온 결과물을 직접 실행하거나 재생합니다.</p></div><Link href="/demos" className="inline-flex items-center gap-1 text-sm text-muted-foreground no-underline hover:text-foreground">전체 Showcase <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{showcase.map(asset => <Link key={asset.assetId} href={asset.route} className="group rounded-xl border border-border bg-white p-4 no-underline dark:bg-gray-900"><p className="text-[11px] font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">Showcase</p><h3 className="mt-2 line-clamp-2 text-sm font-bold group-hover:text-purple-600 dark:group-hover:text-purple-400">{asset.title}</h3><p className="mt-2 text-xs text-muted-foreground">{asset.artifactHref || asset.route}</p></Link>)}</div></section>

        {featured && <RelatedAssets links={getRelatedAssets(`project:${featured.id}`)} title={`${featured.name} · Related Assets`} />}
      </div>
    </div>
  )
}
