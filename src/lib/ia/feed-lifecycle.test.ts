// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { AUTOMATED_FEED_BLOG_IDS, feedDetailFilters, feedListFilters, isAutomatedFeedBlog, isFeedDetailAccessible, isFeedListable, publicFeedOrFilter } from './feed-lifecycle.ts'

function expectEqual(actual: unknown, expected: unknown, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

function expectTrue(value: boolean, message: string) {
  if (!value) throw new Error(message)
}

function expectFalse(value: boolean, message: string) {
  if (value) throw new Error(message)
}

expectEqual(AUTOMATED_FEED_BLOG_IDS, ['aitech', 'stockpulse'], 'automated Feed set must stay explicit')
expectTrue(isAutomatedFeedBlog('aitech'), 'AI Tech must be an automated Feed')
expectTrue(isAutomatedFeedBlog('stockpulse'), 'StockPulse must be an automated Feed')
expectFalse(isAutomatedFeedBlog('devsnack'), 'Stories must not be an automated Feed')

expectEqual(
  feedListFilters('aitech'),
  { blog_id: 'aitech', status: 'live', lifecycle_status: 'live' },
  'AI Tech list query must require lifecycle live',
)
expectEqual(
  feedListFilters('stockpulse'),
  { blog_id: 'stockpulse', status: 'live', lifecycle_status: 'live' },
  'StockPulse list query must require lifecycle live',
)
expectEqual(
  feedListFilters('devsnack'),
  { blog_id: 'devsnack', status: 'live' },
  'Stories list query must retain its separate status-only policy',
)
expectEqual(
  feedDetailFilters('aitech'),
  { blog_id: 'aitech', status: 'live' },
  'AI Tech detail query must not filter by lifecycle',
)
expectEqual(
  feedDetailFilters('stockpulse'),
  { blog_id: 'stockpulse', status: 'live' },
  'StockPulse detail query must not filter by lifecycle',
)
expectEqual(
  feedDetailFilters('devsnack'),
  { blog_id: 'devsnack', status: 'live' },
  'Stories detail query must retain its status-only accessibility policy',
)
expectEqual(
  publicFeedOrFilter(),
  'blog_id.not.in.(aitech,stockpulse),lifecycle_status.eq.live',
  'global public query must exclude non-live automated Feed lifecycle rows',
)

expectTrue(isFeedListable({ blog_id: 'aitech', status: 'live', lifecycle_status: 'live' }), 'live AI Tech row must be listable')
expectFalse(isFeedListable({ blog_id: 'aitech', status: 'live', lifecycle_status: 'consolidated' }), 'consolidated AI Tech row must not be listable')
expectFalse(isFeedListable({ blog_id: 'aitech', status: 'draft', lifecycle_status: 'live' }), 'draft AI Tech row must not be listable')
expectTrue(isFeedListable({ blog_id: 'devsnack', status: 'live', lifecycle_status: 'archived' }), 'Stories must remain separate from automated Feed lifecycle')
expectFalse(isFeedListable({ blog_id: 'stockpulse', status: 'live', lifecycle_status: 'purge_candidate' }), 'purge candidate StockPulse row must not be listable')

expectTrue(isFeedDetailAccessible({ blog_id: 'aitech', status: 'live', lifecycle_status: 'consolidated' }, 'aitech'), 'consolidated detail URL must remain accessible while status is live')
expectTrue(isFeedDetailAccessible({ blog_id: 'stockpulse', status: 'live', lifecycle_status: 'archived' }, 'stockpulse'), 'archived lifecycle detail URL must remain accessible before URL policy phase')
expectTrue(isFeedDetailAccessible({ blog_id: 'aitech', status: 'live', lifecycle_status: 'purge_candidate' }, 'aitech'), 'purge candidate detail URL must remain accessible before purge phase')
expectFalse(isFeedDetailAccessible({ blog_id: 'aitech', status: 'archived', lifecycle_status: 'archived' }, 'aitech'), 'status archived must keep the current detail route inaccessible')
expectFalse(isFeedDetailAccessible({ blog_id: 'aitech', status: 'draft', lifecycle_status: 'live' }, 'aitech'), 'draft detail URL must remain inaccessible')
expectFalse(isFeedDetailAccessible({ blog_id: 'stockpulse', status: 'live', lifecycle_status: 'consolidated' }, 'aitech'), 'detail helper must enforce the requested feed identity')

console.log('Feed lifecycle projection fixture tests passed')
