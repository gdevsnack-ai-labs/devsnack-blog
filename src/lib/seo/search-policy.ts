export type SearchPolicy = 'index' | 'noindex' | 'private'
export type SearchPolicyDecisionSource = 'automatic' | 'override' | 'default'

export interface SearchPolicyDecision {
  policy: SearchPolicy
  reason: string
  source: SearchPolicyDecisionSource
  reviewRequired: boolean
}

export interface SearchPolicyPostLike {
  blog_id?: string | null
  slug?: string | null
  status?: string | null
  publication_status?: string | null
  public?: boolean | null
  lifecycle_status?: string | null
  content_type?: string | null
  provenance?: unknown
  human_reviewed?: boolean | null
  locale?: string | null
  search_policy?: SearchPolicy | string | null
  search_policy_reason?: string | null
  is_raw_artifact?: boolean | null
  is_empty_category?: boolean | null
}

/** Candidates reviewed from the live Research inventory; do not expand automatically by length. */
export const THIN_KNOWLEDGE_SLUGS = new Set(['unsloth-gguf'])

/** Explicit decisions survive future classifier changes until a person changes them. */
export const SEARCH_POLICY_OVERRIDES: Readonly<Record<string, { policy: SearchPolicy; reason: string }>> = {
  'research:unsloth-gguf': {
    policy: 'noindex',
    reason: 'thin_knowledge_reviewed',
  },
}

const PRIVATE_PATHS = ['/admin', '/api']
const NOINDEX_PATH_REASONS: Readonly<Record<string, string>> = {
  '/search': 'utility_search_results',
  '/tools/operations': 'public_operations_transparency_without_search_landing_value',
  '/links': 'utility_directory',
  '/data/hermes-usage': 'aggregate_telemetry_utility',
  '/demos/music': 'empty_showcase_category',
  '/demos/image': 'empty_showcase_category',
  '/html5-poop-dodge-game.html': 'raw_static_artifact',
  '/pixel-survivors-ai-game.html': 'raw_static_artifact',
  '/ai-game-assets.html': 'raw_static_artifact',
  '/hero-intro.html': 'raw_static_artifact',
  '/html-in-canvas.html': 'raw_static_artifact',
  '/ragdoll-playground-qwen3.8.html': 'raw_static_artifact',
  '/stock-dashboard-qwen3.8.html': 'raw_static_artifact',
}
const NOINDEX_PATHS = new Set(Object.keys(NOINDEX_PATH_REASONS))
const NOINDEX_PREFIXES = ['/en']

function normalizePath(pathname: string): string {
  const path = pathname.split(/[?#]/, 1)[0]
  if (!path || path === '/') return '/'
  return `/${path.replace(/^\/+|\/+$/g, '')}`
}

function matchesPath(pathname: string, root: string): boolean {
  return pathname === root || pathname.startsWith(`${root}/`)
}

function isSearchPolicy(value: unknown): value is SearchPolicy {
  return value === 'index' || value === 'noindex' || value === 'private'
}

function decision(
  policy: SearchPolicy,
  reason: string,
  source: SearchPolicyDecisionSource,
  reviewRequired = false,
): SearchPolicyDecision {
  return { policy, reason, source, reviewRequired }
}

export function searchPolicyDecisionForPath(pathname: string): SearchPolicyDecision {
  const path = normalizePath(pathname)
  if (PRIVATE_PATHS.some(root => matchesPath(path, root))) {
    return decision('private', 'internal_route', 'automatic')
  }
  if (NOINDEX_PATHS.has(path)) {
    return decision('noindex', NOINDEX_PATH_REASONS[path], 'automatic')
  }
  if (NOINDEX_PREFIXES.some(root => matchesPath(path, root))) {
    return decision('noindex', 'english_pilot_human_review_required', 'automatic')
  }
  return decision('index', 'public_route_default', 'default')
}

export function searchPolicyForPath(pathname: string): SearchPolicy {
  return searchPolicyDecisionForPath(pathname).policy
}

function isNonPublicPublication(post: SearchPolicyPostLike): boolean {
  if (post.public === false) return true
  if (post.status && !['live', 'published'].includes(post.status)) return true
  if (post.publication_status && !['live', 'published'].includes(post.publication_status)) return true
  return false
}

function explicitDecision(post: SearchPolicyPostLike): SearchPolicyDecision | null {
  if (!isSearchPolicy(post.search_policy)) return null
  return decision(
    post.search_policy,
    post.search_policy_reason?.trim() || 'explicit_search_policy',
    'override',
  )
}

function hardSafetyPostDecision(post: SearchPolicyPostLike): SearchPolicyDecision | null {
  if (post.locale === 'en' && post.human_reviewed !== true) {
    return decision('noindex', 'english_pilot_human_review_required', 'automatic')
  }
  return null
}

function automaticPostDecision(post: SearchPolicyPostLike): SearchPolicyDecision | null {
  if (post.is_raw_artifact || post.content_type === 'raw_artifact') {
    return decision('noindex', 'raw_static_artifact', 'automatic')
  }
  if (post.is_empty_category) {
    return decision('noindex', 'empty_showcase_category', 'automatic')
  }
  if (post.blog_id === 'aitech' && post.lifecycle_status === 'archived') {
    return decision('noindex', 'aitech_archived_feed_detail', 'automatic')
  }
  if (post.blog_id === 'stockpulse' && post.lifecycle_status === 'consolidated') {
    return decision('noindex', 'stockpulse_consolidated_history', 'automatic')
  }
  if (post.blog_id === 'lab' && post.slug?.startsWith('stockpulse-self-')) {
    return decision('noindex', 'stockpulse_daily_raw_lab_note', 'automatic')
  }

  const override = post.blog_id && post.slug
    ? SEARCH_POLICY_OVERRIDES[`${post.blog_id}:${post.slug}`]
    : undefined
  if (override) return decision(override.policy, override.reason, 'override')

  if (post.locale === 'en') {
    return decision('index', 'english_reviewed_but_ia_validation_required', 'default', true)
  }
  if (post.content_type === 'knowledge' || post.blog_id === 'research') {
    return decision('index', 'knowledge_value_review_required', 'default', true)
  }
  return decision('index', 'content_value_review_required', 'default', true)
}

export function searchPolicyDecisionForPost(post: SearchPolicyPostLike): SearchPolicyDecision {
  if (isNonPublicPublication(post)) return decision('private', 'publication_not_live', 'automatic')
  const hardSafetyDecision = hardSafetyPostDecision(post)
  if (hardSafetyDecision) return hardSafetyDecision
  return explicitDecision(post) || automaticPostDecision(post) || decision('index', 'content_value_review_required', 'default', true)
}

export function searchPolicyForPost(post: SearchPolicyPostLike): SearchPolicy {
  return searchPolicyDecisionForPost(post).policy
}

export function isIndexablePostSitemapEntry(post: SearchPolicyPostLike): boolean {
  return isIndexableSearchPolicy(searchPolicyForPost(post))
}

/**
 * Validate a new publishing input without changing legacy rows. Existing rows
 * can continue using automatic compatibility rules; new value-sensitive content
 * should carry an explicit policy and reason.
 */
export function validateSearchPolicyPost(post: SearchPolicyPostLike): string[] {
  const errors: string[] = []
  const explicitPolicyProvided = post.search_policy !== undefined && post.search_policy !== null && post.search_policy !== ''
  const hasValidExplicitPolicy = isSearchPolicy(post.search_policy)
  const reason = post.search_policy_reason?.trim() || ''

  if (explicitPolicyProvided && !hasValidExplicitPolicy) {
    errors.push('search_policy must be index, noindex, or private')
  }
  if (hasValidExplicitPolicy && !reason) {
    errors.push('search_policy_reason is required when search_policy is explicit')
  }
  if (post.locale === 'en' && post.human_reviewed !== true && post.search_policy === 'index') {
    errors.push('unreviewed English content cannot be explicitly indexed')
  }

  const resolved = searchPolicyDecisionForPost(post)
  if (resolved.policy !== 'private' && resolved.reviewRequired && !hasValidExplicitPolicy) {
    errors.push('search_policy is required for content that needs value review')
  }
  return Array.from(new Set(errors))
}

export function robotsForSearchPolicy(policy: SearchPolicy): { index: boolean; follow: boolean } {
  return policy === 'index'
    ? { index: true, follow: true }
    : policy === 'noindex'
      ? { index: false, follow: true }
      : { index: false, follow: false }
}

export function isIndexableSearchPolicy(policy: SearchPolicy): boolean {
  return policy === 'index'
}
