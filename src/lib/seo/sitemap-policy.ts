import { experiments, getPublicLabProjects } from '@/data/experiments'
import { PUBLIC_RELEASE_ID } from '@/lib/benchmarks/public-release'
// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { isIndexableSearchPolicy, searchPolicyForPath } from './search-policy.ts'

export type SitemapRoutePolicy = 'INDEX' | 'NAVIGATION_ONLY' | 'UTILITY'

const INDEX_ROUTES = new Set([
  '/',
  '/devsnack',
  '/stock',

  '/aitech',
  '/labs',
  '/benchmarks',
  '/data',
  '/demos',
  '/demos/html',
  '/research',

  '/about',
  '/privacy',
  '/contact',
])

const PUBLIC_LAB_PROJECT_PATHS = new Set(
  getPublicLabProjects(experiments).map(project => `/labs/${project.id}`),
)

const PUBLIC_BENCHMARK_RELEASE_PATHS = new Set([
  `/benchmarks/${PUBLIC_RELEASE_ID}`,
])

const NAVIGATION_ONLY_PREFIXES = [
  '/demos/',
  '/labs/',
  '/research/category/',
  '/static/',
]

const UTILITY_PREFIXES = [
  '/search',
  '/tools/operations',
  '/admin/',
  '/api/',
  '/robots.txt',
  '/rss.xml',
  '/en/rss.xml',
]

export function routePolicy(pathname: string): SitemapRoutePolicy {
  const path = pathname === '' ? '/' : pathname.replace(/\/$/, '') || '/'
  if (INDEX_ROUTES.has(path) || PUBLIC_LAB_PROJECT_PATHS.has(path) || PUBLIC_BENCHMARK_RELEASE_PATHS.has(path)) return 'INDEX'
  if (UTILITY_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))) return 'UTILITY'
  if (NAVIGATION_ONLY_PREFIXES.some(prefix => path.startsWith(prefix))) return 'NAVIGATION_ONLY'
  return 'NAVIGATION_ONLY'
}

export function isIndexableSitemapRoute(pathname: string): boolean {
  return routePolicy(pathname) === 'INDEX' && isIndexableSearchPolicy(searchPolicyForPath(pathname))
}
