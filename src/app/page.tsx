import Link from 'next/link'
import { Terminal, TrendingUp, HomeIcon, Bot, ArrowRight, FileText, Video, Search as SearchIcon, FlaskConical, Play } from 'lucide-react'
import { BlogHeader } from '@/components/blog-header'
import { BlogCard } from '@/components/blog-card'
import { TagChip } from '@/components/tag-chip'
import { LatestPostCard } from '@/components/latest-post-card'
import { LatestVideoCard } from '@/components/latest-video-card'
import { ExperimentStrip } from '@/components/experiment-strip'
import { SubscribeCta } from '@/components/subscribe-cta'
import { supabase, type Post } from '@/lib/supabase'
import type { BlogId } from '@/lib/colors'

export const revalidate = 60 // 1분 ISR

interface LatestPost {
  slug: string
  blogId: BlogId
  title: string
  publishedAt: string
  thumbnail: string | null
}

function formatDate(d: string | null): string {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return ''
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`
}

async function getLatestPosts(limit = 3): Promise<LatestPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('slug, blog_id, title, published, cover_image')
    .eq('status', 'live')
    .order('published', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return (data as Pick<Post, 'slug' | 'blog_id' | 'title' | 'published' | 'cover_image'>[]).map((p) => ({
    slug: p.slug,
    blogId: p.blog_id as BlogId,
    title: p.title,
    publishedAt: formatDate(p.published),
    thumbnail: p.cover_image,
  }))
}

const BLOGS = [
  { id: 'devsnack'   as const, href: '/devsnack',   title: 'DevSnack',       subtitle: '개발/기술',     desc: 'NVIDIA DGX Spark 기반 AI 인프라 실험, LLM 벤치마크, 오픈소스 모델 분석.', icon: Terminal },
  { id: 'stockpulse' as const, href: '/stock',      title: 'StockPulse',     subtitle: '주식 시장',     desc: 'AI가 분석하는 KOSPI/KOSDAQ 일일 리포트.',                                  icon: TrendingUp },
  { id: 'realestate' as const, href: '/realestate', title: '부동산', subtitle: '데이터 도구',   desc: 'AI가 분석하는 아파트 실거래가 동향과 지역별 추세.',                        icon: HomeIcon, ctaLabel: '도구 열기' },
  { id: 'aitech'     as const, href: '/aitech',     title: 'AI Tech Insight', subtitle: 'AI 뉴스',      desc: 'AI 기술, 산업 동향, 연구 결과를 분석합니다.',                              icon: Bot },
]

const START_POINTS = [
  { href: '/search', title: '읽을 콘텐츠 찾기', description: '블로그·Lab·Research·Tools 전체를 한 번에 검색합니다.', icon: SearchIcon, iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconText: 'text-blue-600 dark:text-blue-400' },
  { href: '/lab', title: '진행 중인 실험 보기', description: '현재 진행 중인 실험과 다음 목표를 확인합니다.', icon: FlaskConical, iconBg: 'bg-green-100 dark:bg-green-900/30', iconText: 'text-green-600 dark:text-green-400' },
  { href: '/demos', title: '결과물 직접 실행하기', description: '로컬 AI로 만든 HTML·영상·음악·이미지 데모를 실행합니다.', icon: Play, iconBg: 'bg-purple-100 dark:bg-purple-900/30', iconText: 'text-purple-600 dark:text-purple-400' },
]

export default async function Home() {
  const latestPosts = await getLatestPosts(8)
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BlogHeader title="DevSnack Blog" subtitle="개발자의 시선으로 보는 AI" icon="terminal" color="blue" />

      <main className="flex-1">
        {/* 히어로 */}
        <section className="bg-gradient-to-b from-background to-muted/30">
          <div className="max-w-4xl mx-auto px-4 py-16 md:py-20 text-center">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-4">
              AI를 직접 실험하고<br className="md:hidden" /> 검증한 결과를 기록합니다.
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              로컬 LLM부터 자동화, 벤치마크, 투자 분석까지<br className="hidden md:block" />
              퇴근 후 AI를 연구하는 개발자의 실험실입니다.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <TagChip tag="local-llm" />
              <TagChip tag="experiments" />
              <TagChip tag="automation" />
              <TagChip tag="data" />
            </div>
          </div>
        </section>

        {/* Start here */}
        <section className="max-w-6xl mx-auto px-4 py-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold">어디서 시작할까요?</h2>
            <p className="text-sm text-muted-foreground mt-1">읽기·실험·실행 중 원하는 경로로 바로 들어가세요.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {START_POINTS.map(point => {
              const Icon = point.icon
              return (
                <Link key={point.href} href={point.href} className="group flex items-start gap-3 rounded-xl border border-border bg-white dark:bg-gray-900 p-4 no-underline hover:shadow-md transition-shadow">
                  <span className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${point.iconBg}`}>
                    <Icon className={`w-5 h-5 ${point.iconText}`} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 font-semibold text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {point.title}<ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">{point.description}</span>
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* 블로그 카드 4개 */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BLOGS.map((b) => (
              <BlogCard
                key={b.id}
                id={b.id}
                href={b.href}
                title={b.title}
                subtitle={b.subtitle}
                description={b.desc}
                icon={b.icon}
                ctaLabel={b.ctaLabel}
              />
            ))}
          </div>
        </section>

        {/* 3-칼럼: 최신 글 / 최신 영상 / 현재 진행 중 */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 좌: 최신 글 */}
            <div className="border border-border rounded-xl p-5 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  최신 글
                </h3>
                <Link href="/search" className="text-xs text-blue-600 dark:text-blue-400 hover:underline no-underline">
                  전체 콘텐츠 →
                </Link>
              </div>
              {latestPosts.length > 0 ? (
                <div className="space-y-2">
                  {latestPosts.map((p) => (
                    <LatestPostCard
                      key={`${p.blogId}-${p.slug}`}
                      slug={p.slug}
                      blogId={p.blogId}
                      title={p.title}
                      publishedAt={p.publishedAt}
                      thumbnail={p.thumbnail}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">아직 글이 없습니다.</p>
              )}
            </div>

            {/* 우: 최신 영상 */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  최신 영상
                </h3>
                <a
                  href="https://www.youtube.com/@DevsnackAILab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-red-600 dark:text-red-400 hover:underline no-underline"
                >
                  채널 보기 →
                </a>
              </div>
              <LatestVideoCard />
            </div>
          </div>
        </section>

        {/* 진행 중 실험 5개 */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
              진행 중인 실험
            </h3>
            <Link href="/lab" className="text-xs text-blue-600 dark:text-blue-400 hover:underline no-underline">
              모든 실험 보기 →
            </Link>
          </div>
          <ExperimentStrip />
        </section>

        {/* 구독 CTA */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          <SubscribeCta />
        </section>
      </main>

      <footer className="border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Powered by Next.js, Supabase &amp; Vercel</p>
            <p className="text-xs">
              <Link href="/privacy" className="hover:underline no-underline">개인정보처리방침</Link>
              <span className="mx-2">·</span>
              <Link href="/rss.xml" className="hover:underline no-underline">RSS</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
