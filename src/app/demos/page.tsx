import Link from 'next/link'
import { DEMO_CATEGORIES, DEMOS } from '@/data/demos'
import { buildRouteMetadata } from '@/lib/seo/metadata'

export const revalidate = 60

export const metadata = buildRouteMetadata({
  title: 'Showcase — DevSnack',
  description: '로컬 AI로 직접 만든 HTML·이미지·음악·영상 결과물 Showcase',
  canonicalPath: '/demos',
})

export default function DemosPage() {
  let total = 0
  for (const cat of DEMO_CATEGORIES) total += DEMOS[cat.key].length
  const populatedCategories = DEMO_CATEGORIES.filter(cat => DEMOS[cat.key].length > 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">🧪 Showcase</h1>
          <p className="text-sm text-muted-foreground mt-1">
            로컬 AI(GB10)로 생성한 결과물 Showcase — 총 {total}개
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {populatedCategories.map(cat => {
            const items = DEMOS[cat.key]
            return (
              <Link
                key={cat.key}
                href={`/demos/${cat.key}`}
                className="border border-border rounded-xl p-6 bg-white dark:bg-gray-900 hover:border-blue-200 dark:hover:border-blue-800 transition-colors no-underline group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{cat.emoji}</span>
                  <h2 className="text-xl font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {cat.label}
                  </h2>
                  <span className="ml-auto text-sm text-muted-foreground">{items.length}개</span>
                </div>
                <p className="text-sm text-muted-foreground">{cat.description}</p>
              </Link>
            )
          })}
        </div>

      </div>
    </div>
  )
}