import { Database, Radio } from 'lucide-react'
import { DataServiceCard } from '@/components/data-service-card'
import { HubHeader } from '@/components/hub-header'
import { RelatedAssets } from '@/components/related-assets'
import { getDataHubSnapshot } from '@/lib/ia/hub-data'
import { getRelatedAssets } from '@/lib/ia/hub-projections'
import { buildRouteMetadata } from '@/lib/seo/metadata'

export const revalidate = 60

export const metadata = buildRouteMetadata({
  title: 'Data — DevSnack',
  description: 'AI Tech·StockPulse 피드를 한 곳에서 확인하는 DevSnack Data Hub',
  canonicalPath: '/data',
})

function formatDate(value?: string | null): string {
  if (!value) return '업데이트 시각 미기록'
  return new Date(value).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })
}

export default async function DataPage() {
  const snapshot = await getDataHubSnapshot()
  const stockPulseRelated = getRelatedAssets('project:stockpulse-ai-self-improvement')

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <HubHeader
          eyebrow="Live Information"
          title="Data"
          description="자동으로 수집·갱신되는 정보를 봅니다. Feed와 Tracker를 Story나 Experiment와 섞지 않고, 무엇을 수집하며 언제 갱신되는지 먼저 보여줍니다."
          icon={Database}
        />

        <section className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Data principles">
          <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><Radio className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /><h2 className="mt-3 text-sm font-bold">Feeds</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">계속 발행되는 AI Tech와 시장 분석 정보</p></div>
          <div className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900"><Database className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /><h2 className="mt-3 text-sm font-bold">Project → Assets</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">StockPulse처럼 하나의 Project가 Feed·Dataset·Experiment를 함께 만듭니다.</p></div>
        </section>

        <section className="mt-10" aria-labelledby="data-feeds-heading">
          <div className="mb-4"><h2 id="data-feeds-heading" className="text-xl font-bold">Feeds</h2><p className="mt-1 text-sm text-muted-foreground">자동 수집·정리·발행되는 정보</p></div>
          <div className="grid gap-4 lg:grid-cols-2">
            <DataServiceCard
              title="AI Tech"
              type="Feed"
              description="검색·RSS 자료를 수집하고 AI가 정리해 발행하는 AI 기술 뉴스 Feed입니다. 사람이 쓴 DevSnack Story와는 생성 주체와 소비 목적이 다릅니다."
              updateDescription="SearXNG/RSS 수집 → AI 정리 → 자동 발행"
              lastUpdated={formatDate(snapshot.aiTech?.updated || snapshot.aiTech?.published)}
              latestTitle={snapshot.aiTech?.title}
              href="/aitech"
              provenance="Automated AI news feed"
              relatedHref="/labs/blog"
              relatedLabel="AI Tech Automation System"
            />
            <DataServiceCard
              title="StockPulse"
              type="Feed"
              description="KOSPI/KOSDAQ 시장 데이터를 기반으로 자동 생성되는 아침·장 마감 분석 Feed입니다. 별도의 Data와 자기개선 Experiment가 함께 연결됩니다."
              updateDescription="장중 데이터 수집 → 시장 분석 → Feed 발행"
              lastUpdated={formatDate(snapshot.stockPulse?.updated || snapshot.stockPulse?.published)}
              latestTitle={snapshot.stockPulse?.title}
              href="/stock"
              provenance="Automated market analysis"
              relatedHref="/labs/stockpulse-ai-self-improvement"
              relatedLabel="Self-Improvement Experiment"
            />
          </div>
        </section>


        <RelatedAssets links={stockPulseRelated} title="StockPulse Project Relations" />
      </div>
    </div>
  )
}
