import { BookOpen, Layers3 } from 'lucide-react'
import { HubHeader } from '@/components/hub-header'
import { KnowledgeAssetCard } from '@/components/knowledge-asset-card'
import { RelatedAssets } from '@/components/related-assets'
import { getKnowledgePosts } from '@/lib/ia/hub-data'
import {
  KNOWLEDGE_DOMAIN_LABEL,
  projectKnowledgePosts,
  type KnowledgeDomain,
} from '@/lib/ia/hub-projections'
import { buildRouteMetadata } from '@/lib/seo/metadata'

export const revalidate = 60

export const metadata = buildRouteMetadata({
  title: 'Knowledge — DevSnack',
  description: 'AI·LLM·Agent·Media·Infrastructure 기술 지식을 다시 찾아보는 DevSnack Knowledge 저장소',
  canonicalPath: '/research',
})

const DOMAIN_ORDER: KnowledgeDomain[] = ['ai-llm', 'agent-memory', 'media', 'infrastructure', 'hardware', 'other']

export default async function KnowledgePage() {
  const posts = projectKnowledgePosts(await getKnowledgePosts())
  const counts = Object.fromEntries(DOMAIN_ORDER.map(domain => [domain, posts.filter(post => post.domain === domain).length])) as Record<KnowledgeDomain, number>
  const recent = posts.filter(post => !post.benchmarkResearch).slice(0, 8)
  const benchmarkResearch = posts.filter(post => post.benchmarkResearch).slice(0, 8)
  const relatedPosts = posts.filter(post => post.related.length > 0).slice(0, 3)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <HubHeader
          eyebrow="Reference Knowledge"
          title="Knowledge"
          description="나중에 다시 찾아볼 기술 지식 저장소입니다. Research workflow의 상태나 정식 Benchmark Result와 섞지 않고, 주제·요약·업데이트·관련 Project를 중심으로 보여줍니다."
          icon={BookOpen}
        />

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-labelledby="knowledge-domains-heading">
          <div className="sm:col-span-2 lg:col-span-3"><h2 id="knowledge-domains-heading" className="text-xl font-bold">Knowledge Domains</h2><p className="mt-1 text-sm text-muted-foreground">기존 `/research/category/*` route는 유지하고, 화면에서는 Phase 3 taxonomy로 투영합니다.</p></div>
          {DOMAIN_ORDER.filter(domain => counts[domain] > 0).map(domain => (
            <div key={domain} className="rounded-xl border border-border bg-white p-4 dark:bg-gray-900">
              <div className="flex items-center justify-between gap-3"><span className="text-sm font-bold">{KNOWLEDGE_DOMAIN_LABEL[domain]}</span><Layers3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" /></div>
              <p className="mt-3 text-2xl font-bold">{counts[domain]}<span className="ml-1 text-xs font-normal text-muted-foreground">assets</span></p>
            </div>
          ))}
        </section>

        <section className="mt-10" aria-labelledby="recent-knowledge-heading">
          <div className="mb-4"><h2 id="recent-knowledge-heading" className="text-xl font-bold">Recent Knowledge</h2><p className="mt-1 text-sm text-muted-foreground">최근 업데이트된 참고 자료</p></div>
          {recent.length > 0 ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{recent.map(post => <KnowledgeAssetCard key={post.slug} post={post} />)}</div> : <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Knowledge asset가 없습니다.</div>}
        </section>

        <section className="mt-10" aria-labelledby="benchmark-research-heading">
          <div className="mb-4"><h2 id="benchmark-research-heading" className="text-xl font-bold">Benchmark Research</h2><p className="mt-1 text-sm text-muted-foreground">측정 결과가 아니라 Benchmark를 이해하거나 적용하기 위한 조사·도구·방법론입니다.</p></div>
          {benchmarkResearch.length > 0 ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{benchmarkResearch.map(post => <KnowledgeAssetCard key={post.slug} post={post} />)}</div> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Benchmark Research asset가 없습니다.</div>}
        </section>

        {relatedPosts.map(post => <RelatedAssets key={post.slug} links={post.related} title={`${post.title} · Related`} />)}
      </div>
    </div>
  )
}
