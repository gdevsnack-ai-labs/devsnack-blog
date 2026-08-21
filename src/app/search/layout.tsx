import type { Metadata } from 'next'
import { buildRouteMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = {
  ...buildRouteMetadata({
    title: '검색 — DevSnack',
    description: 'DevSnack의 Stories·Lab·Benchmark·Knowledge·Data 기록 검색',
    canonicalPath: '/search',
  }),
  robots: { index: false, follow: true },
}

export default function SearchLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
