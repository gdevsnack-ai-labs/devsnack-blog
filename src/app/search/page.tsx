'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, X, ArrowRight, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type SearchResult = {
  id: number
  slug: string
  title: string
  excerpt: string | null
  labels: string[] | null
  published: string | null
  cover_image: string | null
  blog_id: string
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
    }
    setLoading(false)
  }, [query])

  useEffect(() => {
    if (query.length >= 2) {
      const timer = setTimeout(() => handleSearch(), 400)
      return () => clearTimeout(timer)
    } else {
      setResults([])
      setSearched(false)
    }
  }, [query, handleSearch])

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block no-underline">
            ← 홈으로
          </Link>
          <h1 className="text-2xl font-bold mb-4">검색</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="검색어를 입력하세요..."
              className="w-full pl-10 pr-10 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              autoFocus
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]); setSearched(false) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading && (
          <p className="text-center text-muted-foreground py-8">검색 중...</p>
        )}

        {!loading && searched && results.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            &quot;{query}&quot;에 대한 검색 결과가 없습니다.
          </p>
        )}

        {!loading && results.length > 0 && (
          <p className="text-sm text-muted-foreground mb-4">
            총 {results.length}개 결과 (블로그: {results.filter(r => r.blog_id === 'devsnack').length}개 DevSnack, {results.filter(r => r.blog_id === 'stockpulse').length}개 StockPulse)
          </p>
        )}

        <div className="space-y-4">
          {results.map((post) => (
            <Link
              key={post.id}
              href={`/${post.blog_id === 'stockpulse' ? 'stock' : 'devsnack'}/${post.slug}`}
              className="block no-underline group"
            >
              <article className="rounded-xl border bg-white dark:bg-gray-900 p-4 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  {post.cover_image && (
                    <img src={post.cover_image} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {post.blog_id === 'stockpulse' ? '📈 StockPulse' : '💻 DevSnack'}
                      </Badge>
                      {post.labels?.slice(0, 2).map(l => (
                        <Badge key={l} variant="secondary" className="text-xs font-normal">{l}</Badge>
                      ))}
                    </div>
                    <h2 className="font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{post.excerpt}</p>
                    )}
                    {post.published && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {new Date(post.published).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-600 shrink-0 mt-1" />
                </div>
              </article>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
