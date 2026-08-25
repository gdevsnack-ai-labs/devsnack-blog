// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildCollectionPageJsonLd, buildJsonLdGraph } from './structured-data.ts'

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message)
}

const article = buildArticleJsonLd({
  type: 'TechArticle',
  title: 'Qwen3.8-27B GB10 Test',
  description: '<p>Measured result</p>',
  url: 'https://devsnack-blog.vercel.app/en/research/qwen3-8-27b-nvfp4-mtp-gguf-gb10',
  language: 'en',
  section: 'Knowledge',
  citations: ['https://huggingface.co/Qwen/Qwen3.8-27B'],
})
assert(article['@type'] === 'TechArticle', 'article type must be TechArticle')
assert(article.inLanguage === 'en-US', 'English article must use en-US')
assert(article.description === 'Measured result', 'HTML must be removed from descriptions')
assert(Array.isArray(article.citation), 'citations must remain structured')

const crumbs = buildBreadcrumbJsonLd([
  { name: 'Home', url: 'https://devsnack-blog.vercel.app/en' },
  { name: 'Knowledge', url: 'https://devsnack-blog.vercel.app/en/research' },
  { name: 'Qwen3.8-27B GB10 Test', url: article.url as string },
], 'en')
assert(crumbs['@type'] === 'BreadcrumbList', 'breadcrumbs must use BreadcrumbList')
assert((crumbs.itemListElement as unknown[]).length === 3, 'breadcrumb positions must be preserved')

const collection = buildCollectionPageJsonLd({
  name: 'StockPulse Project',
  description: 'An experiment project',
  url: 'https://devsnack-blog.vercel.app/en/labs/stockpulse-ai-self-improvement',
  language: 'en',
  breadcrumbs: [],
  parts: [{ name: 'Lab Note', url: 'https://devsnack-blog.vercel.app/en/lab/note', position: 1 }],
})
assert(collection['@type'] === 'CollectionPage', 'Project must use CollectionPage')
assert((collection.mainEntity as { '@type': string })['@type'] === 'ItemList', 'Project outputs must be an ItemList')

const graph = buildJsonLdGraph(article, crumbs, collection)
assert(Array.isArray(graph['@graph']) && (graph['@graph'] as unknown[]).length === 3, 'graph must contain all entities')

console.log('structured data tests passed')
