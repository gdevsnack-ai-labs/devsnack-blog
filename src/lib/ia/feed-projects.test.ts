// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { feedProjectForBlog } from './feed-projects.ts'

function expectEqual(actual: unknown, expected: unknown, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

expectEqual(feedProjectForBlog('aitech'), {
  projectId: 'blog',
  href: '/labs/blog',
  label: 'AI Tech 자동화 시스템',
}, 'AI Tech must resolve to the existing Blog Automation System')
expectEqual(feedProjectForBlog('stockpulse'), {
  projectId: 'stockpulse-ai-self-improvement',
  href: '/labs/stockpulse-ai-self-improvement',
  label: 'StockPulse 자기개선 실험',
}, 'StockPulse must resolve to its existing Project')
expectEqual(feedProjectForBlog('devsnack'), null, 'unmapped feeds must stay unclassified')

console.log('feed project mapping tests passed')
