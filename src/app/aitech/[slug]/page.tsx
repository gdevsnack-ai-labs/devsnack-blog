import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase, type Post } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import { ViewCounter } from '@/components/view-counter'
import { BlogHeader } from '@/components/blog-header'
import { FeedProvenance } from '@/components/feed-provenance'
import { buildRouteMetadata, absoluteSiteUrl, extractSourceUrls, stripImportedHeadArtifacts } from '@/lib/seo/metadata'
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildJsonLdGraph } from '@/lib/seo/structured-data'
import { feedDetailFilters } from '@/lib/ia/feed-lifecycle'

export const revalidate = 60

async function getPost(slug: string): Promise<Post | null> {
  let query = supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
  for (const [column, value] of Object.entries(feedDetailFilters('aitech'))) {
    query = query.eq(column, value)
  }
  const { data } = await query
    .single()
  return data
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Not Found' }
  const description = post.seo_desc ?? post.excerpt ?? post.title
  return buildRouteMetadata({
    title: post.title,
    description,
    canonicalPath: `/aitech/${slug}`,
    kind: 'article',
    language: 'ko',
    section: 'AI Tech',
    image: post.cover_image,
    publishedTime: post.published,
    modifiedTime: post.updated,
  })
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const readingTime = Math.max(1, Math.ceil((post.content?.length || 0) / 2000))
  const jsonLd = buildJsonLdGraph(
    buildArticleJsonLd({
      type: 'TechArticle',
      title: post.title,
      description: post.seo_desc ?? post.excerpt ?? post.title,
      url: absoluteSiteUrl(`/aitech/${slug}`),
      language: 'ko',
      section: 'AI Tech',
      published: post.published,
      modified: post.updated,
      image: post.cover_image,
      keywords: [...(post.labels || []), 'AI Tech', 'automated feed'],
      citations: extractSourceUrls(post.content || ''),
      about: { '@type': 'CreativeWork', name: 'AI Tech Automation System', url: absoluteSiteUrl('/labs/blog') },
      isPartOf: { '@type': 'CollectionPage', name: 'AI Tech Automation System', url: absoluteSiteUrl('/labs/blog') },
    }),
    buildBreadcrumbJsonLd([
      { name: '홈', url: absoluteSiteUrl('/') },
      { name: 'AI Tech', url: absoluteSiteUrl('/aitech') },
      { name: post.title, url: absoluteSiteUrl(`/aitech/${slug}`) },
    ], 'ko'),
  )

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogHeader title="AI Tech Insight" subtitle="AI 기술과 산업 동향" icon="aitech" color="purple" />
      <div className="max-w-3xl mx-auto px-4 py-4">
        <Link href="/aitech" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground no-underline">
          <ArrowLeft className="w-4 h-4" /> AI Tech 목록으로
        </Link>
      </div>
      <article className="content-article max-w-3xl mx-auto min-w-0 px-4 py-8">
        {post.cover_image && (
          <div className="aspect-[16/7] rounded-xl overflow-hidden mb-8 bg-gray-100 dark:bg-gray-800">
            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-3 mb-8 text-sm text-muted-foreground">
          {post.published && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(post.published).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> 약 {readingTime}분
          </span>
          <ViewCounter slug={post.slug} views={post.views} />
          {post.labels && post.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.labels.map((l: string) => (
                <Badge key={l} variant="secondary" className="text-xs font-normal">{l}</Badge>
              ))}
            </div>
          )}
        </div>
        <FeedProvenance blogId="aitech" provenance={post.provenance} published={post.published} />
        <div className="border-t mb-8" />
        <div className="prose-devsnack" dangerouslySetInnerHTML={{ __html: stripImportedHeadArtifacts(post.content || '') }} />
      </article>
      <footer className="border-t mt-16">
        <div className="max-w-3xl mx-auto px-4 py-8 flex justify-center gap-6 text-sm">
          <Link href="/aitech" className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:underline no-underline">
            <ArrowLeft className="w-4 h-4" /> AI Tech 블로그 목록으로
          </Link>
        </div>
      </footer>
    </div>
  )
}
