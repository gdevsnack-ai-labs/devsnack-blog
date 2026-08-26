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
  { slug: 'ornith15-server-quality-speed-benchmark', title: 'Ornith benchmark report', blog_id: 'lab', status: 'live' },
  { slug: 'qwen36-youtube-script-reliability-benchmark', title: 'Qwen3.6 YouTube benchmark', blog_id: 'lab', status: 'live' },
  { slug: 'hermes-memory-experiment', title: 'Memory experiment', blog_id: 'lab', status: 'live' },
  { slug: 'luna-agentic-game-dev-e2e', title: 'Agentic game dev', blog_id: 'lab', status: 'live' },
  { slug: 'dflash-fixture', title: 'DFlash knowledge', blog_id: 'research', status: 'live' },
  { slug: 'devsnack-fixture', title: 'DevSnack story', blog_id: 'devsnack', status: 'live' },
  { slug: 'dflash-2-qwen3-8-27b-vs-mtp', title: 'DFlash knowledge', blog_id: 'research', status: 'live' },
  { slug: 'ornith-1-5-gguf-gb10', title: 'Ornith knowledge', blog_id: 'research', status: 'live' },
  { slug: 'qwen3-8-27b-nvfp4-mtp-gguf-gb10', title: 'Qwen knowledge', blog_id: 'research', status: 'live' },
  { slug: 'ai-llm-omok-experiment', title: 'Omok story', blog_id: 'devsnack', status: 'live' },
  { slug: 'ml-ai', title: 'Omok knowledge', blog_id: 'devsnack', status: 'live' },
  { slug: 'googledrive-as-a-mediaserver', title: 'Media pipeline', blog_id: 'devsnack', status: 'live' },
  { slug: 'ornith-10-35b-5-agentic-coding-9-gguf', title: 'Ornith benchmark', blog_id: 'devsnack', status: 'live' },
  { slug: 'dgx-spark-gb10-north-mini-code-10-gguf-9_01353512936', title: 'North benchmark', blog_id: 'devsnack', status: 'live' },
  { slug: 'nex-n2-mini-ud-bartowski', title: 'Nex UD benchmark', blog_id: 'devsnack', status: 'live' },
  { slug: 'nvidia-dgx-spark-gb10-nex-n2-mini-gguf-6', title: 'Nex benchmark', blog_id: 'devsnack', status: 'live' },
  { slug: 'nvidia-dgx-spark-gb10-gguf-4', title: 'GGUF benchmark', blog_id: 'devsnack', status: 'live' },
  { slug: 'gemma-4-mtp-drafter-dgx-spark-3-31b', title: 'Gemma benchmark', blog_id: 'devsnack', status: 'live' },
  { slug: 'dgx-spark-qwen36-llamacpp-vllm-dflash', title: 'DFlash benchmark', blog_id: 'devsnack', status: 'live' },
  { slug: 'ai-built-gomoku-engine-vs-rapfi', title: 'Omok engine story', blog_id: 'devsnack', status: 'live' },
  { slug: 'isekai-instagram-mage-prologue', title: 'Isekai creative test', blog_id: 'lab', status: 'live' },
]

const foundation = createIAFoundation(fixturePosts, ASSET_RELATIONS)
const errors = validateIAFoundation(foundation)
if (errors.length > 0) throw new Error(`IA foundation validation failed: ${errors.join('; ')}`)

expectEqual(foundation.projects.length, 11, 'all legacy projects must project into ProjectCatalog')
expectIncludes(PRIMARY_TYPES, 'benchmark', 'benchmark must be an official primary type')
expectIncludes(PRIMARY_TYPES, 'tracker', 'tracker must be an official primary type')
const fixture = (slug: string) => fixturePosts.find(post => post.slug === slug)!

expectEqual(assetFromLegacyPost(fixture('aitech-fixture')).primaryType, 'feed', 'AI Tech must project to Feed')
expectEqual(assetFromLegacyPost(fixture('stock-fixture')).primaryType, 'feed', 'StockPulse must project to Feed')
expectEqual(assetFromLegacyPost(fixture('stockpulse-self-2026-08-21')).primaryType, 'experiment', 'StockPulse Lab run must project to Experiment')
expectEqual(assetFromLegacyPost(fixture('local-llm-benchmark-report')).primaryType, 'benchmark', 'benchmark report must project to Benchmark')
expectEqual(assetFromLegacyPost(fixture('dflash-fixture')).primaryType, 'knowledge', 'Research must project to Knowledge')
expectEqual(assetFromLegacyPost(fixture('devsnack-fixture')).primaryType, 'story', 'DevSnack must project to Story')
expectEqual(assetFromLegacyPost(fixture('local-llm-benchmark-report')).projectId, 'local-llm-benchmark', 'benchmark report must link to its project')

console.log(`IA foundation tests passed: projects=${foundation.projects.length}, assets=${foundation.assets.length}, relations=${foundation.relations.length}`)
