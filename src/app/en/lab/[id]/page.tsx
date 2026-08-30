import { notFound } from 'next/navigation'
import { EnglishPostArticle } from '@/components/english-post-article'
import { getEnglishPost } from '@/lib/translation'
import { buildRouteMetadata, absoluteSiteUrl, extractSourceUrls } from '@/lib/seo/metadata'
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildJsonLdGraph } from '@/lib/seo/structured-data'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entry = await getEnglishPost('lab', id)
  if (!entry) return { title: 'English Lab Note Not Found' }
  return buildRouteMetadata({
    title: entry.translation.title,
    description: entry.translation.seo_desc || entry.translation.excerpt || entry.translation.title,
    canonicalPath: `/en/lab/${id}`,
    kind: 'article',
    language: 'en',
    koreanPath: `/lab/${id}`,
    englishPath: `/en/lab/${id}`,
    section: id === 'ornith15-server-quality-speed-benchmark' ? 'Benchmark' : 'Lab Notes',
    searchPolicy: 'noindex',
    image: entry.source.cover_image,
    publishedTime: entry.source.published,
    modifiedTime: entry.source.updated,
  })
}

export default async function EnglishLabPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entry = await getEnglishPost('lab', id)
  if (!entry) notFound()
  const isBenchmark = id === 'ornith15-server-quality-speed-benchmark'
  const section = isBenchmark ? 'Benchmark' : 'Lab Notes'
  const jsonLd = buildJsonLdGraph(
    buildArticleJsonLd({
      type: 'TechArticle',
      title: entry.translation.title,
      description: entry.translation.seo_desc || entry.translation.excerpt || entry.translation.title,
      url: absoluteSiteUrl(`/en/lab/${id}`),
      language: 'en',
      section,
      published: entry.source.published,
      modified: entry.source.updated,
      image: entry.source.cover_image,
      keywords: entry.source.labels || [],
      citations: extractSourceUrls(entry.translation.content || ''),
      about: { '@type': 'Thing', name: isBenchmark ? 'Measured benchmark result' : 'StockPulse AI experiment note' },
      isPartOf: isBenchmark
        ? { '@type': 'CollectionPage', name: 'Benchmarks', url: absoluteSiteUrl('/en/benchmarks') }
        : { '@type': 'CollectionPage', name: 'StockPulse AI Self-Improvement Experiment', url: absoluteSiteUrl('/en/labs/stockpulse-ai-self-improvement') },
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', url: absoluteSiteUrl('/en') },
      { name: section, url: absoluteSiteUrl(isBenchmark ? '/en/benchmarks' : '/en/labs/stockpulse-ai-self-improvement') },
      { name: entry.translation.title, url: absoluteSiteUrl(`/en/lab/${id}`) },
    ], 'en'),
  )
  return <EnglishPostArticle source={entry.source} translation={entry.translation} status={entry.status} englishPath={`/en/lab/${id}`} sectionTitle={section} sectionSubtitle={isBenchmark ? 'Measured local model behavior' : 'Experiment record'} structuredData={jsonLd} />
}
