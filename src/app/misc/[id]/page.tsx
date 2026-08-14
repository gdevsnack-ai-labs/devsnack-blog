import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MarkdownRenderer } from '@/components/markdown-renderer'

export const revalidate = 60
export const dynamicParams = true

type JunkStatus = '운영중' | '대기중' | '보관' | '완료' | '폐기'

const STATUS_META: Record<JunkStatus, { emoji: string; label: string; badge: string }> = {
  '운영중': { emoji: '🔧', label: '운영 중', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  '대기중': { emoji: '⏸️', label: '대기 중', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  '보관':   { emoji: '📦', label: '보관',    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  '완료':   { emoji: '✅', label: '완료',    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  '폐기':   { emoji: '🗑️', label: '폐기',    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export default async function JunkPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', id)
    .eq('status', 'live')
    .eq('blog_id', 'misc')
    .single()

  if (!post) notFound()

  const labels = (post.labels || []) as string[]
  const status = (labels.find(l => STATUS_META[l as JunkStatus]) || '운영중') as JunkStatus
  const meta = STATUS_META[status]
  const readingTime = Math.max(1, Math.ceil((post.content?.length || 0) / 2000))

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/misc" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground no-underline mb-6">
          <ArrowLeft className="w-4 h-4" />
          Junk Drawer 목록으로
        </Link>

        <article>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-4">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-muted-foreground">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${meta.badge}`}>
              {meta.emoji} {meta.label}
            </span>
            {post.published && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(post.published).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              약 {readingTime}분
            </span>
          </div>

          {/* 본문 — 마크다운 렌더링 */}
          <MarkdownRenderer content={post.content || ''} />
        </article>
      </div>
    </div>
  )
}
