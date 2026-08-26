'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'
import { BlogHeader } from '@/components/blog-header'
import { BlogSidebar } from '@/components/blog-sidebar'
import { Pagination } from '@/components/pagination'
import { isPostPrimaryType } from '@/lib/ia'
import devsnackSnapshot from '@/data/devsnack-snapshot.json'
import { AitechV1ArchivePage } from '@/components/aitech-v1-archive-page'

type FeedKind = 'aitech' | 'devsnack'
type FeedPost = {
  slug: string
  title: string
  excerpt: string | null
  labels: string[] | null
  published: string | null
  cover_image: string | null
  blog_id?: string
  status?: string
}
type SidebarPost = Pick<FeedPost, 'slug' | 'title' | 'labels' | 'published'>

const PAGE_SIZE = 24
const DEVSNACK_POSTS = devsnackSnapshot.posts as FeedPost[]

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

function sourcePosts(kind: FeedKind): FeedPost[] {
  return kind === 'devsnack' ? DEVSNACK_POSTS : []
}

function asStoryPost(post: FeedPost) {
  return {
    slug: post.slug,
    title: post.title,
    blog_id: post.blog_id || 'devsnack',
    status: post.status || 'live',
    labels: post.labels,
  }
}

function getPosts(kind: FeedKind, page: number, tag?: string, month?: string) {
  let filtered = sourcePosts(kind)
  if (tag) filtered = filtered.filter(post => post.labels?.includes(tag))
  const range = getMonthRange(month)
  if (range) {
    filtered = filtered.filter(post => {
      if (!post.published) return false
      return post.published >= range.start && post.published < range.end
    })
  }
  // Keep the existing IA classification rule: only Story assets belong here.
  if (kind === 'devsnack') filtered = filtered.filter(post => isPostPrimaryType(asStoryPost(post), 'story'))
  const from = (page - 1) * PAGE_SIZE
  return { posts: filtered.slice(from, from + PAGE_SIZE), count: filtered.length }
}

function getSidebarPosts(kind: FeedKind): SidebarPost[] {
  const posts = sourcePosts(kind)
  return (kind === 'devsnack' ? posts.filter(post => isPostPrimaryType(asStoryPost(post), 'story')) : []) as SidebarPost[]
}

function FeedPageView({ kind, page, tag, month }: { kind: FeedKind; page: number; tag?: string; month?: string }) {
  const isAI = kind === 'aitech'
  const { posts, count } = getPosts(kind, page, tag, month)
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const sidebarPosts = getSidebarPosts(kind)
  const blogPath = isAI ? 'aitech' : 'devsnack'
  const title = isAI ? 'AI Tech Insight' : 'DevSnack Stories'
  const subtitle = isAI ? 'AI 기술과 산업 동향, 데이터로 읽는 인사이트' : '개발자의 시선으로 보는 AI'
  const icon = isAI ? 'aitech' as const : 'terminal' as const
  const color = isAI ? 'purple' as const : 'blue' as const
  const defaultHeading = isAI ? '최신 AI 소식' : '최신 글'

  return (
    <div className="min-h-screen">
      <BlogHeader title={title} subtitle={subtitle} icon={icon} color={color} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">
                {tag ? `#${tag}` : month ? `${month.slice(0, 4)}년 ${month.slice(5)}월` : defaultHeading}
              </h2>
              <p className="text-sm text-muted-foreground">전체 {count}개 · {page}/{totalPages}페이지</p>
            </div>

            {posts.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">게시물이 없습니다.</p>
            ) : (
              <div className={isAI ? 'grid gap-6' : 'grid gap-6 md:grid-cols-2 lg:grid-cols-2'}>
                {posts.map(post => (
                  <Link key={post.slug} href={`/${blogPath}/${post.slug}`} className="group no-underline">
                    {isAI ? (
                      <article className="flex gap-4 p-4 rounded-xl border bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
                        {post.cover_image && (
                          <div className="hidden sm:block w-32 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">{post.title}</h3>
                          {post.excerpt && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            {post.published && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.published).toLocaleDateString('ko-KR')}</span>}
                            {post.labels && post.labels.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {post.labels.slice(0, 3).map(label => <Badge key={label} variant="secondary" className="text-[10px] px-1.5 py-0">{label}</Badge>)}
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    ) : (
                      <article className="h-full rounded-xl border bg-white dark:bg-gray-900 overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col">
                        {post.cover_image && (
                          <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                          </div>
                        )}
                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="font-semibold line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{post.title}</h3>
                          {post.excerpt && <p className="text-sm text-muted-foreground mt-1 line-clamp-2 flex-1">{post.excerpt}</p>}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            {post.published && <span>{new Date(post.published).toLocaleDateString('ko-KR')}</span>}
                            {post.labels?.slice(0, 2).map(label => <Badge key={label} variant="secondary" className="text-[10px] px-1.5 py-0">{label}</Badge>)}
                          </div>
                        </div>
                      </article>
                    )}
                  </Link>
                ))}
              </div>
            )}
            <Pagination page={page} totalPages={totalPages} searchParams={{ tag, month }} />
          </div>

          <div className="hidden lg:block w-72 shrink-0">
            <BlogSidebar posts={sidebarPosts} blogPath={blogPath} />
          </div>
        </div>
      </main>
    </div>
  )
}

function FeedPageQueryView({ kind }: { kind: FeedKind }) {
  const searchParams = useSearchParams()
  return (
    <FeedPageView
      kind={kind}
      page={getPage(searchParams.get('page'))}
      tag={searchParams.get('tag') || undefined}
      month={searchParams.get('month') || undefined}
    />
  )
}

export function StaticFeedPage({ kind }: { kind: FeedKind }) {
  if (kind === 'aitech') return <AitechV1ArchivePage />

  return (
    <Suspense fallback={<FeedPageView kind={kind} page={1} />}>
      <FeedPageQueryView kind={kind} />
    </Suspense>
  )
}
