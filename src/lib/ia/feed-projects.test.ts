// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { feedProjectForBlog } from './feed-projects.ts'

function expectEqual(actual: unknown, expected: unknown, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

expectEqual(feedProjectForBlog('aitech'), null, 'AI Tech publication must stay outside the Vercel Lab Feed Output projection')
expectEqual(feedProjectForBlog('stockpulse'), null, 'StockPulse Daily Feed must stay outside the Vercel Lab Feed Output projection after migration')
expectEqual(feedProjectForBlog('devsnack'), null, 'unmapped feeds must stay unclassified')

console.log('feed project mapping tests passed')
