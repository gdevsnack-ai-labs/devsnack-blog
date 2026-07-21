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
  const { data } = await supabase
    .from('posts')
    .select('slug, title, excerpt, labels, published, cover_image')
    .eq('status', 'live')
    .eq('blog_id', 'devsnack')
    .order('published', { ascending: false })
    .limit(50)

  return (data ?? []) as PostSummary[]
}

export default async function Home({
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
      <BlogHeader title="DevSnack Blog" subtitle="개발자의 시선으로 보는 AI" icon="terminal" color="blue" />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            <div className="mb-8">
              <h2 className="text-2xl font-bold">
                {sp.tag ? `#${sp.tag}` : sp.month ? `${sp.month.slice(0, 4)}년 ${sp.month.slice(5)}월` : '최신 글'}
              </h2>
              {sp.tag && <p className="text-sm text-muted-foreground">{posts.length}개의 글</p>}
            </div>

            {posts.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">게시물이 없습니다.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {posts.map((post) => (
                  <Link key={post.slug} href={`/devsnack/${post.slug}`} className="group no-underline">
                    <article className="h-full rounded-xl border bg-white dark:bg-gray-900 overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col">
                      {post.cover_image && (
                        <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        </div>
                      )}
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-semibold line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{post.title}</h3>
                        {post.excerpt && <p className="text-sm text-muted-foreground mt-1 line-clamp-2 flex-1">{post.excerpt}</p>}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          {post.published && <span>{new Date(post.published).toLocaleDateString('ko-KR')}</span>}
                          {post.labels?.slice(0, 2).map(l => <Badge key={l} variant="secondary" className="text-[10px] px-1.5 py-0">{l}</Badge>)}
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:block w-72 shrink-0">
            <BlogSidebar posts={posts} blogPath="devsnack" />
          </div>
        </div>
      </main>
    </div>
  )
}
