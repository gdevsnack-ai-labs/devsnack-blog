import { AlertTriangle, BarChart3 } from 'lucide-react'
import { HermesUsageDashboard } from '@/components/hermes-usage-dashboard'
import { getHermesUsageSnapshot } from '@/lib/hermes-usage-data'
import { buildRouteMetadata } from '@/lib/seo/metadata'

export const revalidate = 300

export const metadata = buildRouteMetadata({
  title: 'DevSnack 모델 사용량 — DevSnack',
  description: 'DevSnack AI Lab 공개 모델별 토큰 사용량을 12시간 단위로 보여주는 aggregate 통계입니다.',
  canonicalPath: '/data/hermes-usage',
  indexable: false,
})

function EmptyState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
          <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" /> DevSnack AI Lab
        </div>
        <h1 className="text-3xl font-bold tracking-tight">DevSnack 모델 사용량</h1>
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">아직 표시할 공개 모델 사용량 스냅샷이 없습니다.</p>
            <p className="mt-1 text-xs opacity-80">{message || 'DevSnack AI Lab의 12시간 수집 작업이 첫 리포트를 전송하면 표시됩니다.'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function HermesUsagePage() {
  const snapshot = await getHermesUsageSnapshot()

  if (!snapshot.available || !snapshot.report || !snapshot.capturedAt) {
    return <EmptyState message={snapshot.error || ''} />
  }

  return <HermesUsageDashboard report={snapshot.report} capturedAt={snapshot.capturedAt} isStale={snapshot.isStale} />
}
