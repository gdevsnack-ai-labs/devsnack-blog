import { BENCHMARK_PROJECTIONS, getLabCollection, getLabProjectProjections, projectKnowledgePost } from './hub-projections'
import { experiments } from '@/data/experiments'

function expectEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`)
}

function expectTrue(value: boolean, message: string) {
  if (!value) throw new Error(message)
}

expectEqual(BENCHMARK_PROJECTIONS.length, 2, 'curated published Benchmarks should be exposed')
expectEqual(BENCHMARK_PROJECTIONS[0].asset.assetId, 'post:lab:qwen36-youtube-script-reliability-benchmark', 'newest YouTube reliability Benchmark should lead the collection')
expectEqual(BENCHMARK_PROJECTIONS[0].asset.primaryType, 'benchmark', 'Benchmark Hub assets must keep benchmark primary type')
expectEqual(getLabCollection('local-llm-benchmark'), undefined, 'Local LLM Benchmark must not be duplicated as a generic Lab Experiment')
expectEqual(getLabCollection('ai-omok'), 'experiments', 'AI Omok must remain an Experiment')
expectEqual(getLabCollection('blog'), 'builds-systems', 'Blog Automation must project to Builds & Systems')
expectEqual(getLabCollection('hook'), 'builds-systems', 'Hook Engine must project to Builds & Systems')
expectEqual(getLabCollection('isekai-instagram-mage-experiment'), 'creative-tests', 'Isekai must project to Creative Tests')

const labProjects = getLabProjectProjections(experiments)
expectEqual(labProjects.find(project => project.id === 'blog')?.displayType, 'System', 'Blog Automation must be labeled System')
expectEqual(labProjects.find(project => project.id === 'hook')?.displayType, 'Build', 'Hook Engine must be labeled Build')
expectEqual(labProjects.find(project => project.id === 'isekai-instagram-mage-experiment')?.displayType, 'Creative Test', 'Isekai must be labeled Creative Test')

const knowledge = projectKnowledgePost({
  slug: 'dflash-2-qwen3-8-27b-vs-mtp',
  title: 'DFlash 2 + Qwen3.8-27B 비교 조사',
  blog_id: 'research',
  status: 'live',
  labels: ['조사완료', 'llm'],
  excerpt: 'DFlash 조사',
  published: '2026-08-18T15:00:00+00:00',
  updated: '2026-08-20T19:22:19.18627+00:00',
})
expectEqual(knowledge.asset.primaryType, 'knowledge', 'Research asset must remain Knowledge')
expectEqual(knowledge.domain, 'ai-llm', 'LLM research must project to AI / LLM')
expectEqual(knowledge.benchmarkResearch, false, 'LLM research must not become Benchmark Result')

const benchmarkResearch = projectKnowledgePost({
  slug: 'herdr-yc-f26',
  title: 'Herdr — 에이전트 런타임/멀티플렉서',
  blog_id: 'research',
  status: 'live',
  labels: ['조사완료', 'benchmark'],
  excerpt: 'Agent runtime research',
  published: '2026-08-12T15:00:00+00:00',
  updated: '2026-08-20T19:22:21.603265+00:00',
})
expectEqual(benchmarkResearch.asset.primaryType, 'knowledge', 'legacy benchmark research must stay Knowledge')
expectEqual(benchmarkResearch.benchmarkResearch, true, 'legacy benchmark category must be visibly separated as Benchmark Research')
expectEqual(benchmarkResearch.domain, 'agent-memory', 'Herdr must project to Agent / Memory')
expectTrue(BENCHMARK_PROJECTIONS.every(item => item.asset.primaryType === 'benchmark'), 'Research records must not be auto-promoted to Benchmark assets')

console.log(`hub projection tests passed: benchmarks=${BENCHMARK_PROJECTIONS.length}, labProjects=${labProjects.length}`)
