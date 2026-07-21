import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Calendar, TrendingUp } from 'lucide-react'
import { BlogHeader } from '@/components/blog-header'
import { BlogSidebar } from '@/components/blog-sidebar'
import { StockPulsePredictionWidget } from '@/components/stock-pulse-prediction-widget'

export const revalidate = 60

type PostSummary = {
  slug: string
  title: string
  excerpt: string | null
  labels: string[] | null
  published: string | null
  cover_image: string | null
}

async function getPosts(): Promise<PostSummary[]> {
  const { data } = await supabase
    .from('posts')
    .select('slug, title, excerpt, labels, published, cover_image')
    .eq('status', 'live')
    .eq('blog_id', 'stockpulse')
    .order('published', { ascending: false })
    .limit(50)

  return (data ?? []) as PostSummary[]
}

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; month?: string }>
}) {
  const sp = await searchParams
  let posts = await getPosts()

  if (sp.tag) {
    posts = posts.filter(p => p.labels?.includes(sp.tag!))
  }
  if (sp.month) {
    posts = posts.filter(p => p.published?.startsWith(sp.month!))
  }

  return (
    <div className="min-h-screen">
      <BlogHeader title="StockPulse AI Lab" subtitle="AI가 분석하는 주식 시장 — KOSPI/KOSDAQ" icon="trending" color="green" />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <StockPulsePredictionWidget />
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            <div className="mb-8">
              <h2 className="text-2xl font-bold">
                {sp.tag ? `#${sp.tag}` : sp.month ? `${sp.month.slice(0, 4)}년 ${sp.month.slice(5)}월` : '최신 리포트'}
              </h2>
              {sp.tag && <p className="text-sm text-muted-foreground">{posts.length}개의 글</p>}
            </div>

            {posts.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">게시물이 없습니다.</p>
            ) : (
              <div className="grid gap-4">
                {posts.map((post) => (
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
                          {post.labels?.slice(0, 3).map(l => <Badge key={l} variant="secondary" className="text-[10px] px-1.5 py-0">{l}</Badge>)}
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:block w-72 shrink-0">
            <BlogSidebar posts={posts} blogPath="stock" />
          </div>
        </div>
      </main>
    </div>
  )
}
