import { assetFromLegacyPost } from './asset-catalog'

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`)
}

const benchmark = assetFromLegacyPost({
  slug: 'nvidia-dgx-spark-gb10-gguf-4',
  title: 'GGUF benchmark',
  blog_id: 'devsnack',
  status: 'live',
})
assertEqual(benchmark.primaryType, 'benchmark', 'legacy DevSnack benchmark should project to Benchmark')
assertEqual(benchmark.projectId, 'local-llm-benchmark', 'legacy benchmark should reuse the existing project')

const knowledge = assetFromLegacyPost({
  slug: 'comfyui',
  title: 'ComfyUI guide',
  blog_id: 'devsnack',
  status: 'live',
})
assertEqual(knowledge.primaryType, 'knowledge', 'legacy DevSnack guide should project to Knowledge')

const experiment = assetFromLegacyPost({
  slug: 'ai-llm-omok-experiment',
  title: 'Omok experiment',
  blog_id: 'devsnack',
  status: 'live',
})
assertEqual(experiment.primaryType, 'experiment', 'Omok experiment should project to Experiment')
assertEqual(experiment.projectId, 'ai-omok', 'Omok experiment should reuse AI Omok project')

const showcase = assetFromLegacyPost({
  slug: 'html5-poop-dodge-game',
  title: 'HTML5 game',
  blog_id: 'devsnack',
  status: 'live',
})
assertEqual(showcase.primaryType, 'showcase', 'standalone game should project to Showcase')

const story = assetFromLegacyPost({
  slug: 'unmapped-story',
  title: 'Story',
  blog_id: 'devsnack',
  status: 'live',
})
assertEqual(story.primaryType, 'story', 'unmapped DevSnack content should remain Story')

console.log('story reclassification tests passed')
