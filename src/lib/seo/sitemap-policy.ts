export type SitemapRoutePolicy = 'INDEX' | 'NAVIGATION_ONLY' | 'UTILITY'

const INDEX_ROUTES = new Set([
  '/',
  '/devsnack',
  '/stock',
  '/realestate',
  '/aitech',
  '/labs',
  '/benchmarks',
  '/data',
  '/lab',
  '/demos',
  '/research',
  '/misc',
  '/about',
  '/privacy',
  '/contact',
  '/links',
  '/en',
  '/en/benchmarks',
  '/en/labs/stockpulse-ai-self-improvement',
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
  if (INDEX_ROUTES.has(path)) return 'INDEX'
  if (UTILITY_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))) return 'UTILITY'
  if (NAVIGATION_ONLY_PREFIXES.some(prefix => path.startsWith(prefix))) return 'NAVIGATION_ONLY'
  return 'NAVIGATION_ONLY'
}

export function isIndexableSitemapRoute(pathname: string): boolean {
  return routePolicy(pathname) === 'INDEX'
}
