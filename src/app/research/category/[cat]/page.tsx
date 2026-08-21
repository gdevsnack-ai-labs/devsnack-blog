import { notFound } from 'next/navigation'
import { ResearchList, RESEARCH_CATEGORIES } from '@/components/research-list'
import { RESEARCH_CATEGORY_LABEL } from '@/lib/content-taxonomy'
import { buildRouteMetadata } from '@/lib/seo/metadata'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ cat: string }> }) {
  const { cat } = await params
  if (!RESEARCH_CATEGORIES.includes(cat as (typeof RESEARCH_CATEGORIES)[number])) return { title: 'Knowledge Category Not Found' }
  return buildRouteMetadata({
    title: `${RESEARCH_CATEGORY_LABEL[cat as keyof typeof RESEARCH_CATEGORY_LABEL]} — DevSnack Knowledge`,
    description: `DevSnack Knowledge의 ${cat} 관련 기술 조사와 참고 자료`,
    canonicalPath: `/research/category/${cat}`,
  })
}

export default async function ResearchCategoryPage({ params }: { params: Promise<{ cat: string }> }) {
  const { cat } = await params
  if (!RESEARCH_CATEGORIES.includes(cat as (typeof RESEARCH_CATEGORIES)[number])) {
    notFound()
  }
  return <ResearchList category={cat} />
}