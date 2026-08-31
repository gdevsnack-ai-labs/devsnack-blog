// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { isRssEligiblePost } from './rss-policy.ts'

function expectEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`)
}

expectEqual(
  isRssEligiblePost({ blog_id: 'research', slug: 'dflash-2-qwen3-8-27b-vs-mtp', status: 'live' }),
  false,
  'migrated Research details must stay out of RSS',
)
expectEqual(
  isRssEligiblePost({ blog_id: 'research', slug: 'qwen3-8-27b-nvfp4-mtp-gguf-gb10', status: 'live' }),
  true,
  'retained Research details may stay in RSS',
)
expectEqual(
  isRssEligiblePost({ blog_id: 'lab', slug: 'ornith15-server-quality-speed-benchmark', status: 'live' }),
  true,
  'published Lab assets may stay in RSS',
)
expectEqual(
  isRssEligiblePost({ blog_id: 'devsnack', slug: 'draft-story', status: 'draft' }),
  false,
  'non-live rows must stay out of RSS',
)

console.log('RSS policy tests passed')
