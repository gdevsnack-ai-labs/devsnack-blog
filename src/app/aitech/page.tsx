import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'
import { BlogHeader } from '@/components/blog-header'
import { BlogSidebar } from '@/components/blog-sidebar'

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
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, title, excerpt, labels, published, cover_image')
    .eq('blog_id', 'aitech')
    .eq('status', 'live')
    .order('published', { ascending: false })
    .limit(50)

  return posts ?? []
}

export default async function AItechPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; month?: string }>
}) {
  const sp = await searchParams
  let posts = await getPosts()

  // Filter by tag
  if (sp.tag) {
    posts = posts.filter(p => p.labels?.includes(sp.tag!))
  }
  // Filter by month
  if (sp.month) {
    posts = posts.filter(p => p.published?.startsWith(sp.month!))
  }

  return (
    <div className="min-h-screen">
      <BlogHeader title="AI Tech Insight" subtitle="AI 기술과 산업 동향, 데이터로 읽는 인사이트" icon="aitech" color="purple" />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* 메인 컨텐츠 */}
          <div className="flex-1 min-w-0">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">
                {sp.tag ? `#${sp.tag}` : sp.month ? `${sp.month.slice(0, 4)}년 ${sp.month.slice(5)}월` : '최신 AI 소식'}
              </h2>
              {sp.tag && <p className="text-sm text-muted-foreground">{posts.length}개의 글</p>}
            </div>

            {posts.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">게시물이 없습니다.</p>
            ) : (
              <div className="grid gap-6">
                {posts.map((post) => (
                  <Link key={post.slug} href={`/aitech/${post.slug}`} className="group block no-underline">
                    <article className="flex gap-4 p-4 rounded-xl border bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
                      {post.cover_image && (
                        <div className="hidden sm:block w-32 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">{post.title}</h3>
                        {post.excerpt && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          {post.published && (
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.published).toLocaleDateString('ko-KR')}</span>
                          )}
                          {post.labels && post.labels.length > 0 && (
                            <div className="flex gap-1">
                              {post.labels.slice(0, 3).map(l => <Badge key={l} variant="secondary" className="text-[10px] px-1.5 py-0">{l}</Badge>)}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 사이드바 */}
          <div className="hidden lg:block w-72 shrink-0">
            <BlogSidebar posts={posts} blogPath="aitech" />
          </div>
        </div>
      </main>
    </div>
  )
}
