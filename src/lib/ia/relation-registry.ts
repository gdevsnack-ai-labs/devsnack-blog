import { projectRef } from './project-catalog'
import type { AssetRelation } from './types'

const postRef = (blogId: string, slug: string) => `post:${blogId}:${slug}`
const demoRef = (category: string, id: string) => `demo:${category}:${id}`
const findingRef = (projectId: string) => `finding:${projectId}:key`

/**
 * Initial, explicit relations only. This registry is intentionally small:
 * uncertain relationships remain unclassified instead of being guessed.
 */
export const ASSET_RELATIONS: AssetRelation[] = [
  {
    from: projectRef('autonomous-ai-blog'),
    relation: 'produces',
    to: findingRef('autonomous-ai-blog'),
  },
  {
    from: 'post:research:dflash-2-qwen3-8-27b-vs-mtp',
    relation: 'informs',
    to: projectRef('local-llm-benchmark'),
  },
  {
    from: 'post:research:qwen3-8-27b-nvfp4-mtp-gguf-gb10',
    relation: 'informs',
    to: projectRef('local-llm-benchmark'),
  },
  {
    from: projectRef('local-llm-benchmark'),
    relation: 'produces',
    to: findingRef('local-llm-benchmark'),
  },
  {
    from: projectRef('local-llm-benchmark'),
    relation: 'published_as',
    to: postRef('lab', 'local-llm-benchmark-report'),
  },
  {
    from: projectRef('local-llm-benchmark'),
    relation: 'published_as',
    to: postRef('lab', 'qwen36-youtube-script-reliability-benchmark'),
  },
  {
    from: projectRef('local-llm-benchmark'),
    relation: 'published_as',
    to: postRef('lab', 'ornith15-server-quality-speed-benchmark'),
  },
  {
    from: postRef('research', 'ornith-1-5-gguf-gb10'),
    relation: 'informs',
    to: projectRef('local-llm-benchmark'),
  },
  {
    from: projectRef('local-llm-benchmark'),
    relation: 'outputs',
    to: demoRef('html', 'ragdoll-playground-qwen3.8'),
  },
  {
    from: projectRef('local-llm-benchmark'),
    relation: 'outputs',
    to: demoRef('html', 'stock-dashboard-qwen3.8'),
  },
  {
    from: projectRef('local-llm-benchmark'),
    relation: 'outputs',
    to: demoRef('html', 'html-in-canvas'),
  },
  {
    from: projectRef('ai-omok'),
    relation: 'produces',
    to: findingRef('ai-omok'),
  },
  {
    from: projectRef('ai-omok'),
    relation: 'published_as',
    to: postRef('devsnack', 'ai-llm-omok-experiment'),
  },
  {
    from: projectRef('ai-omok'),
    relation: 'published_as',
    to: postRef('devsnack', 'ai-built-gomoku-engine-vs-rapfi'),
  },
  {
    from: postRef('devsnack', 'ai-llm-omok-experiment'),
    relation: 'informs',
    to: projectRef('ai-omok'),
  },
  {
    from: postRef('devsnack', 'ml-ai'),
    relation: 'informs',
    to: projectRef('ai-omok'),
  },
  {
    from: projectRef('local-llm-benchmark'),
    relation: 'published_as',
    to: postRef('devsnack', 'ornith-10-35b-5-agentic-coding-9-gguf'),
  },
  {
    from: projectRef('local-llm-benchmark'),
    relation: 'published_as',
    to: postRef('devsnack', 'dgx-spark-gb10-north-mini-code-10-gguf-9_01353512936'),
  },
  {
    from: projectRef('local-llm-benchmark'),
    relation: 'published_as',
    to: postRef('devsnack', 'nex-n2-mini-ud-bartowski'),
  },
  {
    from: projectRef('local-llm-benchmark'),
    relation: 'published_as',
    to: postRef('devsnack', 'nvidia-dgx-spark-gb10-nex-n2-mini-gguf-6'),
  },
  {
    from: projectRef('local-llm-benchmark'),
    relation: 'published_as',
    to: postRef('devsnack', 'nvidia-dgx-spark-gb10-gguf-4'),
  },
  {
    from: projectRef('local-llm-benchmark'),
    relation: 'published_as',
    to: postRef('devsnack', 'gemma-4-mtp-drafter-dgx-spark-3-31b'),
  },
  {
    from: projectRef('local-llm-benchmark'),
    relation: 'published_as',
    to: postRef('devsnack', 'dgx-spark-qwen36-llamacpp-vllm-dflash'),
  },
  {
    from: postRef('devsnack', 'googledrive-as-a-mediaserver'),
    relation: 'informs',
    to: projectRef('blog'),
  },
  {
    from: projectRef('stockpulse-ai-self-improvement'),
    relation: 'produces',
    to: findingRef('stockpulse-ai-self-improvement'),
  },
  {
    from: projectRef('stockpulse-ai-self-improvement'),
    relation: 'published_as',
    to: postRef('lab', 'stockpulse-self-2026-08-21'),
  },
  {
    from: projectRef('isekai-instagram-mage-experiment'),
    relation: 'produces',
    to: findingRef('isekai-instagram-mage-experiment'),
  },
  {
    from: projectRef('isekai-instagram-mage-experiment'),
    relation: 'published_as',
    to: postRef('lab', 'isekai-instagram-mage-prologue'),
  },
  {
    from: projectRef('isekai-instagram-mage-experiment'),
    relation: 'outputs',
    to: demoRef('shortmovie', 'isekai-instagram-mage-prologue'),
  },
  {
    from: projectRef('hermes-memory'),
    relation: 'produces',
    to: findingRef('hermes-memory'),
  },
  {
    from: projectRef('hermes-memory'),
    relation: 'published_as',
    to: postRef('lab', 'hermes-memory-experiment'),
  },
  {
    from: projectRef('luna-agentic-game-dev'),
    relation: 'produces',
    to: findingRef('luna-agentic-game-dev'),
  },
  {
    from: projectRef('luna-agentic-game-dev'),
    relation: 'published_as',
    to: postRef('lab', 'luna-agentic-game-dev-e2e'),
  },
  {
    from: projectRef('ai-game-assets-sprite-lab'),
    relation: 'produces',
    to: findingRef('ai-game-assets-sprite-lab'),
  },
  {
    from: projectRef('ai-game-assets-sprite-lab'),
    relation: 'outputs',
    to: demoRef('html', 'ai-game-assets-sprite-lab'),
  },
]
