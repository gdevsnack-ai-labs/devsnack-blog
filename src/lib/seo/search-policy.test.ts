// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { robotsForSearchPolicy, searchPolicyForPath, searchPolicyForPost } from './search-policy.ts'

function expectEqual(actual: unknown, expected: unknown, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

expectEqual(searchPolicyForPath('/tools/operations'), 'noindex', 'Operations must remain public but noindex')
expectEqual(searchPolicyForPath('/links'), 'noindex', 'utility Links must be noindex')
expectEqual(searchPolicyForPath('/en'), 'noindex', 'English pilot hub must be noindex')
expectEqual(searchPolicyForPath('/en/research/example'), 'noindex', 'English pilot detail must be noindex')
expectEqual(searchPolicyForPath('/demos/music'), 'noindex', 'empty Music Showcase must be noindex')
expectEqual(searchPolicyForPath('/demos/image'), 'noindex', 'empty Image Showcase must be noindex')
expectEqual(searchPolicyForPath('/privacy'), 'index', 'Privacy must remain indexable')
expectEqual(searchPolicyForPath('/data'), 'index', 'Data hub must remain indexable')
expectEqual(searchPolicyForPath('/html5-poop-dodge-game.html'), 'noindex', 'raw artifact must be noindex')

expectEqual(
  searchPolicyForPost({ blog_id: 'aitech', slug: 'archived-feed', status: 'live', lifecycle_status: 'archived' }),
  'noindex',
  'archived AI Tech detail must be noindex',
)
expectEqual(
  searchPolicyForPost({ blog_id: 'stockpulse', slug: 'old-report', status: 'live', lifecycle_status: 'consolidated' }),
  'noindex',
  'consolidated StockPulse detail must be noindex',
)
expectEqual(
  searchPolicyForPost({ blog_id: 'lab', slug: 'stockpulse-self-2026-08-21', status: 'live', lifecycle_status: 'live' }),
  'noindex',
  'daily StockPulse Lab note must be noindex',
)
expectEqual(
  searchPolicyForPost({ blog_id: 'lab', slug: 'stockpulse-weekly-2026-08-18', status: 'live', lifecycle_status: 'live' }),
  'index',
  'weekly StockPulse Lab note must remain indexable',
)
expectEqual(
  searchPolicyForPost({ blog_id: 'lab', slug: 'ornith15-server-quality-speed-benchmark', status: 'live', lifecycle_status: 'live' }),
  'index',
  'benchmark Lab note must remain indexable',
)
expectEqual(
  searchPolicyForPost({ blog_id: 'research', slug: 'unsloth-gguf', status: 'live', lifecycle_status: 'live' }),
  'noindex',
  'approved thin Knowledge candidate must be noindex',
)
expectEqual(
  searchPolicyForPost({ blog_id: 'research', slug: 'ternary-bonsai-27b', status: 'live', lifecycle_status: 'live' }),
  'index',
  'other thin candidates must not be auto-cut',
)
expectEqual(robotsForSearchPolicy('index'), { index: true, follow: true }, 'index robots must be explicit')
expectEqual(robotsForSearchPolicy('noindex'), { index: false, follow: true }, 'noindex robots must follow links')
expectEqual(robotsForSearchPolicy('private'), { index: false, follow: false }, 'private robots must not expose links')

console.log('Search policy tests passed')
