import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { EnglishSourceSwitch } from '@/components/english-source-switch'

export const revalidate = 60
export const dynamicParams = true


import {
  classifyResearch,
  RESEARCH_CATEGORY_LABEL,
  RESEARCH_STATUS_META,
} from '@/lib/content-taxonomy'
import { buildResearchJsonLd, SITE_URL, stripImportedHeadArtifacts } from '@/lib/seo/metadata'

async function getResearchPost(id: string) {
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', id)
    .eq('status', 'live')
    .eq('blog_id', 'research')
    .single()
  return data
}

function getDescription(post: { seo_desc?: string | null; excerpt?: string | null; title: string }) {
  return post.seo_desc || post.excerpt || `${post.title}에 대한 공식 모델 정보, GGUF 양자화 비교와 로컬 벤치마크 실행 계획입니다.`
}

function getKeywords(post: { title: string; labels?: string[] | null }) {
  return Array.from(new Set([
    post.title,
    ...(post.labels || []),
    'AI 모델 리서치',
    'GGUF 양자화',
    '로컬 LLM 벤치마크',
    'llama.cpp',
    'DGX Spark GB10',
  ]))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const post = await getResearchPost(id)
  if (!post) return { title: 'Research Not Found' }

  const description = getDescription(post)
  const keywords = getKeywords(post)
  const canonical = `${SITE_URL}/research/${id}`

  return {
    title: `${post.title} | DevSnack Knowledge`,
    description,
    keywords,
    authors: [{ name: 'DevSnack' }],
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type: 'article',
      locale: 'ko_KR',
      url: canonical,
      title: post.title,
      description,
      siteName: 'DevSnack Blog',
      publishedTime: post.published || undefined,
      modifiedTime: post.updated || undefined,
      section: 'AI 모델 리서치',
      authors: ['DevSnack'],
      images: post.cover_image ? [post.cover_image] : undefined,
    },
    twitter: {
      card: post.cover_image ? 'summary_large_image' : 'summary',
      title: post.title,
      description,
      images: post.cover_image ? [post.cover_image] : undefined,
    },
  }
}

export default async function ResearchPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getResearchPost(id)

  if (!post) notFound()

  const { status, category, tags } = classifyResearch((post.labels || []) as string[])
  const meta = RESEARCH_STATUS_META[status]
  const readingTime = Math.max(1, Math.ceil((post.content?.length || 0) / 2000))
  const description = getDescription(post)
  const keywords = getKeywords(post)
  const canonical = `${SITE_URL}/research/${id}`
  const content = stripImportedHeadArtifacts(post.content || '')
  const jsonLd = buildResearchJsonLd({
    title: post.title,
    description,
    canonical,
    categoryLabel: RESEARCH_CATEGORY_LABEL[category],
    keywords: keywords.join(', '),
    content,
    published: post.published,
    updated: post.updated,
  })

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/research" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground no-underline mb-6">
          <ArrowLeft className="w-4 h-4" />
          Knowledge 목록으로
        </Link>
        <div className="mb-5"><EnglishSourceSwitch postId={post.id} englishHref={`/en/research/${post.slug}`} koreanHref={`/research/${post.slug}`} /></div>

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
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5" aria-label="글 태그">
                {tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded bg-muted text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 본문 — 마크다운 렌더링 */}
          <MarkdownRenderer content={content} />

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
