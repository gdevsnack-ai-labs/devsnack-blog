export type SearchPolicy = 'index' | 'noindex' | 'private'

export interface SearchPolicyPostLike {
  blog_id?: string | null
  slug?: string | null
  status?: string | null
  lifecycle_status?: string | null
}

/** Candidates reviewed from the live Research inventory; do not expand automatically by length. */
export const THIN_KNOWLEDGE_SLUGS = new Set(['unsloth-gguf'])

const PRIVATE_PATHS = ['/admin', '/api']
const NOINDEX_PATHS = new Set([
  '/search',
  '/tools/operations',
  '/links',
  '/data/hermes-usage',
  '/demos/music',
  '/demos/image',
  '/html5-poop-dodge-game.html',
  '/pixel-survivors-ai-game.html',
  '/ai-game-assets.html',
  '/hero-intro.html',
  '/html-in-canvas.html',
  '/ragdoll-playground-qwen3.8.html',
  '/stock-dashboard-qwen3.8.html',
])
const NOINDEX_PREFIXES = ['/en']

function normalizePath(pathname: string): string {
  const path = pathname.split(/[?#]/, 1)[0]
  if (!path || path === '/') return '/'
  return `/${path.replace(/^\/+|\/+$/g, '')}`
}

function matchesPath(pathname: string, root: string): boolean {
  return pathname === root || pathname.startsWith(`${root}/`)
}

export function searchPolicyForPath(pathname: string): SearchPolicy {
  const path = normalizePath(pathname)
  if (PRIVATE_PATHS.some(root => matchesPath(path, root))) return 'private'
  if (NOINDEX_PATHS.has(path) || NOINDEX_PREFIXES.some(root => matchesPath(path, root))) return 'noindex'
  return 'index'
}

export function searchPolicyForPost(post: SearchPolicyPostLike): SearchPolicy {
  if (post.status && post.status !== 'live') return 'private'
  if (post.blog_id === 'aitech' && post.lifecycle_status === 'archived') return 'noindex'
  if (post.blog_id === 'stockpulse' && post.lifecycle_status === 'consolidated') return 'noindex'
  if (post.blog_id === 'lab' && post.slug?.startsWith('stockpulse-self-')) return 'noindex'
  if (post.blog_id === 'research' && post.slug && THIN_KNOWLEDGE_SLUGS.has(post.slug)) return 'noindex'
  return 'index'
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
