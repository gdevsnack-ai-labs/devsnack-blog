import { DEMO_CATEGORIES, DEMOS, type Demo, type DemoCategory } from '../../data/demos'
import { postHref } from '../../config/site-catalog'
import type {
  AssetLifecycle,
  AssetRef,
  AssetRole,
  Classification,
  Domain,
  LegacyPostLike,
  PrimaryType,
  Provenance,
} from './types'

type PostClassification = {
  primaryType: PrimaryType
  role?: AssetRole
  projectId?: string
  domain: Domain[]
  provenance: Provenance
  classification: Classification
  routeOverride?: string
}

const POST_DEFAULTS: Record<string, PostClassification> = {
  devsnack: {
    primaryType: 'story',
    domain: ['llm'],
    provenance: 'ai_assisted',
    classification: 'inferred',
  },
  aitech: {
    primaryType: 'feed',
    domain: ['llm'],
    provenance: 'automated',
    classification: 'confirmed',
  },
  stockpulse: {
    primaryType: 'feed',
    domain: ['finance'],
    provenance: 'automated',
    classification: 'confirmed',
  },
  research: {
    primaryType: 'knowledge',
    domain: ['other'],
    provenance: 'ai_assisted',
    classification: 'inferred',
  },
  lab: {
    primaryType: 'experiment',
    role: 'run',
    domain: ['automation'],
    provenance: 'automated',
    classification: 'ambiguous',
  },
  realestate: {
    primaryType: 'tracker',
    domain: ['real_estate'],
    provenance: 'data_generated',
    classification: 'confirmed',
  },
  misc: {
    primaryType: 'knowledge',
    domain: ['other'],
    provenance: 'ai_assisted',
    classification: 'ambiguous',
  },
}

function postKey(post: Pick<LegacyPostLike, 'blog_id' | 'slug'>): string {
  return `${post.blog_id}:${post.slug}`
}

function postAssetId(post: Pick<LegacyPostLike, 'blog_id' | 'slug'>): string {
  return `post:${post.blog_id}:${post.slug}`
}

const POST_OVERRIDES: Record<string, Partial<PostClassification>> = {
  'lab:local-llm-benchmark-report': {
    primaryType: 'benchmark',
    role: 'report',
    projectId: 'local-llm-benchmark',
    domain: ['llm', 'inference', 'hardware'],
    provenance: 'ai_assisted',
    classification: 'confirmed',
  },
  'lab:qwen36-youtube-script-reliability-benchmark': {
    primaryType: 'benchmark',
    role: 'report',
    projectId: 'local-llm-benchmark',
    domain: ['llm', 'inference', 'automation'],
    provenance: 'ai_assisted',
    classification: 'confirmed',
  },
  'lab:isekai-instagram-mage-prologue': {
    primaryType: 'creative_test',
    role: 'report',
    projectId: 'isekai-instagram-mage-experiment',
    domain: ['creative_ai', 'media'],
    provenance: 'ai_assisted',
    classification: 'confirmed',
  },
  'lab:hermes-memory-experiment': {
    primaryType: 'experiment',
    role: 'report',
    projectId: 'hermes-memory',
    domain: ['agent_memory', 'automation'],
    provenance: 'ai_assisted',
    classification: 'confirmed',
  },
  'misc:mining-leaderboard': {
    primaryType: 'tracker',
    projectId: undefined,
    domain: ['hardware'],
    provenance: 'data_generated',
    classification: 'confirmed',
    routeOverride: '/misc/mining-leaderboard',
  },
}

function classifyLabPost(slug: string): Partial<PostClassification> {
  if (slug.startsWith('stockpulse-self-')) {
    return {
      primaryType: 'experiment',
      role: 'run',
      projectId: 'stockpulse-ai-self-improvement',
      domain: ['finance', 'automation'],
      provenance: 'automated',
      classification: 'confirmed',
    }
  }
  if (slug === 'luna-agentic-game-dev') {
    return {
      primaryType: 'experiment',
      role: 'report',
      projectId: 'luna-agentic-game-dev',
      domain: ['infrastructure', 'automation', 'llm'],
      provenance: 'ai_assisted',
      classification: 'confirmed',
    }
  }
  return {}
}

function classifyPost(post: LegacyPostLike): PostClassification | undefined {
  const defaults = POST_DEFAULTS[post.blog_id]
  if (!defaults) return undefined
  return {
    ...defaults,
    ...(post.blog_id === 'lab' ? classifyLabPost(post.slug) : {}),
    ...(POST_OVERRIDES[postKey(post)] || {}),
  }
}

function lifecycleFromStatus(status?: string | null): AssetLifecycle {
  if (status === 'draft') return 'draft'
  if (status === 'live') return 'active'
  return 'archived'
}

/** Convert one legacy posts row into a semantic Asset reference. */
export function assetFromLegacyPost(post: LegacyPostLike): AssetRef {
  const classification = classifyPost(post)
  const route = classification?.routeOverride ?? postHref(post.blog_id, post.slug) ?? ''
  return {
    assetId: postAssetId(post),
    route,
    title: post.title,
    primaryType: classification?.primaryType || 'knowledge',
    role: classification?.role,
    projectId: classification?.projectId,
    domain: classification?.domain || ['other'],
    provenance: classification?.provenance,
    lifecycle: lifecycleFromStatus(post.status),
    source: post.blog_id === 'research' ? 'research' : post.blog_id === 'misc' ? 'misc' : 'post',
    classification: classification?.classification || 'ambiguous',
  }
}

function demoDomain(category: DemoCategory): Domain[] {
  if (category === 'html') return ['web']
  return ['creative_ai', 'media']
}

const DEMO_PROJECTS: Record<string, string | undefined> = {
  'ragdoll-playground-qwen3.8': 'local-llm-benchmark',
  'stock-dashboard-qwen3.8': 'local-llm-benchmark',
  'html-in-canvas': 'local-llm-benchmark',
  'ai-game-assets-sprite-lab': 'ai-game-assets-sprite-lab',
  'hero-intro-30s': undefined,
  'isekai-instagram-mage-prologue': 'isekai-instagram-mage-experiment',
}

function demoAsset(category: DemoCategory, demo: Demo): AssetRef {
  return {
    assetId: `demo:${category}:${demo.id}`,
    route: `/demos/${category}`,
    title: demo.title,
    primaryType: 'showcase',
    role: 'artifact',
    projectId: DEMO_PROJECTS[demo.id],
    domain: demoDomain(category),
    provenance: 'ai_generated',
    lifecycle: 'completed',
    source: 'demo',
    classification: 'confirmed',
    artifactHref: demo.href,
  }
}

export const DEMO_ASSETS: AssetRef[] = DEMO_CATEGORIES.flatMap(category =>
  DEMOS[category.key].map(demo => demoAsset(category.key, demo)),
)

/** Curated findings are Knowledge assets with a finding role, not a new Type. */
export const CURATED_FINDING_ASSETS: AssetRef[] = [
  {
    assetId: 'finding:autonomous-ai-blog:key',
    route: '/labs/autonomous-ai-blog',
    title: 'Autonomous AI Blog key finding',
    primaryType: 'knowledge',
    role: 'finding',
    projectId: 'autonomous-ai-blog',
    domain: ['automation', 'infrastructure'],
    provenance: 'automated',
    lifecycle: 'active',
    source: 'manual',
    classification: 'confirmed',
  },
  {
    assetId: 'finding:ai-omok:key',
    route: '/labs/ai-omok',
    title: 'AI Omok key finding',
    primaryType: 'knowledge',
    role: 'finding',
    projectId: 'ai-omok',
    domain: ['game_ai'],
    provenance: 'ai_assisted',
    lifecycle: 'active',
    source: 'manual',
    classification: 'confirmed',
  },
  {
    assetId: 'finding:stockpulse-ai-self-improvement:key',
    route: '/labs/stockpulse-ai-self-improvement',
    title: 'StockPulse self-improvement key finding',
    primaryType: 'knowledge',
    role: 'finding',
    projectId: 'stockpulse-ai-self-improvement',
    domain: ['finance', 'automation'],
    provenance: 'automated',
    lifecycle: 'active',
    source: 'manual',
    classification: 'confirmed',
  },
  {
    assetId: 'finding:local-llm-benchmark:key',
    route: '/labs/local-llm-benchmark',
    title: 'Local LLM Benchmark key finding',
    primaryType: 'knowledge',
    role: 'finding',
    projectId: 'local-llm-benchmark',
    domain: ['llm', 'inference', 'hardware'],
    provenance: 'ai_assisted',
    lifecycle: 'active',
    source: 'manual',
    classification: 'confirmed',
  },
  {
    assetId: 'finding:isekai-instagram-mage-experiment:key',
    route: '/labs/isekai-instagram-mage-experiment',
    title: 'Isekai creative test key finding',
    primaryType: 'knowledge',
    role: 'finding',
    projectId: 'isekai-instagram-mage-experiment',
    domain: ['creative_ai', 'media'],
    provenance: 'ai_assisted',
    lifecycle: 'completed',
    source: 'manual',
    classification: 'confirmed',
  },
  {
    assetId: 'finding:hermes-memory:key',
    route: '/labs/hermes-memory',
    title: 'Hermes Memory Experiment key finding',
    primaryType: 'knowledge',
    role: 'finding',
    projectId: 'hermes-memory',
    domain: ['agent_memory', 'automation'],
    provenance: 'ai_assisted',
    lifecycle: 'active',
    source: 'manual',
    classification: 'confirmed',
  },
  {
    assetId: 'finding:luna-agentic-game-dev:key',
    route: '/labs/luna-agentic-game-dev',
    title: 'Luna Agentic Game Development Lab key finding',
    primaryType: 'knowledge',
    role: 'finding',
    projectId: 'luna-agentic-game-dev',
    domain: ['infrastructure', 'automation', 'llm'],
    provenance: 'ai_assisted',
    lifecycle: 'active',
    source: 'manual',
    classification: 'confirmed',
  },
  {
    assetId: 'finding:ai-game-assets-sprite-lab:key',
    route: '/labs/ai-game-assets-sprite-lab',
    title: 'AI Game Assets key finding',
    primaryType: 'knowledge',
    role: 'finding',
    projectId: 'ai-game-assets-sprite-lab',
    domain: ['creative_ai', 'media'],
    provenance: 'ai_assisted',
    lifecycle: 'completed',
    source: 'manual',
    classification: 'confirmed',
  },
]

export function buildAssetCatalog(posts: readonly LegacyPostLike[] = []): AssetRef[] {
  return [
    ...DEMO_ASSETS,
    ...CURATED_FINDING_ASSETS,
    ...posts.map(assetFromLegacyPost),
  ]
}

export function assetRefIdForPost(blogId: string, slug: string): string {
  return `post:${blogId}:${slug}`
}
