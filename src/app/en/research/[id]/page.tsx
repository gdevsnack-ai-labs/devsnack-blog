import { notFound } from 'next/navigation'
import { EnglishPostArticle } from '@/components/english-post-article'
import { getEnglishPost } from '@/lib/translation'
import { buildRouteMetadata, absoluteSiteUrl, extractSourceUrls } from '@/lib/seo/metadata'
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildJsonLdGraph } from '@/lib/seo/structured-data'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entry = await getEnglishPost('research', id)
  if (!entry) return { title: 'English Knowledge Not Found' }
  return buildRouteMetadata({
    title: entry.translation.title,
    description: entry.translation.seo_desc || entry.translation.excerpt || entry.translation.title,
    canonicalPath: `/en/research/${id}`,
    kind: 'article',
    language: 'en',
    koreanPath: `/research/${id}`,
    englishPath: `/en/research/${id}`,
    section: 'Knowledge',
    searchPolicy: 'noindex',
    image: entry.source.cover_image,
    publishedTime: entry.source.published,
    modifiedTime: entry.source.updated,
  })
}

export default async function EnglishKnowledgePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entry = await getEnglishPost('research', id)
  if (!entry) notFound()
  const jsonLd = buildJsonLdGraph(
    buildArticleJsonLd({
      type: 'TechArticle',
      title: entry.translation.title,
      description: entry.translation.seo_desc || entry.translation.excerpt || entry.translation.title,
      url: absoluteSiteUrl(`/en/research/${id}`),
      language: 'en',
      section: 'Knowledge',
      published: entry.source.published,
      modified: entry.source.updated,
      image: entry.source.cover_image,
      keywords: entry.source.labels || [],
      citations: extractSourceUrls(entry.translation.content || ''),
      about: { '@type': 'Thing', name: 'Local AI and infrastructure research' },
      isPartOf: { '@type': 'CollectionPage', name: 'DevSnack English Pilot', url: absoluteSiteUrl('/en') },
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', url: absoluteSiteUrl('/en') },
      { name: 'English Pilot', url: absoluteSiteUrl('/en') },
      { name: entry.translation.title, url: absoluteSiteUrl(`/en/research/${id}`) },
    ], 'en'),
  )
  return <EnglishPostArticle source={entry.source} translation={entry.translation} status={entry.status} englishPath={`/en/research/${id}`} sectionTitle="Knowledge" sectionSubtitle="Technical reference and investigation" structuredData={jsonLd} />
}
