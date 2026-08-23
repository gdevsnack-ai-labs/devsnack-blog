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
]
