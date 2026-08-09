import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MarkdownRenderer } from '@/components/markdown-renderer'

export const revalidate = 60
export const dynamicParams = true

type ResearchStatus = '조사완료' | '적용대기' | '적용중' | '적용완료' | '보류'

const STATUS_META: Record<ResearchStatus, { emoji: string; label: string; badge: string }> = {
  '조사완료': { emoji: '🔍', label: '조사 완료', badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  '적용대기': { emoji: '⏳', label: '적용 대기', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  '적용중':   { emoji: '🔄', label: '적용 중',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
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

export default async function ResearchPostPage({ params }: { params: { id: string } }) {
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', params.id)
    .eq('status', 'live')
    .eq('blog_id', 'research')
    .single()

  if (!post) notFound()

  const labels = (post.labels || []) as string[]
  const status = (labels.find(l => STATUS_META[l as ResearchStatus]) || '조사완료') as ResearchStatus
  const category = labels.find(l => CATEGORY_LABEL[l]) || 'hardware'
  const meta = STATUS_META[status]
  const readingTime = Math.max(1, Math.ceil((post.content?.length || 0) / 2000))

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/research" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground no-underline mb-6">
          <ArrowLeft className="w-4 h-4" />
          Research 목록으로
        </Link>

        <article>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-4">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-muted-foreground">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${meta.badge}`}>
              {meta.emoji} {meta.label}
            </span>
            {category && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                {CATEGORY_LABEL[category]}
              </span>
            )}
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

          {/* 공개 링크 (있을 경우) */}
          {(post.seo_desc || post.cover_image) && (
            <div className="mt-8 p-4 border border-border rounded-xl bg-muted/30">
              <h2 className="text-sm font-semibold mb-2 text-muted-foreground">관련 자료</h2>
              {post.cover_image && (
                <a
                  href={post.cover_image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 no-underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  원문 링크
                </a>
              )}
            </div>
          )}
        </article>
      </div>
    </div>
  )
}
