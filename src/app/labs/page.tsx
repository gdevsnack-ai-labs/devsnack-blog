import Link from 'next/link'
import { ArrowRight, FlaskConical, Hammer, Play, Sparkles } from 'lucide-react'
import { HubHeader } from '@/components/hub-header'
import { LabHubProjectCard } from '@/components/lab-hub-project-card'
import { RelatedAssets } from '@/components/related-assets'
import { experiments, type ExperimentCategory } from '@/data/experiments'
import { DEMO_ASSETS } from '@/lib/ia'
import { getLabCollectionProjects, getRelatedAssets } from '@/lib/ia/hub-projections'
import { getFeaturedExperiment, getKeyFinding, getLatestResult, getRecentFindings, LAB_FILTERS, parseLabFilter, type LabFilter } from '@/lib/labs'
import { buildRouteMetadata } from '@/lib/seo/metadata'

export const revalidate = 60

export const metadata = buildRouteMetadata({
  title: 'Lab — DevSnack',
  description: '직접 만들고, 돌려보고, 실패하면서 확인한 DevSnack의 Experiment·Build·System·Creative Test 기록',
  canonicalPath: '/labs',
})

type SearchParams = Promise<{ status?: string | string[] }>

const FILTER_TO_CATEGORY: Record<Exclude<LabFilter, 'all'>, ExperimentCategory> = {
  running: 'running',
  planning: 'planning',
  completed: 'completed',
}

const COLLECTION_META = {
  experiments: { label: 'Experiments', description: '질문을 세우고 실제로 검증한 Project', icon: FlaskConical },
  'builds-systems': { label: 'Builds & Systems', description: '직접 만들고 반복적으로 운영하는 Build와 System', icon: Hammer },
  'creative-tests': { label: 'Creative Tests', description: '생성형 AI의 가능성과 한계를 시험한 Project', icon: Sparkles },
} as const

function filterProjects<T extends { experiment: { category: ExperimentCategory } }>(projects: T[], filter: LabFilter): T[] {
  if (filter === 'all') return projects
  return projects.filter(project => project.experiment.category === FILTER_TO_CATEGORY[filter])
}

function LatestFinding({ experiment }: { experiment: ReturnType<typeof getFeaturedExperiment> }) {
  if (!experiment) return null
  const finding = getKeyFinding(experiment) || getLatestResult(experiment)?.result
  if (!finding) return null

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white dark:border-blue-900/60 dark:from-blue-950/30 dark:via-gray-900 dark:to-gray-900" aria-labelledby="latest-finding-heading">
      <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_220px] md:p-7">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300"><Sparkles className="h-4 w-4" aria-hidden="true" />Latest Finding</div>
          <h2 id="latest-finding-heading" className="mt-3 text-2xl font-bold leading-tight md:text-3xl">{experiment.name}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{finding}</p>
          <p className="mt-4 text-xs text-muted-foreground">Project Context · {experiment.status} · {getLatestResult(experiment)?.date || '날짜 미기록'}</p>
        </div>
        <div className="flex items-end md:justify-end"><Link href={`/labs/${experiment.id}`} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background no-underline transition-opacity hover:opacity-80 md:w-auto">Finding과 Run 보기 <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
      </div>
    </section>
  )
}

function FindingStrip({ experimentId }: { experimentId: string }) {
  const experiment = experiments.find(item => item.id === experimentId)
  if (!experiment) return null
  const finding = getKeyFinding(experiment) || getLatestResult(experiment)?.result
  if (!finding) return null
  return <Link href={`/labs/${experiment.id}`} className="group rounded-xl border border-border bg-white p-4 no-underline transition-colors hover:border-blue-300 dark:bg-gray-900 dark:hover:border-blue-700"><div className="flex items-start justify-between gap-3"><h3 className="line-clamp-2 text-sm font-bold leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400">{experiment.name}</h3><ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /></div><p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{finding}</p></Link>
}

function CollectionSection({ collection, projects }: { collection: keyof typeof COLLECTION_META; projects: ReturnType<typeof getLabCollectionProjects> }) {
  const meta = COLLECTION_META[collection]
  const Icon = meta.icon
  return (
    <section className="mt-10" aria-labelledby={`lab-${collection}-heading`}>
      <div className="mb-4 flex items-end justify-between gap-3"><div><div className="flex items-center gap-2"><Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id={`lab-${collection}-heading`} className="text-xl font-bold">{meta.label}</h2></div><p className="mt-1 text-sm text-muted-foreground">{meta.description}</p></div><span className="text-xs text-muted-foreground">{projects.length} projects</span></div>
      {projects.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projects.map(project => <LabHubProjectCard key={project.id} project={project} />)}</div> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">이 Collection에는 아직 Project가 없습니다.</div>}
    </section>
  )
}

export default async function LabsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const filter = parseLabFilter(params.status)
  const projections = getLabCollectionProjects(experiments, 'experiments').concat(getLabCollectionProjects(experiments, 'builds-systems'), getLabCollectionProjects(experiments, 'creative-tests'))
  const featured = getFeaturedExperiment(experiments.filter(experiment => experiment.id !== 'local-llm-benchmark'))
  const recentFindings = getRecentFindings(experiments.filter(experiment => experiment.id !== 'local-llm-benchmark'), 3)
  const visibleExperiments = filterProjects(getLabCollectionProjects(experiments, 'experiments'), filter)
  const visibleBuilds = filterProjects(getLabCollectionProjects(experiments, 'builds-systems'), filter)
  const visibleCreativeTests = filterProjects(getLabCollectionProjects(experiments, 'creative-tests'), filter)
  const activeFilter = LAB_FILTERS.find(item => item.key === filter)?.label || '전체'
  const showcase = DEMO_ASSETS.slice(0, 4)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <HubHeader eyebrow="Make · Run · Learn" title="🧪 DevSnack Lab" description="직접 만들고, 돌려보고, 실패하면서 확인한 것들. Project는 Context이고, 아래의 Finding·Result·Artifact가 실제로 읽고 보는 Information Asset입니다." icon={FlaskConical} />

        <LatestFinding experiment={featured} />

        {recentFindings.length > 0 && <section className="mt-10" aria-labelledby="recent-findings-heading"><div className="mb-4 flex items-end justify-between gap-3"><div><h2 id="recent-findings-heading" className="text-xl font-bold">Recent Findings</h2><p className="mt-1 text-sm text-muted-foreground">상태나 진행률보다 최근에 확인한 결과를 먼저 봅니다.</p></div><span className="text-xs text-muted-foreground">{recentFindings.length} findings</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{recentFindings.map(experiment => <FindingStrip key={experiment.id} experimentId={experiment.id} />)}</div></section>}

        <section className="mt-10 rounded-xl border border-border bg-white p-4 dark:bg-gray-900" aria-labelledby="lab-filter-heading"><div className="flex flex-wrap items-center gap-2"><h2 id="lab-filter-heading" className="mr-2 text-sm font-semibold">Project filter</h2>{LAB_FILTERS.map(item => { const active = item.key === filter; const href = item.key === 'all' ? '/labs' : `/labs?status=${item.key}`; return <Link key={item.key} href={href} aria-current={active ? 'page' : undefined} className={`rounded-full px-3 py-1.5 text-xs no-underline ${active ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{item.label}</Link> })}<span className="ml-auto text-xs text-muted-foreground">{activeFilter} · {projections.filter(project => filter === 'all' || project.experiment.category === FILTER_TO_CATEGORY[filter]).length} projects</span></div></section>

        <CollectionSection collection="experiments" projects={visibleExperiments} />
        <CollectionSection collection="builds-systems" projects={visibleBuilds} />
        <CollectionSection collection="creative-tests" projects={visibleCreativeTests} />

        <section className="mt-10" aria-labelledby="lab-showcase-heading"><div className="mb-4 flex items-end justify-between gap-3"><div><div className="flex items-center gap-2"><Play className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="lab-showcase-heading" className="text-xl font-bold">Showcase</h2></div><p className="mt-1 text-sm text-muted-foreground">Lab에서 나온 결과물을 직접 실행하거나 재생합니다.</p></div><Link href="/demos" className="inline-flex items-center gap-1 text-sm text-muted-foreground no-underline hover:text-foreground">전체 Showcase <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{showcase.map(asset => <Link key={asset.assetId} href={asset.route} className="group rounded-xl border border-border bg-white p-4 no-underline dark:bg-gray-900"><p className="text-[11px] font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">Showcase</p><h3 className="mt-2 line-clamp-2 text-sm font-bold group-hover:text-purple-600 dark:group-hover:text-purple-400">{asset.title}</h3><p className="mt-2 text-xs text-muted-foreground">{asset.artifactHref || asset.route}</p></Link>)}</div></section>

        {featured && <RelatedAssets links={getRelatedAssets(`project:${featured.id}`)} title={`${featured.name} · Related Assets`} />}
      </div>
    </div>
  )
}
