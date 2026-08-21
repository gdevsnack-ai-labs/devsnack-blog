import { isIndexableSitemapRoute, routePolicy } from './sitemap-policy'

if (routePolicy('/tools/operations') !== 'UTILITY') throw new Error('operations must remain utility')
if (routePolicy('/search') !== 'UTILITY') throw new Error('search must remain utility')
if (routePolicy('/demos/html') !== 'NAVIGATION_ONLY') throw new Error('demo categories are navigation-only in this phase')
if (routePolicy('/labs/local-llm-benchmark') !== 'NAVIGATION_ONLY') throw new Error('lab project detail is navigation-only in this phase')
if (routePolicy('/research/category/llm') !== 'NAVIGATION_ONLY') throw new Error('research category is navigation-only in this phase')
if (!isIndexableSitemapRoute('/research')) throw new Error('Knowledge hub must remain indexable')
if (isIndexableSitemapRoute('/search')) throw new Error('utility route must not be sitemap-indexable')

console.log('Sitemap policy tests passed')
