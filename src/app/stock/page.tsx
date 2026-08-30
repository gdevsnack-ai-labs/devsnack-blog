import { buildRouteMetadata } from '@/lib/seo/metadata'
import { StockPageClient } from '@/components/stock-page-client'

export const metadata = buildRouteMetadata({
  title: 'StockPulse — Daily Report Hub',
  description: 'StockPulse v1 Daily Report의 GitHub Pages publication과 archive를 연결하는 DevSnack Hub',
  canonicalPath: '/stock',
  searchPolicy: 'noindex',
})

export const dynamic = 'force-static'
export const revalidate = false

export default function StockPage() {
  return <StockPageClient />
}
