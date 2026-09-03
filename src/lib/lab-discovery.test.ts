// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { getPublicLabProjectPaths, getPublicLabProjectSearchResults } from './lab-discovery.ts'

function expectEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`)
}

const results = getPublicLabProjectSearchResults('StockPulse V1 Fixed', [
  {
    id: 'stockpulse-v1-fixed',
    name: 'StockPulse V1 Fixed',
    description: 'Live Shadow project',
    status: '진행중',
  },
])
expectEqual(results.length, 1, 'public Lab project search must find StockPulse V1 Fixed')
expectEqual(results[0]?.title, 'StockPulse V1 Fixed', 'search must use the canonical project name')
expectEqual(results[0]?.href, '/labs/stockpulse-v1-fixed', 'search must use the canonical project route')
expectEqual(results[0]?.blog_id, 'lab', 'search must classify the result as Lab')
expectEqual(getPublicLabProjectPaths([{ id: 'stockpulse-v1-fixed' }]).includes('/labs/stockpulse-v1-fixed'), true, 'public Lab project paths must feed sitemap discovery')

console.log('lab discovery tests passed')
