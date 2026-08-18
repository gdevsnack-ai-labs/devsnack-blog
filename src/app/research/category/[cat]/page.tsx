import { notFound } from 'next/navigation'
import { ResearchList, RESEARCH_CATEGORIES } from '@/components/research-list'

export const revalidate = 60

export default async function ResearchCategoryPage({ params }: { params: Promise<{ cat: string }> }) {
  const { cat } = await params
  if (!RESEARCH_CATEGORIES.includes(cat as (typeof RESEARCH_CATEGORIES)[number])) {
    notFound()
  }
  return <ResearchList category={cat} />
}