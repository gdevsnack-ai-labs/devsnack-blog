import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, FileCode2, Music2, Image, Film } from 'lucide-react'
import { DEMO_CATEGORIES, DEMOS, getDemoCategoryMeta, type DemoCategory } from '@/data/demos'

export const revalidate = 60

const CATEGORY_ICON: Record<string, any> = {
  html: FileCode2,
  music: Music2,
  image: Image,
  shortmovie: Film,
}

export default async function DemoCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const meta = getDemoCategoryMeta(category)
  if (!meta) notFound()
  const items = DEMOS[category as DemoCategory] || []
  const Icon = CATEGORY_ICON[category] || FileCode2

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/demos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground no-underline mb-6">
          <ArrowLeft className="w-4 h-4" />
          Demos로 돌아가기
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{meta.emoji}</span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{meta.label} Demos</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{meta.description}</p>
        </div>

        {items.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-12 text-center">
            <p className="text-3xl mb-3">{meta.emoji}</p>
            <p className="text-muted-foreground">아직 {meta.label} 데모가 없습니다 — 곧 추가될 예정이에요.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map(demo => (
              <div key={demo.id} className="border border-border rounded-xl overflow-hidden bg-white dark:bg-gray-900">
                {/* 데모 헤더 */}
                <div className="p-5 border-b border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold">{demo.title}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{demo.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground">
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">🤖 {demo.model}</span>
                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{demo.createdAt}</span>
                      </div>
                    </div>
                    <a
                      href={demo.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 no-underline transition-colors shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                      새 탭으로 열기
                    </a>
                  </div>
                  {demo.note && (
                    <p className="text-xs text-muted-foreground/80 mt-3 italic">📝 {demo.note}</p>
                  )}
                </div>

                {/* 임베드 가능한 데모는 iframe으로 바로 재생 */}
                {demo.embeddable && (
                  <div className="bg-gray-50 dark:bg-gray-950">
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
                      <span className="text-xs text-muted-foreground">🔽 데모 직접 실행 (아래)</span>
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <iframe
                      src={demo.href}
                      title={demo.title}
                      className="w-full h-[560px] border-0"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}