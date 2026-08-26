'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { TrendingUp } from 'lucide-react'
import { BlogHeader } from '@/components/blog-header'
import { BlogSidebar } from '@/components/blog-sidebar'
import { StockPulsePredictionWidget } from '@/components/stock-pulse-prediction-widget'
import { Pagination } from '@/components/pagination'
import stockpulseSnapshot from '@/data/stockpulse-snapshot.json'

type PostSummary = {
  slug: string
  title: string
  excerpt: string | null
  labels: string[] | null
  published: string | null
}

type SidebarPost = Pick<PostSummary, 'slug' | 'title' | 'labels' | 'published'>

const PAGE_SIZE = 24
const allPosts = stockpulseSnapshot.posts as PostSummary[]
const sidebarPosts = stockpulseSnapshot.posts as SidebarPost[]

function getPage(value: string | null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
}

function getMonthRange(month?: string) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return null
  const [year, monthNumber] = month.split('-').map(Number)
  if (monthNumber < 1 || monthNumber > 12) return null
  const next = monthNumber === 12 ? `${year + 1}-01` : `${year}-${String(monthNumber + 1).padStart(2, '0')}`
  return { start: `${month}-01`, end: `${next}-01` }
}

function getPosts(page: number, tag?: string, month?: string) {
  let filtered = allPosts
  if (tag) filtered = filtered.filter(post => post.labels?.includes(tag))
  const range = getMonthRange(month)
  if (range) {
    filtered = filtered.filter(post => {
      if (!post.published) return false
      return post.published >= range.start && post.published < range.end
    })
  }
  const from = (page - 1) * PAGE_SIZE
  return { posts: filtered.slice(from, from + PAGE_SIZE), count: filtered.length }
}

function StockPageView({ page, tag, month }: { page: number; tag?: string; month?: string }) {
  const { posts, count } = getPosts(page, tag, month)
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <div className="min-h-screen">
      <BlogHeader title="StockPulse AI Lab" subtitle="AI가 분석하는 주식 시장 — KOSPI/KOSDAQ" icon="trending" color="green" />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <StockPulsePredictionWidget />
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            <div className="mb-8">
              <h2 className="text-2xl font-bold">
                {tag ? `#${tag}` : month ? `${month.slice(0, 4)}년 ${month.slice(5)}월` : '최신 리포트'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">전체 {count}개 · {page}/{totalPages}페이지</p>
            </div>

            {posts.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">게시물이 없습니다.</p>
            ) : (
              <div className="grid gap-4">
                {posts.map(post => (
                  <Link key={post.slug} href={`/stock/${post.slug}`} className="group no-underline">
                    <article className="flex gap-4 p-4 rounded-xl border bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-1">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-2">{post.title}</h3>
                        {post.excerpt && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          {post.published && <span>{new Date(post.published).toLocaleDateString('ko-KR')}</span>}
                          {post.labels?.slice(0, 3).map(label => <Badge key={label} variant="secondary" className="text-[10px] px-1.5 py-0">{label}</Badge>)}
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
            <Pagination page={page} totalPages={totalPages} searchParams={{ tag, month }} />
          </div>

          <div className="hidden lg:block w-72 shrink-0">
            <BlogSidebar posts={sidebarPosts} blogPath="stock" />
          </div>
        </div>
      </main>
    </div>
  )
}

function StockPageQueryView() {
  const searchParams = useSearchParams()
  return (
    <StockPageView
      page={getPage(searchParams.get('page'))}
      tag={searchParams.get('tag') || undefined}
      month={searchParams.get('month') || undefined}
    />
  )
}

export function StockPageClient() {
  // The fallback is also the default feed, so /stock has useful static HTML
  // before hydration and query-string filters take over in the browser.
  return (
    <Suspense fallback={<StockPageView page={1} />}>
      <StockPageQueryView />
    </Suspense>
  )
}
