'use client'

import { useState } from 'react'
import { ExternalLink, FileCode2, Film, Image, Music2, type LucideIcon, ChevronDown } from 'lucide-react'
import type { Demo, DemoCategory } from '@/data/demos'

const CATEGORY_ICON: Record<DemoCategory, LucideIcon> = {
  html: FileCode2,
  music: Music2,
  image: Image,
  shortmovie: Film,
}

interface DemoShowcaseListProps {
  category: DemoCategory
  items: Demo[]
}

export default function DemoShowcaseList({ category, items }: DemoShowcaseListProps) {
  const [openDemoId, setOpenDemoId] = useState<string | null>(null)
  const Icon = CATEGORY_ICON[category]

  return (
    <div className="space-y-6">
      {items.map(demo => {
        const expanded = openDemoId === demo.id
        const detailId = `demo-detail-${demo.id}`

        return (
          <article key={demo.id} className="overflow-hidden rounded-xl border border-border bg-white dark:bg-gray-900">
            <div className="p-5">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between">
                <button
                  type="button"
                  onClick={() => setOpenDemoId(expanded ? null : demo.id)}
                  aria-expanded={expanded}
                  aria-controls={detailId}
                  className="group min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold group-hover:text-blue-700 dark:group-hover:text-blue-300">{demo.title}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{demo.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">🤖 {demo.model}</span>
                        <span className="rounded bg-gray-100 px-2 py-0.5 dark:bg-gray-800">{demo.createdAt}</span>
                      </div>
                    </div>
                    <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    {expanded ? '상세 접기' : '상세 펼치기'}
                    <span aria-hidden="true">·</span>
                    <span>{expanded ? '실행 화면 숨기기' : '실행 화면 보기'}</span>
                  </span>
                </button>

                <a
                  href={demo.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 no-underline transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
                >
                  <ExternalLink className="h-4 w-4" />
                  새 탭으로 열기
                </a>
              </div>

              <div id={detailId} hidden={!expanded}>
                {expanded && (
                  <div className="mt-5 border-t border-border pt-4">
                    {demo.note && (
                      <p className="mb-4 text-xs italic text-muted-foreground/80">📝 {demo.note}</p>
                    )}

                    {/* 미디어 데모는 실제 플레이어, HTML 데모는 iframe으로 실행 */}
                    {demo.mediaType === 'video' ? (
                      <div className="bg-gray-50 dark:bg-gray-950">
                        <video
                          controls
                          playsInline
                          preload="metadata"
                          className="aspect-video w-full rounded-lg bg-black"
                        >
                          <source src={demo.href} type="video/mp4" />
                          브라우저가 video 태그를 지원하지 않습니다.
                        </video>
                      </div>
                    ) : demo.embeddable ? (
                      <div className="bg-gray-50 dark:bg-gray-950">
                        <div className="flex items-center justify-between bg-muted/50 px-4 py-2">
                          <span className="text-xs text-muted-foreground">🔽 데모 직접 실행</span>
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <iframe
                          src={demo.href}
                          title={demo.title}
                          className="h-[560px] w-full border-0"
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
