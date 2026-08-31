// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { isIndexableSitemapRoute, routePolicy } from './sitemap-policy.ts'

if (routePolicy('/tools/operations') !== 'UTILITY') throw new Error('operations must remain utility')
if (routePolicy('/search') !== 'UTILITY') throw new Error('search must remain utility')
if (routePolicy('/demos/html') !== 'INDEX') throw new Error('populated HTML Showcase category must remain indexable')
if (routePolicy('/labs/local-llm-benchmark') !== 'NAVIGATION_ONLY') throw new Error('lab project detail is navigation-only in this phase')
if (routePolicy('/labs/autonomous-ai-blog') !== 'INDEX') throw new Error('Autonomous AI Blog Project must remain indexable')
if (routePolicy('/research/category/llm') !== 'NAVIGATION_ONLY') throw new Error('research category is navigation-only in this phase')
if (routePolicy('/lab') === 'INDEX') throw new Error('legacy Lab hub must not be sitemap-indexable')
if (!isIndexableSitemapRoute('/research')) throw new Error('Knowledge hub must remain indexable')
if (!isIndexableSitemapRoute('/privacy')) throw new Error('Privacy must remain indexable')
if (!isIndexableSitemapRoute('/demos/html')) throw new Error('populated HTML Showcase category must remain in sitemap')
if (isIndexableSitemapRoute('/search')) throw new Error('utility route must not be sitemap-indexable')
if (isIndexableSitemapRoute('/links')) throw new Error('utility Links must not be sitemap-indexable')
if (isIndexableSitemapRoute('/en')) throw new Error('English pilot must not be sitemap-indexable')
if (isIndexableSitemapRoute('/html5-poop-dodge-game.html')) throw new Error('raw artifact must not be sitemap-indexable')

console.log('Sitemap policy tests passed')
