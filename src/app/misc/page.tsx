import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { classifyJunk, JUNK_STATUS_META } from '@/lib/content-taxonomy'
import { buildRouteMetadata } from '@/lib/seo/metadata'

export const metadata = buildRouteMetadata({
  title: 'Junk Drawer — DevSnack',
  description: '현재 운영·보관 중인 기타 기술 기록과 도구 목록',
  canonicalPath: '/misc',
})

export const revalidate = 60

interface JunkPost {
  slug: string
  title: string
  excerpt: string
  labels: string[]
  published: string
}

async function getJunkPosts() {
  const { data } = await supabase
    .from('posts')
    .select('slug, title, excerpt, labels, published')
    .eq('blog_id', 'misc')
    .eq('status', 'live')
    .order('published', { ascending: false })
  return (data || []) as JunkPost[]
}

function extractStatus(post: JunkPost) {
  return classifyJunk(post.labels).status
}

export default async function JunkPage() {
  const posts = await getJunkPosts()

  // 상태별 카운트
  const statusCounts = new Map<string, number>()
  for (const post of posts) {
    const status = extractStatus(post)
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 페이지 타이틀 */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">🧰 Junk Drawer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            어디에도 안 맞는 잡동사니 — 지금 갖고 노는 것들
          </p>
        </div>

        {/* 상태 요약 */}
        <div className="flex flex-wrap gap-2 mb-8">
          {Object.entries(JUNK_STATUS_META).map(([key, meta]) => (
            <span key={key} className={`px-3 py-1.5 rounded-full text-xs font-medium ${meta.badge}`}>
              {meta.emoji} {meta.label}
              {statusCounts.get(key) ? <span className="ml-1 opacity-70">({statusCounts.get(key)})</span> : null}
            </span>
          ))}
          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            총 {posts.length}건
          </span>
        </div>

        {/* 목록 */}
        <div className="grid gap-3 sm:grid-cols-2">
          {posts.map(post => {
            const status = extractStatus(post)
            const meta = JUNK_STATUS_META[status]
            return (
              <Link
                key={post.slug}
                href={`/misc/${post.slug}`}
                className="group border border-border rounded-xl p-4 bg-white dark:bg-gray-900 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all no-underline"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {new Date(post.published).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 ${meta.badge}`}>
                    {meta.emoji} {meta.label}
                  </span>
                </div>
                <h3 className="font-bold text-sm leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{post.excerpt}</p>
                )}
              </Link>
            )
          })}
        </div>

        {posts.length === 0 && (
          <div className="border border-dashed border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
            아직 등록된 잡동사니가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}
