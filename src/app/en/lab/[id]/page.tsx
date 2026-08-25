import { notFound } from 'next/navigation'
import { EnglishPostArticle } from '@/components/english-post-article'
import { getEnglishPost } from '@/lib/translation'
import { buildRouteMetadata } from '@/lib/seo/metadata'

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
  return <EnglishPostArticle source={entry.source} translation={entry.translation} status={entry.status} englishPath={`/en/lab/${id}`} sectionTitle={isBenchmark ? 'Benchmark' : 'Lab Notes'} sectionSubtitle={isBenchmark ? 'Measured local model behavior' : 'Experiment record'} />
}
