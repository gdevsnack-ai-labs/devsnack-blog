import type { Experiment } from '@/data/experiments'
import type { PublicBenchmarkRelease } from '@/lib/benchmarks/public-release'
import type { DataHubSnapshot, StoryPostInput } from '@/lib/ia/hub-data'
import {
  BENCHMARK_PROJECTIONS,
  getIncomingRelatedAssets,
  getLabProjectProjections,
  getRelatedAssets,
  type BenchmarkProjection,
  type KnowledgeProjection,
  type LabProjectProjection,
  type RelatedAssetLink,
} from '@/lib/ia/hub-projections'
import { assetFromLegacyPost, projectRef, type AssetRef } from '@/lib/ia'
import { getProjectFinding, getRecentFindings } from '@/lib/labs'

export const HOME_CURATED_OVERRIDES = {
  featured: {
    aiOmokProjectId: 'ai-omok',
    benchmarkAssetId: 'post:lab:qwen36-youtube-script-reliability-benchmark',
    knowledgeAssetId: 'post:research:qwen3-8-27b-nvfp4-mtp-gguf-gb10',
  },
  knowledge: 'post:research:qwen3-8-27b-nvfp4-mtp-gguf-gb10',
} as const

export interface HomeStoryProjection {
  asset: AssetRef
  slug: string
  title: string
  excerpt: string
  published: string
  coverImage: string | null
  href: string
}

export interface HomeFeaturedItem {
  kind: 'finding' | 'benchmark' | 'knowledge'
  eyebrow: string
  title: string
  summary: string
  href: string
  related?: RelatedAssetLink
  benchmark?: BenchmarkProjection
  project?: LabProjectProjection
  knowledge?: KnowledgeProjection
}

export interface HomeDataService {
  title: string
  type: 'Feed' | 'Tracker'
  href: string
  description: string
  status?: string
  updated?: string
}

export interface HomePublishedBenchmarkProjection {
  title: string
  target: string
  environment: string
  result: string
  comparison: string
  contentHref: string
  jsonHref: string
}

export interface HomeProjection {
  featured: HomeFeaturedItem[]
  labFinding: LabProjectProjection | undefined
  labItems: LabProjectProjection[]
  benchmark: HomePublishedBenchmarkProjection | undefined
  knowledge: KnowledgeProjection[]
  dataServices: HomeDataService[]
  stories: HomeStoryProjection[]
}

function compactText(value: string, limit = 180): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length > limit ? `${normalized.slice(0, limit - 1)}…` : normalized
}

function formatDate(value?: string | null): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function projectHomeStory(post: StoryPostInput): HomeStoryProjection {
  return {
    asset: assetFromLegacyPost(post),
    slug: post.slug,
    title: post.title,
    excerpt: compactText(post.excerpt || '직접 조사하고 만든 결과를 기록한 DevSnack Story입니다.', 150),
    published: post.published,
    coverImage: post.cover_image || null,
    href: `/devsnack/${post.slug}`,
  }
}

export function selectHomeStories(posts: StoryPostInput[], limit = 3): HomeStoryProjection[] {
  return posts.slice(0, limit).map(projectHomeStory)
}

export function selectHomeKnowledge(posts: KnowledgeProjection[], limit = 2): KnowledgeProjection[] {
  const curated = posts.find(post => post.asset.assetId === HOME_CURATED_OVERRIDES.knowledge)
  const ordered = curated ? [curated, ...posts.filter(post => post !== curated)] : posts
  return ordered.slice(0, limit)
}

function toFindingProjection(project: LabProjectProjection, eyebrow = 'Lab · Finding'): HomeFeaturedItem {
  const related = getRelatedAssets(projectRef(project.id)).find(link => link.kind === 'story' || link.kind === 'showcase')
  return {
    kind: 'finding',
    eyebrow,
    title: project.title,
    summary: compactText(getProjectFinding(project.experiment)?.statement || '아직 독립적인 Project Finding이 없습니다.'),
    href: project.href,
    related,
    project,
  }
}

function toBenchmarkProjection(benchmark: BenchmarkProjection): HomeFeaturedItem {
  const related = getIncomingRelatedAssets(benchmark.asset.assetId).find(link => link.kind === 'knowledge')
  return {
    kind: 'benchmark',
    eyebrow: 'Benchmark · Published Result',
    title: benchmark.title,
    summary: compactText(benchmark.result, 170),
    href: benchmark.contentHref,
    related,
    benchmark,
  }
}

function toKnowledgeProjection(post: KnowledgeProjection): HomeFeaturedItem {
  return {
    kind: 'knowledge',
    eyebrow: `Knowledge · ${post.domainLabel}`,
    title: post.title,
    summary: compactText(post.excerpt, 170),
    href: post.href,
    related: post.related[0],
    knowledge: post,
  }
}

export function projectHomeDataServices(snapshot: DataHubSnapshot): HomeDataService[] {
  const services: HomeDataService[] = []
  if (snapshot.aiTech) {
    services.push({
      title: 'AI Tech',
      type: 'Feed',
      href: '/aitech',
      description: 'Automated AI news feed',
      status: snapshot.aiTech.title,
      updated: formatDate(snapshot.aiTech.updated || snapshot.aiTech.published),
    })
  }
  services.push({
    title: 'StockPulse',
    type: 'Feed',
    href: '/stock',
    description: 'Automated market analysis',
    status: snapshot.stockPulse?.title,
    updated: formatDate(snapshot.stockPulse?.updated || snapshot.stockPulse?.published),
  })
  return services
}

export function projectHomePublishedBenchmark(release: PublicBenchmarkRelease): HomePublishedBenchmarkProjection {
  const { scope } = release
  const reasoning = scope.reasoning_mode.toUpperCase()
  return {
    title: 'DGX Spark GB10 — 18개 GGUF 모델 통합 Benchmark',
    target: `${scope.model_variant_count} variants · ${scope.suite_count} suites · ${release.generated_at}`,
    environment: `${scope.hardware} · ${scope.runtime} · reasoning ${reasoning}`,
    result: `${scope.revalidated_evaluator_runs}개 evaluator run과 ${scope.reused_source_runs}개 검증된 source run을 합친 고정 public release입니다.`,
    comparison: `Performance·Server·Knowledge·Coding·Tool-call·Agent 결과를 같은 GB10 기준으로 비교하며 raw run은 공개하지 않습니다.`,
    contentHref: `/benchmarks/${release.release_id}`,
    jsonHref: `/data/benchmarks/${release.release_id}.json`,
  }
}

export function createHomeProjection({
  experiments,
  knowledge,
  stories,
  data,
  publicBenchmark,
}: {
  experiments: Experiment[]
  knowledge: KnowledgeProjection[]
  stories: StoryPostInput[]
  data: DataHubSnapshot
  publicBenchmark: PublicBenchmarkRelease
}): HomeProjection {
  const labProjects = getLabProjectProjections(experiments)
  const recentFindingProjects = getRecentFindings(experiments.filter(experiment => experiment.id !== 'local-llm-benchmark'), 3)
    .map(experiment => labProjects.find(project => project.id === experiment.id))
    .filter((project): project is LabProjectProjection => Boolean(project))
  const labFinding = recentFindingProjects[0]
  const labItems = recentFindingProjects.slice(1, 3)
  const benchmark = projectHomePublishedBenchmark(publicBenchmark)
  const recentKnowledge = selectHomeKnowledge(knowledge, 2)
  const curatedAiOmok = labProjects.find(project => project.id === HOME_CURATED_OVERRIDES.featured.aiOmokProjectId)
  const curatedBenchmark = BENCHMARK_PROJECTIONS.find(item => item.asset.assetId === HOME_CURATED_OVERRIDES.featured.benchmarkAssetId)
  const curatedKnowledge = knowledge.find(post => post.asset.assetId === HOME_CURATED_OVERRIDES.featured.knowledgeAssetId) || recentKnowledge[0]
  const featured = [
    ...(curatedAiOmok ? [toFindingProjection(curatedAiOmok, 'Lab · Featured Finding')] : []),
    ...(curatedBenchmark ? [toBenchmarkProjection(curatedBenchmark)] : []),
    ...(curatedKnowledge ? [toKnowledgeProjection(curatedKnowledge)] : []),
  ]

  return {
    featured,
    labFinding,
    labItems,
    benchmark,
    knowledge: recentKnowledge,
    dataServices: projectHomeDataServices(data),
    stories: selectHomeStories(stories, 3),
  }
}
