import type { Metadata } from 'next'
import { StockpulseV1FixedOverview } from '@/components/stockpulse-v1-fixed-overview'
import projection from '@/data/stockpulse-v1-fixed-projection.json'
import { buildRouteMetadata } from '@/lib/seo/metadata'
import { EDITORIAL_AUTHOR, EDITORIAL_AUTHOR_URL } from '@/lib/seo/site'
import type { StockpulseFixedProjection } from '@/lib/stockpulse-v1-fixed'

export const metadata: Metadata = {
  ...buildRouteMetadata({
    title: 'StockPulse V1 Fixed — DevSnack Lab',
    description: 'AI가 KOSPI·KOSDAQ 방향을 예측하고, 실제 장 마감 결과와 비교해 다음 판단을 개선하는 StockPulse V1 Fixed 실험',
    canonicalPath: '/labs/stockpulse-v1-fixed',
    section: 'Lab Project',
  }),
  authors: [{ name: EDITORIAL_AUTHOR, url: EDITORIAL_AUTHOR_URL }],
}

export const dynamic = 'force-static'
export const revalidate = false

export default function StockpulseV1FixedPage() {
  return <StockpulseV1FixedOverview projection={projection as StockpulseFixedProjection} />
}
