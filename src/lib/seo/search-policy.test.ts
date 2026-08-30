// @ts-expect-error Node's strip-types runner requires the explicit extension.
import * as searchPolicy from './search-policy.ts'

const {
  robotsForSearchPolicy,
  searchPolicyDecisionForPost,
  searchPolicyForPath,
  searchPolicyForPost,
  isIndexablePostSitemapEntry,
  validateSearchPolicyPost,
} = searchPolicy

function expectEqual(actual: unknown, expected: unknown, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

expectEqual(searchPolicyForPath('/stock'), 'noindex', 'StockPulse Hub must remain public but noindex after externalization')
expectEqual(searchPolicyForPath('/tools/operations'), 'noindex', 'Operations must remain public but noindex')
expectEqual(searchPolicyForPath('/links'), 'noindex', 'utility Links must be noindex')
expectEqual(searchPolicyForPath('/admin/research'), 'private', 'Admin routes must be private, not merely noindex')
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
  searchPolicyForPost({ blog_id: 'stockpulse', slug: 'retired-report', status: 'live', lifecycle_status: 'archived' }),
  'noindex',
  'externally migrated StockPulse detail must be noindex',
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
  'noindex',
  'migrated download-only model detail must be noindex after externalization',
)
expectEqual(
  searchPolicyForPost({ blog_id: 'devsnack', slug: 'story', status: 'live', content_type: 'story' }),
  'index',
  'Story must remain indexable by default before an explicit exception',
)
expectEqual(
  searchPolicyForPost({ blog_id: 'lab', slug: 'benchmark', status: 'live', content_type: 'benchmark' }),
  'index',
  'Benchmark must remain indexable by default before an explicit exception',
)
expectEqual(
  searchPolicyDecisionForPost({ blog_id: 'devsnack', slug: 'translated', status: 'live', locale: 'en', human_reviewed: false }),
  {
    policy: 'noindex',
    reason: 'english_pilot_human_review_required',
    source: 'automatic',
    reviewRequired: false,
  },
  'unreviewed English content must be noindex regardless of content type',
)
expectEqual(
  searchPolicyForPost({
    blog_id: 'devsnack',
    slug: 'translated',
    status: 'live',
    locale: 'en',
    human_reviewed: false,
    search_policy: 'index',
    search_policy_reason: 'temporary experiment',
  }),
  'noindex',
  'an explicit index must not bypass the unreviewed English safety boundary',
)
expectEqual(
  searchPolicyDecisionForPost({
    blog_id: 'research',
    slug: 'measured-knowledge',
    status: 'live',
    content_type: 'knowledge',
    provenance: 'ai_assisted',
    human_reviewed: false,
    search_policy: 'index',
    search_policy_reason: '직접 실행 결과와 비교 가능한 측정값이 있음',
  }),
  {
    policy: 'index',
    reason: '직접 실행 결과와 비교 가능한 측정값이 있음',
    source: 'override',
    reviewRequired: false,
  },
  'a reviewed Knowledge decision must be explicit and survive AI-assisted provenance',
)
expectEqual(
  searchPolicyDecisionForPost({
    blog_id: 'research',
    slug: 'candidate-knowledge',
    status: 'live',
    content_type: 'knowledge',
    provenance: 'automated',
  }),
  {
    policy: 'index',
    reason: 'knowledge_value_review_required',
    source: 'default',
    reviewRequired: true,
  },
  'Knowledge without an explicit decision must stay visible but require review',
)
expectEqual(
  searchPolicyDecisionForPost({
    blog_id: 'aitech',
    slug: 'archived-feed',
    status: 'live',
    lifecycle_status: 'archived',
    search_policy: 'index',
    search_policy_reason: '대표 회고로 선정',
  }),
  {
    policy: 'index',
    reason: '대표 회고로 선정',
    source: 'override',
    reviewRequired: false,
  },
  'an explicit human override must beat an automatic lifecycle default',
)
expectEqual(
  searchPolicyDecisionForPost({
    blog_id: 'research',
    slug: 'draft',
    status: 'draft',
    search_policy: 'index',
    search_policy_reason: 'must not publish',
  }),
  {
    policy: 'private',
    reason: 'publication_not_live',
    source: 'automatic',
    reviewRequired: false,
  },
  'publication privacy must beat an unsafe index override',
)
expectEqual(
  validateSearchPolicyPost({ blog_id: 'research', slug: 'candidate-knowledge', status: 'live', content_type: 'knowledge' }),
  ['search_policy is required for content that needs value review'],
  'new Knowledge content must carry an explicit policy decision',
)
expectEqual(
  validateSearchPolicyPost({
    blog_id: 'research',
    slug: 'measured-knowledge',
    status: 'live',
    content_type: 'knowledge',
    search_policy: 'index',
    search_policy_reason: '직접 측정·검증·결론이 있음',
  }),
  [],
  'an explicit Knowledge decision must pass the publish gate',
)
expectEqual(
  validateSearchPolicyPost({
    blog_id: 'devsnack',
    slug: 'unreviewed-translation',
    status: 'live',
    locale: 'en',
    human_reviewed: false,
    search_policy: 'index',
    search_policy_reason: 'temporary experiment',
  }),
  ['unreviewed English content cannot be explicitly indexed'],
  'English review status must be a hard safety boundary',
)
expectEqual(
  isIndexablePostSitemapEntry({ blog_id: 'lab', slug: 'stockpulse-self-2026-08-21', status: 'live' }),
  false,
  'noindex daily Lab notes must not enter sitemap projections',
)
expectEqual(
  isIndexablePostSitemapEntry({ blog_id: 'lab', slug: 'stockpulse-weekly-2026-08-18', status: 'live' }),
  true,
  'indexable weekly Lab notes may enter sitemap projections',
)
expectEqual(
  isIndexablePostSitemapEntry({ blog_id: 'research', slug: 'dflash-2-qwen3-8-27b-vs-mtp', status: 'live' }),
  false,
  'migrated Research details must not enter sitemap projections',
)
expectEqual(
  isIndexablePostSitemapEntry({ blog_id: 'research', slug: 'qwen3-8-27b-nvfp4-mtp-gguf-gb10', status: 'live' }),
  true,
  'retained K2 Research assets must remain sitemap-indexable',
)
expectEqual(
  searchPolicyForPost({ blog_id: 'research', slug: 'dflash-2-qwen3-8-27b-vs-mtp', status: 'live' }),
  'noindex',
  'migrated Research details must be noindex',
)
expectEqual(robotsForSearchPolicy('index'), { index: true, follow: true }, 'index robots must be explicit')
expectEqual(robotsForSearchPolicy('noindex'), { index: false, follow: true }, 'noindex robots must follow links')
expectEqual(robotsForSearchPolicy('private'), { index: false, follow: false }, 'private robots must not expose links')

console.log('Search policy tests passed')
