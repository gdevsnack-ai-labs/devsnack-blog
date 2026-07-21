'use client'

import { useMemo, useState } from 'react'
import { Search, Tag, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'

type PostSummary = {
  slug: string
  title: string
  published: string | null
  labels: string[] | null
}

export function BlogSidebar({ posts, blogPath }: { posts: PostSummary[]; blogPath: string }) {
  const [search, setSearch] = useState('')

  // Tags with counts
  const tags = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of posts) {
      if (p.labels) {
        for (const l of p.labels) {
          map.set(l, (map.get(l) || 0) + 1)
        }
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [posts])

  // Monthly archives
  const months = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of posts) {
      if (p.published) {
        const key = p.published.slice(0, 7) // YYYY-MM
        map.set(key, (map.get(key) || 0) + 1)
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [posts])

  // Filtered posts for search
  const filtered = useMemo(() => {
    if (!search) return []
    const q = search.toLowerCase()
    return posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.labels && p.labels.some(l => l.toLowerCase().includes(q)))
    ).slice(0, 10)
  }, [search, posts])

  return (
    <aside className="space-y-6">
      {/* 검색 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="글 제목 또는 태그 검색..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {search && filtered.length > 0 && (
          <div className="mt-3 space-y-1 max-h-60 overflow-y-auto">
            {filtered.map(p => (
              <Link key={p.slug} href={`/${blogPath}/${p.slug}`}
                className="block text-sm py-1.5 px-2 rounded-lg hover:bg-muted transition-colors no-underline">
                <span className="line-clamp-1">{p.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 태그별 글 갯수 */}
      {tags.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4" /> 태그
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 30).map(([tag, count]) => (
              <Link key={tag} href={`/${blogPath}?tag=${encodeURIComponent(tag)}`}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors no-underline">
                {tag}
                <span className="text-muted-foreground">{count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 월별 글 갯수 */}
      {months.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> 월별 글
          </h3>
          <div className="space-y-1">
            {months.map(([ym, count]) => (
              <Link key={ym} href={`/${blogPath}?month=${ym}`}
                className="flex items-center justify-between text-sm py-1 px-2 rounded-lg hover:bg-muted transition-colors no-underline group">
                <span>{ym.slice(0, 4)}년 {ym.slice(5)}월</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground">{count}건</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
