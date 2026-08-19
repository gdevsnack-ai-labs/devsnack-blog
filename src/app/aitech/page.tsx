import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'
import { BlogHeader } from '@/components/blog-header'
import { BlogSidebar } from '@/components/blog-sidebar'
import { Pagination } from '@/components/pagination'

export const revalidate = 60

const PAGE_SIZE = 24

type PostSummary = {
  slug: string
  title: string
  excerpt: string | null
  labels: string[] | null
  published: string | null
  cover_image: string | null
}
type SidebarPost = Pick<PostSummary, 'slug' | 'title' | 'labels' | 'published'>

function getPage(value?: string) {
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

async function getPosts(page: number, tag?: string, month?: string) {
  let query = supabase
    .from('posts')
    .select('slug, title, excerpt, labels, published, cover_image', { count: 'exact' })
    .eq('blog_id', 'aitech')
    .eq('status', 'live')

  if (tag) query = query.contains('labels', [tag])
  const range = getMonthRange(month)
  if (range) query = query.gte('published', range.start).lt('published', range.end)

  const from = (page - 1) * PAGE_SIZE
  const { data, count } = await query.order('published', { ascending: false }).range(from, from + PAGE_SIZE - 1)
  return { posts: (data ?? []) as PostSummary[], count: count ?? 0 }
}

async function getSidebarPosts(): Promise<SidebarPost[]> {
  const { data } = await supabase
    .from('posts')
    .select('slug, title, labels, published')
    .eq('status', 'live')
    .eq('blog_id', 'aitech')
    .order('published', { ascending: false })
    .limit(1000)
  return (data ?? []) as SidebarPost[]
}

export default async function AItechPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; month?: string; page?: string }>
}) {
  const sp = await searchParams
  const page = getPage(sp.page)
  const [{ posts, count }, sidebarPosts] = await Promise.all([
    getPosts(page, sp.tag, sp.month),
    getSidebarPosts(),
  ])
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <div className="min-h-screen">
      <BlogHeader title="AI Tech Insight" subtitle="AI 기술과 산업 동향, 데이터로 읽는 인사이트" icon="aitech" color="purple" />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">
                {sp.tag ? `#${sp.tag}` : sp.month ? `${sp.month.slice(0, 4)}년 ${sp.month.slice(5)}월` : '최신 AI 소식'}
              </h2>
              <p className="text-sm text-muted-foreground">전체 {count}개 · {page}/{totalPages}페이지</p>
            </div>

            {posts.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">게시물이 없습니다.</p>
            ) : (
              <div className="grid gap-6">
                {posts.map(post => (
                  <Link key={post.slug} href={`/aitech/${post.slug}`} className="group block no-underline">
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
                  </Link>
                ))}
              </div>
            )}
            <Pagination page={page} totalPages={totalPages} searchParams={{ tag: sp.tag, month: sp.month }} />
          </div>

          <div className="hidden lg:block w-72 shrink-0">
            <BlogSidebar posts={sidebarPosts} blogPath="aitech" />
          </div>
        </div>
      </main>
    </div>
  )
}
