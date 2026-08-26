import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { BlogHeader } from '@/components/blog-header'
import { BlogSidebar } from '@/components/blog-sidebar'
import { Pagination } from '@/components/pagination'
import { buildRouteMetadata } from '@/lib/seo/metadata'
import { isPostPrimaryType } from '@/lib/ia'

export const metadata = buildRouteMetadata({
  title: 'Stories — DevSnack',
  description: '사람이 읽는 경험·해석·기술 칼럼을 모은 DevSnack Stories',
  canonicalPath: '/devsnack',
})

export const revalidate = 60

const PAGE_SIZE = 24
type PostSummary = {
  slug: string
  title: string
  excerpt: string | null
  labels: string[] | null
  published: string | null
  cover_image: string | null
  blog_id: 'devsnack'
  status: 'live'
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
    .select('slug, title, excerpt, labels, published, cover_image, blog_id, status')
    .eq('status', 'live')
    .eq('blog_id', 'devsnack')

  if (tag) query = query.contains('labels', [tag])
  const range = getMonthRange(month)
  if (range) query = query.gte('published', range.start).lt('published', range.end)

  const { data } = await query.order('published', { ascending: false }).limit(1000)
  const stories = (data ?? []).filter(post => isPostPrimaryType(post, 'story')) as PostSummary[]
  const from = (page - 1) * PAGE_SIZE
  return { posts: stories.slice(from, from + PAGE_SIZE), count: stories.length }
}

async function getSidebarPosts(): Promise<SidebarPost[]> {
  const { data } = await supabase
    .from('posts')
    .select('slug, title, labels, published, blog_id, status')
    .eq('status', 'live')
    .eq('blog_id', 'devsnack')
    .order('published', { ascending: false })
    .limit(1000)
  return ((data ?? []).filter(post => isPostPrimaryType(post, 'story'))) as SidebarPost[]
}

export default async function Home({
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
      <BlogHeader title="DevSnack Stories" subtitle="개발자의 시선으로 보는 AI" icon="terminal" color="blue" />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            <div className="mb-8">
              <h2 className="text-2xl font-bold">
                {sp.tag ? `#${sp.tag}` : sp.month ? `${sp.month.slice(0, 4)}년 ${sp.month.slice(5)}월` : '최신 글'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">전체 {count}개 · {page}/{totalPages}페이지</p>
            </div>

            {posts.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">게시물이 없습니다.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {posts.map(post => (
                  <Link key={post.slug} href={`/devsnack/${post.slug}`} className="group no-underline">
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
                  </Link>
                ))}
              </div>
            )}
            <Pagination page={page} totalPages={totalPages} searchParams={{ tag: sp.tag, month: sp.month }} />
          </div>

          <div className="hidden lg:block w-72 shrink-0">
            <BlogSidebar posts={sidebarPosts} blogPath="devsnack" />
          </div>
        </div>
      </main>
    </div>
  )
}
