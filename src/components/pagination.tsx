import Link from 'next/link'

interface PaginationProps {
  page: number
  totalPages: number
  searchParams?: Record<string, string | undefined>
}

function pageHref(page: number, searchParams: Record<string, string | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== 'page') params.set(key, value)
  }
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function Pagination({ page, totalPages, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null

  const visiblePages = new Set<number>([1, totalPages, page - 1, page, page + 1])
  const pages = [...visiblePages].filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  const items: Array<number | 'ellipsis'> = []

  pages.forEach((p, index) => {
    if (index > 0 && p - pages[index - 1] > 1) items.push('ellipsis')
    items.push(p)
  })

  return (
    <nav aria-label="페이지 이동" className="flex flex-wrap items-center justify-center gap-1 mt-8">
      {page > 1 && (
        <Link
          href={pageHref(page - 1, searchParams)}
          className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted no-underline"
        >
          이전
        </Link>
      )}
      {items.map((item, index) => item === 'ellipsis' ? (
        <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted-foreground">…</span>
      ) : (
        <Link
          key={item}
          href={pageHref(item, searchParams)}
          aria-current={item === page ? 'page' : undefined}
          className={`min-w-8 px-2 py-1.5 rounded-lg border text-sm text-center no-underline ${
            item === page
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-border hover:bg-muted'
          }`}
        >
          {item}
        </Link>
      ))}
      {page < totalPages && (
        <Link
          href={pageHref(page + 1, searchParams)}
          className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted no-underline"
        >
          다음
        </Link>
      )}
    </nav>
  )
}
