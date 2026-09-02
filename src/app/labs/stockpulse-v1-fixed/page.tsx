import type { Metadata } from 'next'
import { StockpulseV1FixedLab } from '@/components/stockpulse-v1-fixed-lab'
import projection from '@/data/stockpulse-v1-fixed-projection.json'
import { buildRouteMetadata } from '@/lib/seo/metadata'
import type { StockpulseFixedProjection } from '@/lib/stockpulse-v1-fixed'

export const metadata: Metadata = buildRouteMetadata({
  title: 'StockPulse V1 Fixed — DevSnack Lab',
  description: 'StockPulse V1 Fixed의 Live Shadow 예측·실제 결과·평가·개선 상태를 보여주는 별도 Experiment Dashboard',
  canonicalPath: '/labs/stockpulse-v1-fixed',
  section: 'Lab Project',
})

export const dynamic = 'force-static'
export const revalidate = false

export default function StockpulseV1FixedPage() {
  return <StockpulseV1FixedLab projection={projection as StockpulseFixedProjection} />
}
