import { experiments } from '@/data/experiments'
import { loadPublicBenchmarkRelease } from '@/lib/benchmarks/public-release'
import { projectKnowledgePost } from './hub-projections'
import { getFeaturedExperiment } from '../labs'
import { createHomeProjection, projectHomeDataServices } from './home-projections'

function expectEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`)
}

function expectTrue(value: boolean, message: string) {
  if (!value) throw new Error(message)
}

const knowledge = [projectKnowledgePost({
  slug: 'qwen3-8-27b-nvfp4-mtp-gguf-gb10',
  title: 'Qwen3.8-27B NVFP4 MTP — GB10 로컬 테스트',
  blog_id: 'research',
  status: 'live',
  labels: ['조사완료', 'llm'],
  excerpt: 'GB10에서 Qwen3.8-27B를 확인한 Knowledge asset',
  published: '2026-08-18T15:00:00+00:00',
  updated: '2026-08-20T19:22:19.18627+00:00',
})]

const stories = [
  {
    slug: 'story-one', title: '사람이 읽는 DevSnack Story', excerpt: '직접 만든 결과를 기록한 이야기', published: '2026-08-20T15:00:00+00:00',
    blog_id: 'devsnack' as const, status: 'live' as const, cover_image: null,
  },
  {
    slug: 'story-two', title: '두 번째 Story', excerpt: '두 번째 이야기', published: '2026-08-19T15:00:00+00:00',
    blog_id: 'devsnack' as const, status: 'live' as const, cover_image: null,
  },
]

const projection = createHomeProjection({
  experiments,
  knowledge,
  stories,
  data: {
    aiTech: { slug: 'ai-tech', title: 'AI Tech latest', published: '2026-08-20T15:00:00+00:00', updated: null },
    stockPulse: { slug: 'stock-latest', title: 'StockPulse latest', published: '2026-08-20T15:00:00+00:00', updated: null },

  },
  publicBenchmark: loadPublicBenchmarkRelease(),
})

expectEqual(projection.featured.length, 3, 'Home should keep Featured compact')
expectEqual(projection.featured[0].project?.id, 'ai-omok', 'Featured should use the curated AI Omok representative')
expectEqual(projection.featured[1].benchmark?.asset.assetId, 'post:lab:qwen36-youtube-script-reliability-benchmark', 'Featured should use the newest curated published Benchmark')
expectEqual(projection.featured[2].knowledge?.asset.assetId, 'post:research:qwen3-8-27b-nvfp4-mtp-gguf-gb10', 'Featured should use the curated Qwen Knowledge')
expectEqual(projection.labFinding?.id, 'stockpulse-v1-fixed', 'Home Lab must prioritize the current StockPulse experiment')
expectEqual(getFeaturedExperiment(experiments)?.id, 'stockpulse-v1-fixed', 'Lab featured projection must prioritize StockPulse V1 Fixed')
expectTrue(projection.labItems.every(project => Boolean(project.projectFinding)), 'Home Lab items must contain Project Findings, not activity-only summaries')
expectEqual(projection.featured[1].kind, 'benchmark', 'published Benchmark should be Featured')
expectEqual(projection.featured[1].benchmark?.asset.primaryType, 'benchmark', 'Home Benchmark must retain benchmark primary type')
expectEqual(projection.featured[2].kind, 'knowledge', 'Knowledge should be Featured from the shared selector')
expectEqual(projection.featured[2].knowledge?.asset.primaryType, 'knowledge', 'Knowledge must not be promoted to Benchmark')
expectEqual(projection.knowledge[0].slug, 'qwen3-8-27b-nvfp4-mtp-gguf-gb10', 'curated Knowledge override should win when present')
expectEqual(projection.dataServices.length, 2, 'Home Data strip should represent the remaining feeds')
expectEqual(projection.dataServices.filter(service => service.type === 'Feed').length, 2, 'AI Tech and StockPulse must remain Feeds')
const stockpulseHomeService = projection.dataServices.find(service => service.title === 'StockPulse')
expectEqual(stockpulseHomeService?.href, '/stock', 'StockPulse Feed Hub route must remain /stock')
expectEqual(stockpulseHomeService?.status, 'Morning report · 2026-09-08 · StockPulse V1 Fixed', 'Home StockPulse freshness must use V1 Fixed latest publication')

expectEqual(projection.stories.length, 2, 'Home Stories should stay compact')
expectTrue(projection.stories.every(story => story.href.startsWith('/devsnack/')), 'Home Stories must use existing DevSnack detail URLs')
expectTrue(projection.labItems.length <= 2, 'Home Lab section must not become a project dashboard')

const unknownDataServices = projectHomeDataServices({
  aiTech: null,
  stockPulse: null,

})
expectEqual(unknownDataServices.length, 1, 'Home should keep the current StockPulse service after legacy feed retirement')
expectEqual(unknownDataServices[0].title, 'StockPulse', 'Home should keep StockPulse as the Feed brand')
expectEqual(unknownDataServices[0].status, 'Morning report · 2026-09-08 · StockPulse V1 Fixed', 'Home should use V1 Fixed projection when the legacy snapshot is empty')
expectTrue(unknownDataServices[0].href === '/stock', 'Home StockPulse Feed must retain the /stock Hub route')

console.log(`home projection tests passed: featured=${projection.featured.length}, labItems=${projection.labItems.length}, knowledge=${projection.knowledge.length}, data=${projection.dataServices.length}, stories=${projection.stories.length}`)
