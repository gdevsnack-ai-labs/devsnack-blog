// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { buildRouteMetadata, buildResearchJsonLd, extractSourceUrls, stripImportedHeadArtifacts } from './metadata.ts'

function expectEqual(actual: unknown, expected: unknown, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

function expectIncludes(value: string, expected: string, message: string) {
  if (!value.includes(expected)) throw new Error(`${message}: missing ${expected}`)
}

const legacy = `
  <meta name="description" content="legacy">
  <link rel="canonical" href="https://devsnack.blogspot.com/legacy">
  <title>Legacy title</title>
  <script type="application/ld+json">{"@type":"Article"}</script>
  <h2>Visible heading</h2>
  <p>Visible article body</p>
  <code>&lt;meta name=&quot;keep-me&quot;&gt;</code>
`
const cleaned = stripImportedHeadArtifacts(legacy)
expectIncludes(cleaned, '<h2>Visible heading</h2>', 'visible heading must survive sanitization')
expectIncludes(cleaned, 'Visible article body', 'visible body must survive sanitization')
expectIncludes(cleaned, 'keep-me', 'escaped code must survive sanitization')
if (cleaned.includes('devsnack.blogspot.com') || cleaned.includes('application/ld+json') || cleaned.includes('<meta name="description"')) {
  throw new Error('legacy head artifacts must not survive sanitization')
}

const metadata = buildRouteMetadata({
  title: 'Local LLM Benchmark',
  description: '실제 GB10 측정 결과',
  canonicalPath: '/lab/local-llm-benchmark-report',
  kind: 'article',
  publishedTime: '2026-08-18T00:00:00.000Z',
  modifiedTime: '2026-08-21T00:00:00.000Z',
})
expectEqual(metadata.alternates?.canonical, 'https://devsnack-blog.vercel.app/lab/local-llm-benchmark-report', 'canonical must be Vercel-primary')
expectEqual((metadata.openGraph as { type?: string } | undefined)?.type, 'article', 'article route must expose article OG type')
expectEqual(metadata.openGraph?.url, 'https://devsnack-blog.vercel.app/lab/local-llm-benchmark-report', 'OG URL must match canonical')
expectEqual(metadata.robots, { index: true, follow: true }, 'public route must be indexable')

const researchContent = `
## Background
본문
## Sources
- [Official Model Card](https://huggingface.co/example/model)
- https://example.com/paper
## Limitations
본문
`
expectEqual(
  extractSourceUrls(researchContent),
  ['https://huggingface.co/example/model', 'https://example.com/paper'],
  'source extraction must be scoped to the Sources section',
)
const legacyHtmlResearchContent = `
<h2><strong>Sources</strong></h2>
<p><a href="https://example.com/legacy-source">Legacy source</a></p>
<h2>Limitations</h2>
<p>https://example.com/outside-section</p>
`
expectEqual(
  extractSourceUrls(legacyHtmlResearchContent),
  ['https://example.com/legacy-source'],
  'source extraction must recognize visible text in inline-markup HTML headings',
)
const jsonLd = buildResearchJsonLd({
  title: 'Example Research',
  description: 'Knowledge summary',
  canonical: 'https://devsnack-blog.vercel.app/research/example',
  categoryLabel: 'LLM / 모델',
  content: researchContent,
  published: '2026-08-20T00:00:00.000Z',
  updated: '2026-08-21T00:00:00.000Z',
})
expectEqual(jsonLd.articleSection, 'LLM / 모델', 'JSON-LD section must match visible Knowledge domain')
expectEqual(jsonLd.citation, ['https://huggingface.co/example/model', 'https://example.com/paper'], 'JSON-LD citation must use page sources')

const noSources = buildResearchJsonLd({
  title: 'No Sources',
  description: 'No citations',
  canonical: 'https://devsnack-blog.vercel.app/research/no-sources',
  categoryLabel: 'Hardware',
  content: '<p>No source section</p>',
})
if ('citation' in noSources) throw new Error('JSON-LD must omit citation when no page source exists')

console.log('SEO foundation tests passed')
