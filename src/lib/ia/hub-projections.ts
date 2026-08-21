import { classifyResearch, type ResearchCategory } from '@/lib/content-taxonomy'
import type { Experiment } from '@/data/experiments'
import {
  getDomainLabel,
  getKeyFinding,
  getLatestResult,
  getRecentFindings,
} from '@/lib/labs'
import {
  ASSET_RELATIONS,
  CURATED_FINDING_ASSETS,
  DEMO_ASSETS,
  PROJECT_CATALOG,
  assetFromLegacyPost,
  projectRef,
  type AssetRef,
  type Domain,
  type LegacyPostLike,
  type PrimaryType,
  type RelationType,
} from '@/lib/ia'
import { postHref } from '@/config/site-catalog'

export type LabCollectionId = 'experiments' | 'builds-systems' | 'creative-tests' | 'showcase'
export type LabDisplayType = 'Experiment' | 'Build' | 'System' | 'Creative Test'

export interface LabProjectProjection {
  id: string
  title: string
  description: string
  collection: Exclude<LabCollectionId, 'showcase'>
  displayType: LabDisplayType
  domain: Domain[]
  projectLifecycle: string
  isDummy: boolean
  href: string
  finding?: string
  latestResult?: string
  latestDate?: string
  experiment: Experiment
}

const LAB_COLLECTION_BY_PROJECT: Record<string, Exclude<LabCollectionId, 'showcase'>> = {
  'ai-omok': 'experiments',
  'stockpulse-ai-self-improvement': 'experiments',
  blog: 'builds-systems',
  'music-qa': 'builds-systems',
  hook: 'builds-systems',
  'isekai-instagram-mage-experiment': 'creative-tests',
}

const LAB_TYPE_BY_PROJECT: Record<string, LabDisplayType> = {
  'ai-omok': 'Experiment',
  'stockpulse-ai-self-improvement': 'Experiment',
  blog: 'System',
  'music-qa': 'Build',
  hook: 'Build',
  'isekai-instagram-mage-experiment': 'Creative Test',
}

export function getLabCollection(projectId: string): LabCollectionId | undefined {
  if (projectId === 'local-llm-benchmark') return undefined
  return LAB_COLLECTION_BY_PROJECT[projectId]
}

export function getLabProjectProjections(experiments: Experiment[]): LabProjectProjection[] {
  return experiments.flatMap(experiment => {
    const collection = LAB_COLLECTION_BY_PROJECT[experiment.id]
    const project = PROJECT_CATALOG.find(item => item.id === experiment.id)
    if (!collection || !project) return []
    const latest = getLatestResult(experiment)
    return [{
      id: experiment.id,
      title: experiment.name,
      description: experiment.description,
      collection,
      displayType: LAB_TYPE_BY_PROJECT[experiment.id] || 'Build',
      domain: project.domain,
      projectLifecycle: project.lifecycle,
      isDummy: Boolean(experiment.isDummy),
      href: `/labs/${experiment.id}`,
      finding: getKeyFinding(experiment),
      latestResult: latest?.result,
      latestDate: latest?.date,
      experiment,
    }]
  })
}

export function getLabCollectionProjects(
  experiments: Experiment[],
  collection: Exclude<LabCollectionId, 'showcase'>,
): LabProjectProjection[] {
  return getLabProjectProjections(experiments).filter(project => project.collection === collection)
}

export interface BenchmarkProjection {
  asset: AssetRef
  title: string
  categoryIds: Array<'llm' | 'inference' | 'hardware' | 'generative-ai'>
  target: string
  environment: string
  method: string
  baseline: string
  result: string
  comparison: string
  interpretation: string
  limitations: string
  contentHref: string
  projectHref: string
  relatedKnowledge: Array<{ title: string; href: string }>
}

/**
 * Curated published Benchmark assets only. Research records are never
 * promoted here merely because they carry a legacy `benchmark` label.
 */
export const BENCHMARK_PROJECTIONS: BenchmarkProjection[] = [
  {
    asset: assetFromLegacyPost({
      slug: 'local-llm-benchmark-report',
      title: 'Local LLM Benchmark — Qwen3.8-27B Ridge 3.7bpw 실측 리포트',
      blog_id: 'lab',
      status: 'live',
    }),
    title: 'Local LLM Benchmark — Qwen3.8-27B Ridge 3.7bpw 실측 리포트',
    categoryIds: ['llm', 'inference'],
    target: 'Qwen3.8-27B Ridge 3.7bpw',
    environment: 'NVIDIA DGX Spark GB10 · 128GB unified memory',
    method: 'HIGH / VERY-HIGH, thinking ON / OFF, MTP n-max 6·p-min 0.75, 단일 실행과 4-slot 장기 서빙 측정',
    baseline: '동일 환경의 독립 baseline 모델 비교는 이 리포트에 기록되어 있지 않음',
    result: '단일 실행 prefill 680~930 t/s, decode 17~19.5 t/s, MTP acceptance 93.1%; 4-slot 장문 서빙 18~22 t/s, 평균 acceptance 약 94%',
    comparison: '실행 모드와 단일 프롬프트 산출물(Ragdoll Playground·Stock Dashboard·HTML in Canvas)을 함께 비교',
    interpretation: 'GB10에서 27B급 로컬 모델을 단순 속도뿐 아니라 동시 서빙과 실제 산출물까지 포함해 판단할 수 있는 측정 결과',
    limitations: '모델·양자화·프롬프트·동시성 조건이 제한되어 있으며, 독립 baseline과 품질 평가 데이터는 추가되어야 함',
    contentHref: '/lab/local-llm-benchmark-report',
    projectHref: '/labs/local-llm-benchmark',
    relatedKnowledge: [
      { title: 'Qwen3.8-27B NVFP4 MTP — GB10 로컬 테스트', href: '/research/qwen3-8-27b-nvfp4-mtp-gguf-gb10' },
      { title: 'DFlash 2 + Qwen3.8-27B 비교 조사', href: '/research/dflash-2-qwen3-8-27b-vs-mtp' },
    ],
  },
]

export function getBenchmarksByCategory(category: BenchmarkProjection['categoryIds'][number]): BenchmarkProjection[] {
  return BENCHMARK_PROJECTIONS.filter(benchmark => benchmark.categoryIds.includes(category))
}

export interface KnowledgePostInput extends LegacyPostLike {
  excerpt?: string | null
  published: string
  updated?: string | null
  labels: readonly string[]
}

export type KnowledgeDomain = 'ai-llm' | 'agent-memory' | 'media' | 'infrastructure' | 'hardware' | 'other'

export interface KnowledgeProjection {
  asset: AssetRef
  slug: string
  title: string
  excerpt: string
  published: string
  updated?: string | null
  domain: KnowledgeDomain
  domainLabel: string
  benchmarkResearch: boolean
  statusLabel: string
  related: RelatedAssetLink[]
}

export const KNOWLEDGE_DOMAIN_LABEL: Record<KnowledgeDomain, string> = {
  'ai-llm': 'AI / LLM',
  'agent-memory': 'Agent / Memory',
  media: 'Image / Video / Audio',
  infrastructure: 'Infrastructure',
  hardware: 'Hardware',
  other: 'Other',
}

const AGENT_MEMORY_HINTS = ['hindsight', 'memory', 'herdr', 'agent', 'harness', 'karakeep', 'wiki-embedding']
const INFRASTRUCTURE_HINTS = ['html-in-canvas', 'throughput', 'draftbench', 'tool-eval', 'tokenchaser', 'scrapling']

function includesHint(slug: string, hints: string[]): boolean {
  return hints.some(hint => slug.includes(hint))
}

function getKnowledgeDomain(slug: string, category: ResearchCategory): KnowledgeDomain {
  if (category === 'llm') return 'ai-llm'
  if (category === 'tts' || category === 'media') return 'media'
  if (includesHint(slug, AGENT_MEMORY_HINTS)) return 'agent-memory'
  if (includesHint(slug, INFRASTRUCTURE_HINTS)) return 'infrastructure'
  if (category === 'hardware') return 'hardware'
  return 'other'
}

export function projectKnowledgePost(post: KnowledgePostInput): KnowledgeProjection {
  const classification = classifyResearch(post.labels)
  const domain = getKnowledgeDomain(post.slug, classification.category)
  const asset = assetFromLegacyPost(post)
  return {
    asset,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || '요약이 아직 정리되지 않은 Knowledge 항목입니다.',
    published: post.published,
    updated: post.updated,
    domain,
    domainLabel: KNOWLEDGE_DOMAIN_LABEL[domain],
    benchmarkResearch: classification.category === 'benchmark',
    statusLabel: classification.status,
    related: getRelatedAssets(asset.assetId),
  }
}

export function projectKnowledgePosts(posts: KnowledgePostInput[]): KnowledgeProjection[] {
  return posts.map(projectKnowledgePost)
}

export function getKnowledgeDomainCounts(posts: KnowledgeProjection[]): Record<KnowledgeDomain, number> {
  const counts = Object.fromEntries(Object.keys(KNOWLEDGE_DOMAIN_LABEL).map(key => [key, 0])) as Record<KnowledgeDomain, number>
  for (const post of posts) counts[post.domain] += 1
  return counts
}

export interface RelatedAssetLink {
  assetId: string
  relation: RelationType
  relationLabel: string
  title: string
  href: string
  kind: PrimaryType | 'project' | 'finding'
}

const KNOWN_POST_TITLES: Record<string, string> = {
  'post:research:qwen3-8-27b-nvfp4-mtp-gguf-gb10': 'Qwen3.8-27B NVFP4 MTP — GB10 로컬 테스트',
  'post:research:dflash-2-qwen3-8-27b-vs-mtp': 'DFlash 2 + Qwen3.8-27B 비교 조사',
  'post:lab:local-llm-benchmark-report': 'Local LLM Benchmark 실측 리포트',
  'post:devsnack:ai-llm-omok-experiment': 'AI Omok 실험 이야기',
  'post:devsnack:ai-built-gomoku-engine-vs-rapfi': 'AI가 만든 Gomoku 엔진 이야기',
  'post:lab:stockpulse-self-2026-08-21': 'StockPulse 자기개선 실험 — 2026-08-21',
  'post:lab:isekai-instagram-mage-prologue': 'GPT Image 2 + LTX 2.5 숏 무비 실험',
}

const RELATION_LABEL: Record<RelationType, string> = {
  informs: 'informs',
  measures: 'measures',
  produces: 'produces',
  published_as: 'published as',
  implemented_in: 'implemented in',
  derived_from: 'derived from',
  supports: 'supports',
  outputs: 'outputs',
}

function endpointToRelatedLink(endpoint: string, relation: RelationType): RelatedAssetLink | null {
  if (endpoint.startsWith('project:')) {
    const projectId = endpoint.slice('project:'.length)
    const project = PROJECT_CATALOG.find(item => item.id === projectId)
    if (!project) return null
    return {
      assetId: endpoint,
      relation,
      relationLabel: RELATION_LABEL[relation],
      title: project.title,
      href: `/labs/${projectId}`,
      kind: 'project',
    }
  }

  if (endpoint.startsWith('finding:')) {
    const projectId = endpoint.split(':')[1]
    const finding = CURATED_FINDING_ASSETS.find(asset => asset.assetId === endpoint)
    if (!finding || !projectId) return null
    return {
      assetId: endpoint,
      relation,
      relationLabel: RELATION_LABEL[relation],
      title: finding.title || 'Finding',
      href: finding.route,
      kind: 'finding',
    }
  }

  if (endpoint.startsWith('demo:')) {
    const demo = DEMO_ASSETS.find(asset => asset.assetId === endpoint)
    if (!demo) return null
    return {
      assetId: endpoint,
      relation,
      relationLabel: RELATION_LABEL[relation],
      title: demo.title || 'Showcase',
      href: demo.route,
      kind: 'showcase',
    }
  }

  if (endpoint.startsWith('post:')) {
    const [, blogId, slug] = endpoint.split(':')
    const href = blogId && slug ? postHref(blogId, slug) : null
    if (!href) return null
    return {
      assetId: endpoint,
      relation,
      relationLabel: RELATION_LABEL[relation],
      title: KNOWN_POST_TITLES[endpoint] || `${blogId} content`,
      href,
      kind: blogId === 'research' ? 'knowledge' : blogId === 'devsnack' ? 'story' : blogId === 'lab' ? 'experiment' : 'knowledge',
    }
  }

  return null
}

/** Returns only explicitly registered outgoing relations. */
export function getRelatedAssets(sourceId: string): RelatedAssetLink[] {
  return ASSET_RELATIONS
    .filter(relation => relation.from === sourceId)
    .map(relation => endpointToRelatedLink(relation.to, relation.relation))
    .filter((link): link is RelatedAssetLink => Boolean(link))
}

export function getRelatedFindingCount(experiments: Experiment[]): number {
  return getRecentFindings(experiments.filter(experiment => experiment.id !== 'local-llm-benchmark')).length
}

export function projectRefForAsset(asset: AssetRef): string {
  return asset.projectId ? projectRef(asset.projectId) : asset.assetId
}

export { getDomainLabel }
