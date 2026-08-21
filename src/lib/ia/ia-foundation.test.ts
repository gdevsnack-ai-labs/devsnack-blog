import { createIAFoundation, PRIMARY_TYPES, validateIAFoundation } from './index'
import { assetFromLegacyPost } from './asset-catalog'
import { ASSET_RELATIONS } from './relation-registry'

function expectEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`)
}

function expectIncludes<T>(values: readonly T[], expected: T, message: string) {
  if (!values.includes(expected)) throw new Error(`${message}: missing ${String(expected)}`)
}

const fixturePosts = [
  { slug: 'aitech-fixture', title: 'AI Tech fixture', blog_id: 'aitech', status: 'live' },
  { slug: 'stock-fixture', title: 'StockPulse fixture', blog_id: 'stockpulse', status: 'live' },
  { slug: 'stockpulse-self-2026-08-21', title: 'StockPulse finding', blog_id: 'lab', status: 'live' },
  { slug: 'local-llm-benchmark-report', title: 'Benchmark report', blog_id: 'lab', status: 'live' },
  { slug: 'dflash-fixture', title: 'DFlash knowledge', blog_id: 'research', status: 'live' },
  { slug: 'mining-leaderboard', title: 'Mining tracker', blog_id: 'misc', status: 'live' },
  { slug: 'devsnack-fixture', title: 'DevSnack story', blog_id: 'devsnack', status: 'live' },
  { slug: 'qwen3-8-27b-nvfp4-mtp-gguf-gb10', title: 'Qwen knowledge', blog_id: 'research', status: 'live' },
  { slug: 'ai-llm-omok-experiment', title: 'Omok story', blog_id: 'devsnack', status: 'live' },
  { slug: 'ai-built-gomoku-engine-vs-rapfi', title: 'Omok engine story', blog_id: 'devsnack', status: 'live' },
  { slug: 'isekai-instagram-mage-prologue', title: 'Isekai creative test', blog_id: 'lab', status: 'live' },
]

const foundation = createIAFoundation(fixturePosts, ASSET_RELATIONS)
const errors = validateIAFoundation(foundation)
if (errors.length > 0) throw new Error(`IA foundation validation failed: ${errors.join('; ')}`)

expectEqual(foundation.projects.length, 7, 'all legacy projects must project into ProjectCatalog')
expectIncludes(PRIMARY_TYPES, 'benchmark', 'benchmark must be an official primary type')
expectIncludes(PRIMARY_TYPES, 'tracker', 'tracker must be an official primary type')
expectEqual(assetFromLegacyPost(fixturePosts[0]).primaryType, 'feed', 'AI Tech must project to Feed')
expectEqual(assetFromLegacyPost(fixturePosts[1]).primaryType, 'feed', 'StockPulse must project to Feed')
expectEqual(assetFromLegacyPost(fixturePosts[2]).primaryType, 'experiment', 'StockPulse Lab run must project to Experiment')
expectEqual(assetFromLegacyPost(fixturePosts[3]).primaryType, 'benchmark', 'benchmark report must project to Benchmark')
expectEqual(assetFromLegacyPost(fixturePosts[4]).primaryType, 'knowledge', 'Research must project to Knowledge')
expectEqual(assetFromLegacyPost(fixturePosts[5]).primaryType, 'tracker', 'Mining Leaderboard must project to Tracker')
expectEqual(assetFromLegacyPost(fixturePosts[6]).primaryType, 'story', 'DevSnack must project to Story')
expectEqual(assetFromLegacyPost(fixturePosts[3]).projectId, 'local-llm-benchmark', 'benchmark report must link to its project')
expectEqual(assetFromLegacyPost(fixturePosts[5]).route, '/misc/mining-leaderboard', 'custom mining route must be preserved')

console.log(`IA foundation tests passed: projects=${foundation.projects.length}, assets=${foundation.assets.length}, relations=${foundation.relations.length}`)
