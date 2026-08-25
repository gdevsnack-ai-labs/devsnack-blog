import { notFound } from 'next/navigation'
import { EnglishPostArticle } from '@/components/english-post-article'
import { getEnglishPost } from '@/lib/translation'
import { buildRouteMetadata } from '@/lib/seo/metadata'

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
    image: entry.source.cover_image,
    publishedTime: entry.source.published,
    modifiedTime: entry.source.updated,
  })
}

export default async function EnglishKnowledgePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entry = await getEnglishPost('research', id)
  if (!entry) notFound()
  return <EnglishPostArticle source={entry.source} translation={entry.translation} status={entry.status} englishPath={`/en/research/${id}`} sectionTitle="Knowledge" sectionSubtitle="Technical reference and investigation" />
}
