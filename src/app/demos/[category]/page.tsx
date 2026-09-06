import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { DEMOS, getDemoCategoryMeta, type DemoCategory } from '@/data/demos'
import { buildRouteMetadata } from '@/lib/seo/metadata'
import DemoShowcaseList from '@/components/demo-showcase-list'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const meta = getDemoCategoryMeta(category)
  if (!meta) return { title: 'Showcase Not Found' }
  return buildRouteMetadata({
    title: `${meta.label} Showcase — DevSnack`,
    description: meta.description,
    canonicalPath: `/demos/${category}`,
    searchPolicy: (DEMOS[category as DemoCategory] || []).length > 0 ? 'index' : 'noindex',
  })
}

export default async function DemoCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const meta = getDemoCategoryMeta(category)
  if (!meta) notFound()
  const items = DEMOS[category as DemoCategory] || []

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/demos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground no-underline mb-6">
          <ArrowLeft className="w-4 h-4" />
          Showcase로 돌아가기
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{meta.emoji}</span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{meta.label} Showcase</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{meta.description}</p>
        </div>

        {items.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-12 text-center">
            <p className="text-3xl mb-3">{meta.emoji}</p>
            <p className="text-muted-foreground">아직 {meta.label} 데모가 없습니다 — 곧 추가될 예정이에요.</p>
          </div>
        ) : (
          <DemoShowcaseList category={category as DemoCategory} items={items} />
        )}
      </div>
    </div>
  )
}