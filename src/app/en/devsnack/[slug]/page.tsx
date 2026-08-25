import { notFound } from 'next/navigation'
import { EnglishPostArticle } from '@/components/english-post-article'
import { getEnglishPost } from '@/lib/translation'
import { buildRouteMetadata, absoluteSiteUrl, extractSourceUrls } from '@/lib/seo/metadata'
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildJsonLdGraph } from '@/lib/seo/structured-data'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = await getEnglishPost('devsnack', slug)
  if (!entry) return { title: 'English Story Not Found' }
  return buildRouteMetadata({
    title: entry.translation.title,
    description: entry.translation.seo_desc || entry.translation.excerpt || entry.translation.title,
    canonicalPath: `/en/devsnack/${slug}`,
    kind: 'article',
    language: 'en',
    koreanPath: `/devsnack/${slug}`,
    englishPath: `/en/devsnack/${slug}`,
    section: 'Stories',
    image: entry.source.cover_image,
    publishedTime: entry.source.published,
    modifiedTime: entry.source.updated,
  })
}

export default async function EnglishStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = await getEnglishPost('devsnack', slug)
  if (!entry) notFound()
  const jsonLd = buildJsonLdGraph(
    buildArticleJsonLd({
      type: 'Article',
      title: entry.translation.title,
      description: entry.translation.seo_desc || entry.translation.excerpt || entry.translation.title,
      url: absoluteSiteUrl(`/en/devsnack/${slug}`),
      language: 'en',
      section: 'Stories',
      published: entry.source.published,
      modified: entry.source.updated,
      image: entry.source.cover_image,
      keywords: entry.source.labels || [],
      citations: extractSourceUrls(entry.translation.content || ''),
      about: { '@type': 'Thing', name: 'AI and developer experience' },
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', url: absoluteSiteUrl('/en') },
      { name: 'Stories', url: absoluteSiteUrl('/en/devsnack') },
      { name: entry.translation.title, url: absoluteSiteUrl(`/en/devsnack/${slug}`) },
    ], 'en'),
  )
  return <EnglishPostArticle source={entry.source} translation={entry.translation} status={entry.status} englishPath={`/en/devsnack/${slug}`} sectionTitle="Stories" sectionSubtitle="Original editorial work" structuredData={jsonLd} />
}
