import type { Metadata } from 'next'
import Link from 'next/link'
import { BarChart3, BookOpen, FlaskConical, Info, Play, Search, Terminal } from 'lucide-react'
import { HomeDataStrip, HomeExploreLink, HomeFeatureCard, HomeFindingItem, HomeKnowledgeItem, HomeRelationNote, HomeStoryCard } from '@/components/home-projection'
import { experiments } from '@/data/experiments'
import { getDataHubSnapshot, getKnowledgePosts, getRecentStories } from '@/lib/ia/hub-data'
import { createHomeProjection, projectHomeDataServices } from '@/lib/ia/home-projections'
import { projectKnowledgePosts } from '@/lib/ia/hub-projections'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'DevSnack — AI·개발 작업 기록과 결과',
  description: 'AI와 개발을 직접 조사하고, 만들고, 측정하고, 기록하는 DevSnack의 작업 공간과 결과 아카이브입니다.',
  openGraph: {
    title: 'DevSnack — AI·개발 작업 기록과 결과',
    description: 'AI와 개발을 직접 조사하고, 만들고, 측정하고, 기록하는 DevSnack의 작업 공간과 결과 아카이브입니다.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'DevSnack — AI·개발 작업 기록과 결과',
    description: 'AI와 개발을 직접 조사하고, 만들고, 측정하고, 기록하는 DevSnack의 작업 공간과 결과 아카이브입니다.',
  },
}

export default async function Home() {
  const [knowledgePosts, dataSnapshot, storyPosts] = await Promise.all([
    getKnowledgePosts(),
    getDataHubSnapshot(),
    getRecentStories(3),
  ])
  const projection = createHomeProjection({
    experiments,
    knowledge: projectKnowledgePosts(knowledgePosts),
    stories: storyPosts,
    data: dataSnapshot,
  })
  const featuredRelations = projection.featured.filter(item => item.related)
  const dataServices = projection.dataServices || projectHomeDataServices(dataSnapshot)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur dark:bg-gray-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-3 no-underline">
            <Terminal className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span className="min-w-0"><span className="block text-lg font-bold tracking-tight">DevSnack</span><span className="hidden text-[11px] text-muted-foreground sm:block">AI · 개발 작업 기록과 결과</span></span>
          </Link>
          <Link href="/search" aria-label="검색" className="rounded-lg p-2 text-muted-foreground no-underline transition-colors hover:bg-muted hover:text-foreground"><Search className="h-5 w-5" aria-hidden="true" /></Link>
        </div>
      </header>

      <main>
        <section className="border-b border-border bg-gradient-to-b from-background to-muted/30" aria-labelledby="home-identity-heading">
          <div className="mx-auto max-w-6xl px-4 py-11 md:py-14">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">AI · 개발 작업 공간</p>
              <h1 id="home-identity-heading" className="mt-3 text-3xl font-bold leading-tight tracking-tight md:text-5xl">직접 조사하고, 만들고, 측정합니다.</h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">DevSnack은 로컬 AI와 개발 도구를 직접 다뤄보고, 그 과정에서 나온 실험·측정 결과·기술 지식·자동 갱신 데이터를 남기는 개인 작업 기록입니다.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href="/labs" className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background no-underline hover:opacity-80"><FlaskConical className="h-4 w-4" aria-hidden="true" />Lab 둘러보기</Link>
                <Link href="/search" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium no-underline hover:border-foreground/25 dark:bg-gray-900"><Search className="h-4 w-4" aria-hidden="true" />기록 찾기</Link>
              </div>
              <p className="mt-6 text-xs leading-relaxed text-muted-foreground">사람이 읽는 Stories · 직접 검증한 Lab · 실제 측정 결과 Benchmarks · 다시 찾는 Knowledge · 자동 갱신되는 Data</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 md:py-10" aria-labelledby="home-featured-heading">
          <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Now</p><h2 id="home-featured-heading" className="mt-1 text-2xl font-bold">지금 볼 만한 것</h2><p className="mt-1 text-sm text-muted-foreground">최근성만 나열하지 않고, 현재 DevSnack을 가장 잘 보여주는 대표 Asset을 골랐습니다.</p></div>
          {projection.featured.length > 0 ? <div className="grid gap-4 md:grid-cols-3">{projection.featured.map((item, index) => <HomeFeatureCard key={item.href} item={item} featured={index === 0} />)}</div> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">대표 항목을 준비 중입니다.</div>}
          {featuredRelations.length > 0 && <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">{featuredRelations.map(item => <HomeRelationNote key={`${item.href}-${item.kind}`} link={item.related} label={`${item.kind === 'benchmark' ? 'Benchmark' : item.kind === 'finding' ? 'Lab' : 'Knowledge'} relation`} />)}</div>}
        </section>

        <section className="border-y border-border bg-muted/20" aria-labelledby="home-lab-heading">
          <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
            <div className="mb-4 flex items-end justify-between gap-3"><div><div className="flex items-center gap-2"><FlaskConical className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" /><h2 id="home-lab-heading" className="text-xl font-bold">Lab</h2></div><p className="mt-1 text-sm text-muted-foreground">프로젝트 목록보다 최근 Finding과 Result를 먼저 봅니다.</p></div><Link href="/labs" className="text-sm text-muted-foreground no-underline hover:text-foreground">Lab 전체 보기 →</Link></div>
            <div className="grid gap-3 md:grid-cols-2">{projection.labFinding && <HomeFindingItem project={projection.labFinding} />}{projection.labItems.map(project => <HomeFindingItem key={project.id} project={project} />)}</div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 md:py-10" aria-labelledby="home-benchmark-heading">
          <div className="mb-4 flex items-end justify-between gap-3"><div><div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" /><h2 id="home-benchmark-heading" className="text-xl font-bold">Benchmarks</h2></div><p className="mt-1 text-sm text-muted-foreground">현재 published 된 실측 결과만 compact하게 보여줍니다.</p></div><Link href="/benchmarks" className="text-sm text-muted-foreground no-underline hover:text-foreground">전체 결과 →</Link></div>
          {projection.benchmark ? <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/60 dark:bg-amber-950/20"><div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300"><span>Published Benchmark</span><span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] normal-case dark:bg-gray-900/60">{projection.benchmark.target}</span></div><div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"><div><h3 className="text-lg font-bold leading-snug">{projection.benchmark.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{projection.benchmark.result}</p></div><div className="text-sm text-muted-foreground"><p><strong className="text-foreground">Environment:</strong> {projection.benchmark.environment}</p><p className="mt-1"><strong className="text-foreground">Comparison:</strong> {projection.benchmark.comparison}</p></div><Link href="/benchmarks" className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-sm text-background no-underline hover:opacity-80">상세 보기 <BarChart3 className="h-4 w-4" aria-hidden="true" /></Link></div></div> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Published benchmark가 없습니다.</div>}
        </section>

        <section className="border-y border-border bg-muted/20" aria-labelledby="home-knowledge-heading">
          <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
            <div className="mb-4 flex items-end justify-between gap-3"><div><div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" aria-hidden="true" /><h2 id="home-knowledge-heading" className="text-xl font-bold">Knowledge</h2></div><p className="mt-1 text-sm text-muted-foreground">다시 찾아볼 가치가 있는 기술 지식만 소수로 보여줍니다.</p></div><Link href="/research" className="text-sm text-muted-foreground no-underline hover:text-foreground">Knowledge 전체 보기 →</Link></div>
            {projection.knowledge.length > 0 ? <div className="grid gap-3 md:grid-cols-2">{projection.knowledge.map(post => <HomeKnowledgeItem key={post.slug} post={post} />)}</div> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Knowledge asset가 없습니다.</div>}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 md:py-10" aria-labelledby="home-data-heading">
          <div className="mb-4 flex items-end justify-between gap-3"><div><div className="flex items-center gap-2"><Terminal className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /><h2 id="home-data-heading" className="text-xl font-bold">Data</h2></div><p className="mt-1 text-sm text-muted-foreground">자동으로 갱신되는 Feed와 Tracker의 현재 상태입니다.</p></div><Link href="/data" className="text-sm text-muted-foreground no-underline hover:text-foreground">Data Hub →</Link></div>
          <HomeDataStrip services={dataServices} />
        </section>

        <section className="border-y border-border bg-muted/20" aria-labelledby="home-stories-heading">
          <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
            <div className="mb-4 flex items-end justify-between gap-3"><div><div className="flex items-center gap-2"><Terminal className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" /><h2 id="home-stories-heading" className="text-xl font-bold">Stories</h2></div><p className="mt-1 text-sm text-muted-foreground">자동 Feed와 분리한, 사람이 읽는 DevSnack 이야기입니다.</p></div><Link href="/devsnack" className="text-sm text-muted-foreground no-underline hover:text-foreground">Stories 전체 보기 →</Link></div>
            {projection.stories.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projection.stories.map(story => <HomeStoryCard key={story.slug} story={story} />)}</div> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Story가 없습니다.</div>}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 md:py-10" aria-labelledby="home-explore-heading">
          <div className="mb-4"><div className="flex items-center gap-2"><Info className="h-5 w-5 text-muted-foreground" aria-hidden="true" /><h2 id="home-explore-heading" className="text-xl font-bold">Explore</h2></div><p className="mt-1 text-sm text-muted-foreground">나머지 공간과 운영 정보로 이동합니다.</p></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><HomeExploreLink href="/search" title="Search" description="전체 Asset과 기록 찾기" icon={Search} /><HomeExploreLink href="/demos" title="Showcase" description="실행·재생 가능한 결과물" icon={Play} /><HomeExploreLink href="/about" title="About DevSnack" description="이 공간을 운영하는 방식" icon={Info} /><HomeExploreLink href="/tools/operations" title="Operations" description="운영 중인 시스템 현황" icon={Terminal} /></div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-7"><div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground"><span>Powered by Next.js, Supabase &amp; Vercel</span><Link href="/privacy" className="no-underline hover:text-foreground">개인정보처리방침</Link><Link href="/rss.xml" className="no-underline hover:text-foreground">RSS</Link><a href="https://www.youtube.com/@DevsnackAILab" target="_blank" rel="noopener noreferrer" className="no-underline hover:text-foreground">YouTube</a></div></div>
      </footer>
    </div>
  )
}
