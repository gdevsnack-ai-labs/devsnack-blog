import { classifyResearch, type ResearchCategory } from '@/lib/content-taxonomy'
import type { Experiment } from '@/data/experiments'
import {
  getDomainLabel,
  getKeyFinding,
  getLabBoardMetadata,
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
  boardStatus: ReturnType<typeof getLabBoardMetadata>['status']
  statusConfidence: ReturnType<typeof getLabBoardMetadata>['confidence']
  isDummy: boolean
  href: string
  finding?: string
  latestResult?: string
  latestDate?: string
  nextAction?: string
  experiment: Experiment
}

const LAB_COLLECTION_BY_PROJECT: Record<string, Exclude<LabCollectionId, 'showcase'>> = {
  'autonomous-ai-blog': 'experiments',
  'ai-omok': 'experiments',
  'stockpulse-ai-self-improvement': 'experiments',
  'hermes-memory': 'experiments',
  'luna-agentic-game-dev': 'experiments',
  blog: 'builds-systems',
  'music-qa': 'builds-systems',
  hook: 'builds-systems',
  'ai-game-assets-sprite-lab': 'creative-tests',
  'isekai-instagram-mage-experiment': 'creative-tests',
}

const LAB_TYPE_BY_PROJECT: Record<string, LabDisplayType> = {
  'autonomous-ai-blog': 'Experiment',
  'ai-omok': 'Experiment',
  'stockpulse-ai-self-improvement': 'Experiment',
  'hermes-memory': 'Experiment',
  'luna-agentic-game-dev': 'Experiment',
  blog: 'System',
  'music-qa': 'Build',
  hook: 'Build',
  'ai-game-assets-sprite-lab': 'Creative Test',
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
    const board = getLabBoardMetadata(experiment)
    return [{
      id: experiment.id,
      title: experiment.name,
      description: experiment.description,
      collection,
      displayType: LAB_TYPE_BY_PROJECT[experiment.id] || 'Build',
      domain: project.domain,
      projectLifecycle: project.lifecycle,
      boardStatus: board.status,
      statusConfidence: board.confidence,
      isDummy: Boolean(experiment.isDummy),
      href: `/labs/${experiment.id}`,
      finding: getKeyFinding(experiment),
      latestResult: latest?.result,
      latestDate: board.lastActivity,
      nextAction: board.nextAction,
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
  family: string
  measurement: string
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

export interface BenchmarkOverviewMatrixRow {
  model: string
  beforeFirst: string
  afterFirst: string
  beforeEventual: string
  afterEventual: string
  beforeAttempts: string
  afterAttempts: string
  generationSpeed: string
}

export const BENCHMARK_OVERVIEW = {
  protocol: {
    target: 'YouTube Shorts script stage',
    fixtureCount: 2,
    fixtures: ['Science facts', 'History mystery'],
    hardGate: 'Production JSON contract: scenes, word budget, fact_refs, image_prompt, video_prompt, time beats',
    externalLane: 'External LLM one-shot JSON injection; no retry and no validator feedback',
    softQuality: 'Semantic factuality, storytelling, creativity, and visual quality are not included in the hard pass',
  },
  calibration: {
    title: 'Production contract calibration — pure hook `fact_refs`',
    date: '2026.08.24',
    status: 'Corrected',
    summary: 'Prompt와 validator가 순수 hook의 빈 fact_refs를 다르게 해석하던 충돌을 수정했습니다. 첫 장면의 rhetorical/hypothetical hook은 concrete factual claim이 없으면 refs 없이 허용하고, factual hook과 일반 narration은 계속 근거를 요구합니다.',
    external: {
      model: 'Codex Subscription · gpt-5.6-luna',
      firstPass: '1/1',
      note: '첫 hook은 fact_refs=[]로 통과했습니다. 의미 없는 ref를 넣어 validator를 회피하지 않은 calibration 결과입니다.',
    },
    local: [
      { model: 'Ornith Q5_K_M', beforeFirst: '0/2', afterFirst: '0/2', beforeEventual: '2/2', afterEventual: '1/2', beforeAttempts: '4.0', afterAttempts: '3.5', generationSpeed: '67.6 tok/s' },
      { model: 'Ornith Q6_K', beforeFirst: '0/2', afterFirst: '1/2', beforeEventual: '2/2', afterEventual: '2/2', beforeAttempts: '3.0', afterAttempts: '1.5', generationSpeed: '60.9 tok/s' },
      { model: 'Ornith Q8_0', beforeFirst: '0/2', afterFirst: '1/2', beforeEventual: '0/2', afterEventual: '1/2', beforeAttempts: '5.0', afterAttempts: '3.0', generationSpeed: '52.5 tok/s' },
    ] satisfies BenchmarkOverviewMatrixRow[],
    remaining: ['factual/non-hook scene의 refs 누락', '94–120단어 narration budget 변동', 'single repeat 기반의 높은 stochastic variance'],
    limitation: '수정 전후 fresh matrix는 모델당 repeat 1회라 방향성으로만 해석합니다. 동일 candidate 재판정에서는 Q5·Q8의 hook 오류가 실제로 제거됐습니다.',
    projectHref: '/labs/local-llm-benchmark',
  },
} as const

/**
 * Curated published Benchmark assets only. Research records are never
 * promoted here merely because they carry a legacy `benchmark` label.
 */
export const BENCHMARK_PROJECTIONS: BenchmarkProjection[] = [
  {
    asset: assetFromLegacyPost({
      slug: 'ornith15-server-quality-speed-benchmark',
      title: 'Ornith-1.5 서버 품질·실사용 속도 Benchmark — Q5/Q6/Q8 비교',
      blog_id: 'lab',
      status: 'live',
    }),
    title: 'Ornith-1.5 서버 품질·실사용 속도 Benchmark — Q5/Q6/Q8 비교',
    family: 'Ornith-1.5',
    measurement: 'Quality + Real-use Speed',
    categoryIds: ['llm', 'inference', 'hardware'],
    target: 'Ornith-1.5-35B-A3B-MTP Q5_K_M / Q6_K / Q8_0',
    environment: 'DGX Spark GB10 · 121GiB unified memory · llama-server · 64K context',
    method: '모델당 서버를 한 번 로드하고 실제 Science·History production 품질 prompt를 스트리밍 실행; 별도 synthetic speed lane 없이 prompt/generation tok/s·TTFT·MTP acceptance를 함께 측정',
    baseline: '동일한 production validator와 최대 5회 재생성 조건을 모든 모델에 적용',
    result: 'Q5는 64.6 tok/s·5회 내 품질 2/2, Q6은 59.8 tok/s·2/2, Q8은 54.4 tok/s·0/2; 세 모델 모두 OOM·인프라 오류 없음',
    comparison: 'Q5는 속도·용량 균형, Q6은 더 적은 재시도로 수렴, Q8은 가장 큰 파일에도 품질 게이트 우위 미확인',
    interpretation: '실제 긴 대본 요청에서 품질과 속도를 함께 보면 Q5_K_M이 가장 실용적인 첫 후보였고, Q6_K은 품질 우선 후보로 남았다. Q8_0은 현재 structured output 계약과 맞지 않았다.',
    limitations: '모델당 두 fixture·반복 1회, reasoning on/off·MTP off·coding/tool call·사람의 의미 품질 평가는 포함하지 않음',
    contentHref: '/lab/ornith15-server-quality-speed-benchmark',
    projectHref: '/labs/local-llm-benchmark',
    relatedKnowledge: [
      { title: 'Ornith-1.5 GGUF — 공식 양자화와 GB10 실측', href: '/research/ornith-1-5-gguf-gb10' },
      { title: 'Qwen3.6 YouTube 대본 품질 Benchmark', href: '/lab/qwen36-youtube-script-reliability-benchmark' },
      { title: 'Local LLM Benchmark 실험 프로젝트', href: '/labs/local-llm-benchmark' },
    ],
  },
  {
    asset: assetFromLegacyPost({
      slug: 'qwen36-youtube-script-reliability-benchmark',
      title: 'Qwen3.6 YouTube Script Reliability Benchmark — 실제 자동화 대본 생성 재현성 측정',
      blog_id: 'lab',
      status: 'live',
    }),
    title: 'Qwen3.6 YouTube Script Reliability Benchmark — 실제 자동화 대본 생성 재현성 측정',
    family: 'Qwen3.6',
    measurement: 'Quality / Reliability',
    categoryIds: ['llm', 'inference', 'hardware'],
    target: 'Qwen3.6-35B-A3B variants · YouTube Shorts script stage',
    environment: 'DGX Spark GB10 · 121GiB unified memory · llama.cpp llama-cli · 64K context',
    method: 'HQ 기준선과 외장 미디어의 6개 모델을 Science·History fixture당 1회씩 측정; production prompt/validator, 최대 5회 재생성, 각 시도는 llama-cli --single-turn',
    baseline: '실제 production 기준 대본 2개 모두 validator 통과',
    result: '추가 6종 품질 벤치: 12회 fixture 실행에서 1차 통과 2/12 (16.7%), 5회 내 최종 통과 9/12 (75%), 평균 3.1회; 기존 HQ 기준선 4회는 1차 50%, 최종 75%',
    comparison: 'NVFP4 TURBO·Q8_0·Qwopus Balanced/Quality는 최종 100%, APEX Balanced는 50%, UD-Q6_K_XL은 0%; 모델당 2 fixture라 방향성 비교로 해석',
    interpretation: '재시도 포함 production 품질 게이트에서는 NVFP4 TURBO가 가장 적은 시도로 안정적이었고, UD-Q6_K_XL은 두 프로필 모두 5회 안에 수렴하지 못했으며 Q8_0은 크기에 비해 첫 시도 통과가 없었음',
    limitations: '고정 fixture 2개와 모델당 1회 반복, 단일 모델 계열·양자화·MTP 설정이며 사람의 의미 품질 평가와 downstream 이미지/영상 품질은 포함하지 않음',
    contentHref: '/lab/qwen36-youtube-script-reliability-benchmark',
    projectHref: '/labs/local-llm-benchmark',
    relatedKnowledge: [
      { title: 'Qwen3.8-27B NVFP4 MTP — GB10 로컬 테스트', href: '/research/qwen3-8-27b-nvfp4-mtp-gguf-gb10' },
      { title: 'Local LLM Benchmark 실험 프로젝트', href: '/labs/local-llm-benchmark' },
    ],
  },
  {
    asset: assetFromLegacyPost({
      slug: 'local-llm-benchmark-report',
      title: 'Local LLM Benchmark — Qwen3.8-27B Ridge 3.7bpw 실측 리포트',
      blog_id: 'lab',
      status: 'live',
    }),
    title: 'Local LLM Benchmark — Qwen3.8-27B Ridge 3.7bpw 실측 리포트',
    family: 'Qwen3.8',
    measurement: 'Serving / Speed',
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

export interface ReclassifiedArticleInput extends LegacyPostLike {
  excerpt?: string | null
  published: string
  updated?: string | null
  cover_image?: string | null
}

export interface LegacyBenchmarkProjection {
  asset: AssetRef
  slug: string
  title: string
  excerpt: string
  published: string
  href: string
  projectHref?: string
}

export function projectLegacyBenchmarkPost(post: ReclassifiedArticleInput): LegacyBenchmarkProjection {
  const asset = assetFromLegacyPost(post)
  return {
    asset,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || '측정 조건과 결과를 원문에서 확인할 수 있는 DevSnack Benchmark source article입니다.',
    published: post.published,
    href: asset.route,
    projectHref: asset.projectId ? `/labs/${asset.projectId}` : undefined,
  }
}

export function projectLegacyBenchmarkPosts(posts: ReclassifiedArticleInput[]): LegacyBenchmarkProjection[] {
  return posts.map(projectLegacyBenchmarkPost)
}

export interface LegacyLabProjection {
  asset: AssetRef
  slug: string
  title: string
  excerpt: string
  published: string
  href: string
  projectHref?: string
}

export function projectLegacyLabPost(post: ReclassifiedArticleInput): LegacyLabProjection {
  const asset = assetFromLegacyPost(post)
  return {
    asset,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || '실험 과정과 결과를 원문에서 확인할 수 있는 DevSnack Lab source article입니다.',
    published: post.published,
    href: asset.route,
    projectHref: asset.projectId ? `/labs/${asset.projectId}` : undefined,
  }
}

export function projectLegacyLabPosts(posts: ReclassifiedArticleInput[]): LegacyLabProjection[] {
  return posts.map(projectLegacyLabPost)
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
  href: string
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

function getKnowledgeDomainFromAsset(asset: AssetRef): KnowledgeDomain {
  const domains = asset.domain || []
  if (domains.includes('agent_memory')) return 'agent-memory'
  if (domains.includes('media') || domains.includes('creative_ai')) return 'media'
  if (domains.includes('infrastructure') || domains.includes('automation')) return 'infrastructure'
  if (domains.includes('hardware')) return 'hardware'
  if (domains.includes('llm') || domains.includes('inference')) return 'ai-llm'
  return 'other'
}

export function projectKnowledgePost(post: KnowledgePostInput): KnowledgeProjection {
  const classification = classifyResearch(post.labels)
  const asset = assetFromLegacyPost(post)
  const domain = post.blog_id === 'devsnack'
    ? getKnowledgeDomainFromAsset(asset)
    : getKnowledgeDomain(post.slug, classification.category)
  return {
    asset,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || '요약이 아직 정리되지 않은 Knowledge 항목입니다.',
    published: post.published,
    updated: post.updated,
    href: asset.route,
    domain,
    domainLabel: KNOWLEDGE_DOMAIN_LABEL[domain],
    benchmarkResearch: post.blog_id === 'research' && classification.category === 'benchmark',
    statusLabel: post.blog_id === 'devsnack' ? '원문 Article' : classification.status,
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
  'post:lab:ornith15-server-quality-speed-benchmark': 'Ornith-1.5 서버 품질·실사용 속도 Benchmark',
  'post:lab:qwen36-youtube-script-reliability-benchmark': 'Qwen3.6 YouTube Script Reliability Benchmark',
  'post:devsnack:ai-llm-omok-experiment': 'AI Omok 실험 이야기',
  'post:devsnack:ai-built-gomoku-engine-vs-rapfi': 'AI가 만든 Gomoku 엔진 이야기',
  'post:lab:stockpulse-self-2026-08-21': 'StockPulse 자기개선 실험 — 2026-08-21',
  'post:lab:isekai-instagram-mage-prologue': 'GPT Image 2 + LTX 2.5 숏 무비 실험',
  'post:lab:hermes-memory-experiment': 'Hermes Memory Experiment — Phase 1',
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
      kind: blogId === 'research' ? 'knowledge' : blogId === 'devsnack' ? 'story' : blogId === 'lab' && (slug === 'local-llm-benchmark-report' || slug === 'qwen36-youtube-script-reliability-benchmark' || slug === 'ornith15-server-quality-speed-benchmark') ? 'benchmark' : blogId === 'lab' ? 'experiment' : 'knowledge',
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

/** Returns explicitly registered relations pointing into a target asset/project. */
export function getIncomingRelatedAssets(targetId: string): RelatedAssetLink[] {
  return ASSET_RELATIONS
    .filter(relation => relation.to === targetId)
    .map(relation => endpointToRelatedLink(relation.from, relation.relation))
    .filter((link): link is RelatedAssetLink => Boolean(link))
}

export function getRelatedFindingCount(experiments: Experiment[]): number {
  return getRecentFindings(experiments.filter(experiment => experiment.id !== 'local-llm-benchmark')).length
}

export function projectRefForAsset(asset: AssetRef): string {
  return asset.projectId ? projectRef(asset.projectId) : asset.assetId
}

export { getDomainLabel }
