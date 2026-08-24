import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const revalidate = 60

import {
  RESEARCH_CATEGORIES,
  RESEARCH_CATEGORY_LABEL,
  RESEARCH_STATUS_META,
  classifyResearch,
} from '@/lib/content-taxonomy'

export { RESEARCH_CATEGORIES }

interface ResearchPost {
  slug: string
  title: string
  excerpt: string
  labels: string[]
  published: string
}

async function getResearchPosts() {
  const { data } = await supabase
    .from('posts')
    .select('slug, title, excerpt, labels, published')
    .eq('blog_id', 'research')
    .eq('status', 'live')
    .order('published', { ascending: false })
  return (data || []) as ResearchPost[]
}

function extractMeta(post: ResearchPost) {
  return classifyResearch(post.labels)
}

/** 카테고리 탭 — 전체 + 세부 카테고리 (클릭 시 해당 카테고리만 보이는 경로로 이동) */
function CategoryTabs({ active, counts }: { active: string | null; counts: Record<string, number> }) {
  const tabClass = (isActive: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-medium border no-underline transition-colors ${
      isActive
        ? 'bg-purple-600 text-white border-purple-600'
        : 'bg-transparent text-muted-foreground border-border hover:border-purple-400 hover:text-purple-600'
    }`

  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/research" className={tabClass(active === null)}>
        전체 <span className="opacity-70">({counts.all})</span>
      </Link>
      {RESEARCH_CATEGORIES.map(cat => (
        <Link key={cat} href={`/research/category/${cat}`} className={tabClass(active === cat)}>
          {RESEARCH_CATEGORY_LABEL[cat as keyof typeof RESEARCH_CATEGORY_LABEL].split(' ')[0]} <span className="opacity-70">({counts[cat] ?? 0})</span>
        </Link>
      ))}
    </div>
  )
}

export async function ResearchList({ category }: { category: string | null }) {
  const posts = await getResearchPosts()

  const byCategory = new Map<string, ResearchPost[]>()
  for (const post of posts) {
    const { category: c } = extractMeta(post)
    const list = byCategory.get(c) || []
    list.push(post)
    byCategory.set(c, list)
  }

  // 카테고리별 카운트
  const catCounts: Record<string, number> = { all: posts.length }
  for (const cat of RESEARCH_CATEGORIES) {
    catCounts[cat] = posts.filter(p => extractMeta(p).category === cat).length
  }

  // 상태별 카운트
  const statusCounts = new Map<string, number>()
  for (const post of posts) {
    const { status } = extractMeta(post)
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1)
  }

  // 표시 대상: 전체 또는 특정 카테고리
  const visibleCategories = category
    ? (byCategory.get(category) ? [category] : [])
    : Array.from(byCategory.keys())
  const visiblePosts = category
    ? (byCategory.get(category) || [])
    : posts

  const activeTitle = category ? RESEARCH_CATEGORY_LABEL[category as keyof typeof RESEARCH_CATEGORY_LABEL] || category : null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 페이지 타이틀 */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">📚 Knowledge</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTitle
              ? `${activeTitle} 카테고리 — ${visiblePosts.length}건`
              : '다시 찾아볼 기술 지식을 카테고리와 상태별로 정리합니다'}
          </p>
        </div>

        {/* 카테고리 탭 — 전체/세부 카테고리 */}
        <div className="mb-6">
          <CategoryTabs active={category} counts={catCounts} />
        </div>

        {/* 상태 요약 (전체일 때만) */}
        {!category && (
          <div className="flex flex-wrap gap-2 mb-8">
            {Object.entries(RESEARCH_STATUS_META).map(([key, meta]) => (
              <span key={key} className={`px-3 py-1.5 rounded-full text-xs font-medium ${meta.badge}`}>
                {meta.emoji} {meta.label}
                {statusCounts.get(key) ? <span className="ml-1 opacity-70">({statusCounts.get(key)})</span> : null}
              </span>
            ))}
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              총 {posts.length}건
            </span>
          </div>
        )}

        {/* 카테고리별 그룹 */}
        {visiblePosts.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
            이 카테고리에는 아직 항목이 없습니다.
          </div>
        ) : category ? (
          /* 세부 카테고리: 플랫 리스트 */
          <div className="grid gap-3 sm:grid-cols-2">
            {visiblePosts.map(post => {
              const { status } = extractMeta(post)
              const meta = RESEARCH_STATUS_META[status]
              return (
                <Link
                  key={post.slug}
                  href={`/research/${post.slug}`}
                  className="group border border-border rounded-xl p-4 bg-white dark:bg-gray-900 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all no-underline"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {new Date(post.published).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 ${meta.badge}`}>
                      {meta.emoji} {meta.label}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{post.excerpt}</p>
                  )}
                </Link>
              )
            })}
          </div>
        ) : (
          /* 전체: 카테고리별 그룹 */
          visibleCategories.map(cat => (
            <section key={cat} className="mb-10">
              <h2 className="text-xl font-bold mb-1">
                <Link href={`/research/category/${cat}`} className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  {RESEARCH_CATEGORY_LABEL[cat as keyof typeof RESEARCH_CATEGORY_LABEL] || cat}
                </Link>
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                {byCategory.get(cat)?.length ?? 0}건 · <Link href={`/research/category/${cat}`} className="hover:underline">카테고리만 보기 →</Link>
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {byCategory.get(cat)!.map(post => {
                  const { status } = extractMeta(post)
                  const meta = RESEARCH_STATUS_META[status]
                  return (
                    <Link
                      key={post.slug}
                      href={`/research/${post.slug}`}
                      className="group border border-border rounded-xl p-4 bg-white dark:bg-gray-900 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all no-underline"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {new Date(post.published).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 ${meta.badge}`}>
                          {meta.emoji} {meta.label}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{post.excerpt}</p>
                      )}
                    </Link>
                  )
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}