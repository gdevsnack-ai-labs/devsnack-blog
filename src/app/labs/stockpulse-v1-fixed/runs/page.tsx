import type { Metadata } from 'next'
import { StockpulseV1FixedLab } from '@/components/stockpulse-v1-fixed-lab'
import projection from '@/data/stockpulse-v1-fixed-projection.json'
import { buildRouteMetadata } from '@/lib/seo/metadata'
import { EDITORIAL_AUTHOR, EDITORIAL_AUTHOR_URL } from '@/lib/seo/site'
import type { StockpulseFixedProjection } from '@/lib/stockpulse-v1-fixed'

export const metadata: Metadata = {
  ...buildRouteMetadata({
    title: 'StockPulse V1 Fixed Run Board — DevSnack Lab',
    description: 'StockPulse V1 Fixed의 날짜별 예측·실제 결과·운영 개선 기록을 확인하는 noindex Run Board',
    canonicalPath: '/labs/stockpulse-v1-fixed/runs',
    section: 'Lab Operations',
    searchPolicy: 'noindex',
  }),
  authors: [{ name: EDITORIAL_AUTHOR, url: EDITORIAL_AUTHOR_URL }],
}

export const dynamic = 'force-dynamic'
export const revalidate = false

export default function StockpulseV1FixedRunsPage() {
  return <StockpulseV1FixedLab projection={projection as StockpulseFixedProjection} />
}
