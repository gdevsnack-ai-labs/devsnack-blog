import Link from 'next/link'
import { Terminal, TrendingUp, HomeIcon, Bot, ArrowRight, FileText, Video } from 'lucide-react'
import { BlogHeader } from '@/components/blog-header'
import { BlogCard } from '@/components/blog-card'
import { TagChip } from '@/components/tag-chip'
import { ProgressBar } from '@/components/progress-bar'
import { LatestPostCard } from '@/components/latest-post-card'
import { LatestVideoCard } from '@/components/latest-video-card'
import { CurrentExperimentCard } from '@/components/current-experiment-card'
import { ExperimentStrip } from '@/components/experiment-strip'
import { SubscribeCta } from '@/components/subscribe-cta'
import { LabDashboard } from '@/components/lab-dashboard'
import { supabase, type Post } from '@/lib/supabase'
import { getStats } from '@/lib/stats'
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
  { id: 'realestate' as const, href: '/realestate', title: '부동산',          subtitle: '실거래 분석',   desc: 'AI가 분석하는 아파트 실거래가 동향과 지역별 추세.',                        icon: HomeIcon },
  { id: 'aitech'     as const, href: '/aitech',     title: 'AI Tech Insight', subtitle: 'AI 뉴스',      desc: 'AI 기술, 산업 동향, 연구 결과를 분석합니다.',                              icon: Bot },
]

export default async function Home() {
  const latestPosts = await getLatestPosts(3)
  
  const stats = await getStats()

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
              />
            ))}
          </div>
        </section>

        {/* Lab 스탯 */}
        <section className="max-w-6xl mx-auto px-4 py-6">
          <LabDashboard stats={stats} />
          <div className="text-center mt-4">
            <Link href="/lab" className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline no-underline">
              모든 실험 보기 → <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* 3-칼럼: 최신 글 / 최신 영상 / 현재 진행 중 */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* 좌: 최신 글 */}
            <div className="border border-border rounded-xl p-5 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  최신 글
                </h3>
                <Link href="/devsnack" className="text-xs text-blue-600 dark:text-blue-400 hover:underline no-underline">
                  더보기 →
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

            {/* 중앙: 최신 영상 */}
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

            {/* 우: 현재 진행 중 */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                  현재 진행 중
                </h3>
                <span className="text-xs text-muted-foreground">프로젝트 →</span>
              </div>
              <CurrentExperimentCard />
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
