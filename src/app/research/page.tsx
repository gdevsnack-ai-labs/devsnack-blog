import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const revalidate = 60

type ResearchStatus = '조사완료' | '적용대기' | '진행중' | '적용완료' | '보류'

const STATUS_META: Record<ResearchStatus, { emoji: string; label: string; badge: string }> = {
  '조사완료': { emoji: '🔍', label: '조사 완료', badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  '적용대기': { emoji: '⏳', label: '적용 대기', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  '진행중':   { emoji: '🔄', label: '진행 중',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  '적용완료': { emoji: '✅', label: '적용 완료', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  '보류':     { emoji: '📦', label: '보류',     badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const CATEGORY_LABEL: Record<string, string> = {
  'llm': '🤖 LLM / 모델',
  'tts': '🎙️ TTS 엔진',
  'media': '🎨 이미지 · 영상 · 음악',
  'benchmark': '📊 벤치마크 · 도구',
  'hardware': '🖥️ 하드웨어 · 기타',
}

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
  const labels = post.labels || []
  const status = (labels.find(l => STATUS_META[l as ResearchStatus]) || '조사완료') as ResearchStatus
  const category = labels.find(l => CATEGORY_LABEL[l]) || 'hardware'
  return { status, category }
}

export default async function ResearchPage() {
  const posts = await getResearchPosts()
  const byCategory = new Map<string, ResearchPost[]>()
  for (const post of posts) {
    const { category } = extractMeta(post)
    const list = byCategory.get(category) || []
    list.push(post)
    byCategory.set(category, list)
  }

  // 필터: 상태별 카운트
  const statusCounts = new Map<string, number>()
  for (const post of posts) {
    const { status } = extractMeta(post)
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 페이지 타이틀 */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">🔬 Research Backlog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            조사는 끝냈지만 아직 적용하지 못한 기술들 — 상태를 추적합니다
          </p>
        </div>

        {/* 상태 요약 */}
        <div className="flex flex-wrap gap-2 mb-8">
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <span key={key} className={`px-3 py-1.5 rounded-full text-xs font-medium ${meta.badge}`}>
              {meta.emoji} {meta.label}
              {statusCounts.get(key) ? <span className="ml-1 opacity-70">({statusCounts.get(key)})</span> : null}
            </span>
          ))}
          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            총 {posts.length}건
          </span>
        </div>

        {/* 카테고리별 그룹 */}
        {Array.from(byCategory.entries()).map(([category, items]) => (
          <section key={category} className="mb-10">
            <h2 className="text-xl font-bold mb-1">{CATEGORY_LABEL[category] || category}</h2>
            <p className="text-xs text-muted-foreground mb-4">{items.length}건</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map(post => {
                const { status } = extractMeta(post)
                const meta = STATUS_META[status]
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
        ))}

        {posts.length === 0 && (
          <div className="border border-dashed border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
            아직 등록된 Research 항목이 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}
