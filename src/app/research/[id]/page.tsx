import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MarkdownRenderer } from '@/components/markdown-renderer'

export const revalidate = 60
export const dynamicParams = true

import {
  classifyResearch,
  RESEARCH_CATEGORY_LABEL,
  RESEARCH_STATUS_META,
} from '@/lib/content-taxonomy'

export default async function ResearchPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', id)
    .eq('status', 'live')
    .eq('blog_id', 'research')
    .single()

  if (!post) notFound()

  const { status, category } = classifyResearch((post.labels || []) as string[])
  const meta = RESEARCH_STATUS_META[status]
  const readingTime = Math.max(1, Math.ceil((post.content?.length || 0) / 2000))

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/research" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground no-underline mb-6">
          <ArrowLeft className="w-4 h-4" />
          Research 목록으로
        </Link>

        <article className="content-article min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-4">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-muted-foreground">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${meta.badge}`}>
              {meta.emoji} {meta.label}
            </span>
            {category && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                {RESEARCH_CATEGORY_LABEL[category]}
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
