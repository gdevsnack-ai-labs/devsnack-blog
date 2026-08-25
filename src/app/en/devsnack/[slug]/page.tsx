import { notFound } from 'next/navigation'
import { EnglishPostArticle } from '@/components/english-post-article'
import { getEnglishPost } from '@/lib/translation'
import { buildRouteMetadata } from '@/lib/seo/metadata'

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
    image: entry.source.cover_image,
    publishedTime: entry.source.published,
    modifiedTime: entry.source.updated,
  })
}

export default async function EnglishStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = await getEnglishPost('devsnack', slug)
  if (!entry) notFound()
  return <EnglishPostArticle source={entry.source} translation={entry.translation} status={entry.status} englishPath={`/en/devsnack/${slug}`} sectionTitle="Stories" sectionSubtitle="Original editorial work" />
}
