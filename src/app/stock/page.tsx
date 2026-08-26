import { buildRouteMetadata } from '@/lib/seo/metadata'
import { StockPageClient } from '@/components/stock-page-client'

export const metadata = buildRouteMetadata({
  title: 'StockPulse — DevSnack',
  description: '자동 생성되는 KOSPI·KOSDAQ 시장 분석 Feed와 자기개선 실험',
  canonicalPath: '/stock',
})

export const dynamic = 'force-static'
export const revalidate = false

export default function StockPage() {
  return <StockPageClient />
}
