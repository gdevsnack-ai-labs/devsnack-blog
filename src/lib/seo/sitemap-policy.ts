// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { experiments, getPublicLabProjects } from '../../data/experiments.ts'
// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { DEMO_CATEGORIES, DEMOS } from '../../data/demos.ts'
// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { getPublicBenchmarkModelSlugs } from '../benchmarks/public-release.ts'
// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { isIndexableSearchPolicy, searchPolicyForPath } from './search-policy.ts'

export type SitemapRoutePolicy = 'INDEX' | 'NAVIGATION_ONLY' | 'UTILITY'

const INDEX_ROUTES = new Set([
  '/',
  '/devsnack',
  '/aitech',
  '/labs',
  '/labs/board',
  '/benchmarks',
  '/en/benchmarks',
  '/demos/html',
  '/demos/music',
  '/research',
  '/benchmarks/custom',

  '/about',
  '/privacy',
  '/contact',
])

const PUBLIC_LAB_PROJECT_PATHS = new Set(
  getPublicLabProjects(experiments).map(project => `/labs/${project.id}`),
)

const PUBLIC_BENCHMARK_RELEASE_PATHS = new Set([
  ...getPublicBenchmarkModelSlugs().map(slug => `/benchmarks/models/${slug}`),
])

const PUBLIC_DEMO_CATEGORY_PATHS = new Set(
  DEMO_CATEGORIES
    .filter(category => DEMOS[category.key].length > 0)
    .map(category => `/demos/${category.key}`),
)

const NAVIGATION_ONLY_PREFIXES = [
  '/demos/',
  '/labs/',
  '/research/category/',
  '/static/',
]

const UTILITY_PREFIXES = [
  '/search',
  '/stock',
  '/tools/operations',
  '/operations',
  '/data/hermes-usage',
  '/admin/',
  '/api/',
  '/robots.txt',
  '/rss.xml',
  '/en/rss.xml',
]

export function routePolicy(pathname: string): SitemapRoutePolicy {
  const path = pathname === '' ? '/' : pathname.replace(/\/$/, '') || '/'
  if (!isIndexableSearchPolicy(searchPolicyForPath(path))) return 'UTILITY'
  if (INDEX_ROUTES.has(path) || PUBLIC_LAB_PROJECT_PATHS.has(path) || PUBLIC_BENCHMARK_RELEASE_PATHS.has(path) || PUBLIC_DEMO_CATEGORY_PATHS.has(path)) return 'INDEX'
  if (UTILITY_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))) return 'UTILITY'
  if (NAVIGATION_ONLY_PREFIXES.some(prefix => path.startsWith(prefix))) return 'NAVIGATION_ONLY'
  return 'NAVIGATION_ONLY'
}

export function isIndexableSitemapRoute(pathname: string): boolean {
  return routePolicy(pathname) === 'INDEX' && isIndexableSearchPolicy(searchPolicyForPath(pathname))
}
