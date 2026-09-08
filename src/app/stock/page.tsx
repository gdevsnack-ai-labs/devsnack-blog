import { buildRouteMetadata } from '@/lib/seo/metadata'
import { StockPageClient } from '@/components/stock-page-client'
import fixedProjection from '@/data/stockpulse-v1-fixed-projection.json'
import { getAvailableStockpulsePublications, type StockpulseFixedProjection } from '@/lib/stockpulse-v1-fixed'

export const metadata = buildRouteMetadata({
  title: 'StockPulse — Daily Report Hub',
  description: '현재 운영 중인 StockPulse V1 Fixed Daily Feed와 기존 V1 Daily Report archive를 연결하는 DevSnack Hub',
  canonicalPath: '/stock',
  searchPolicy: 'noindex',
})

export const dynamic = 'force-static'
export const revalidate = false

export default function StockPage() {
  const currentPublications = getAvailableStockpulsePublications(fixedProjection as StockpulseFixedProjection)
  return <StockPageClient latestPublication={currentPublications[0] || null} currentPublications={currentPublications} />
}
