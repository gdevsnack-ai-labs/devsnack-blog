// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { projectResearchListPost } from './research-list-projection.ts'

function expectEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`)
}

const projected = projectResearchListPost({
  slug: 'ornith-1-5-gguf-gb10',
  title: 'Ornith-1.5 GGUF',
  excerpt: ' <blockquote>요약</blockquote> <h2>결론</h2> <p>GB10 실측</p> ',
  labels: ['진행중', 'llm'],
  published: '2026-08-19T15:00:00+00:00',
})

expectEqual(projected.excerpt, '요약 결론 GB10 실측', 'category Knowledge cards must expose a plain-text excerpt')
expectEqual(projected.slug, 'ornith-1-5-gguf-gb10', 'category projection must preserve the post identity')

console.log('research list projection tests passed')
