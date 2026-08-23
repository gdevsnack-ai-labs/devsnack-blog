import { experiments, type Experiment } from '../../data/experiments'
import type { Domain, ProjectLifecycle, ProjectProjection } from './types'

type ProjectOverride = {
  domain: Domain[]
  lifecycle?: ProjectLifecycle
  isOpenEnded?: boolean
}

const PROJECT_OVERRIDES: Record<string, ProjectOverride> = {
  'ai-omok': {
    domain: ['game_ai', 'inference'],
    isOpenEnded: true,
  },
  'stockpulse-ai-self-improvement': {
    domain: ['finance', 'automation'],
    lifecycle: 'active',
    isOpenEnded: true,
  },
  blog: {
    domain: ['automation', 'infrastructure'],
    lifecycle: 'active',
    isOpenEnded: true,
  },
  'local-llm-benchmark': {
    domain: ['llm', 'inference', 'hardware'],
    lifecycle: 'testing',
    isOpenEnded: true,
  },
  'hermes-memory': {
    domain: ['agent_memory', 'automation'],
    lifecycle: 'active',
    isOpenEnded: true,
  },
  'isekai-instagram-mage-experiment': {
    domain: ['creative_ai', 'media'],
    lifecycle: 'completed',
    isOpenEnded: false,
  },
  'music-qa': {
    domain: ['media', 'automation'],
    lifecycle: 'idea',
    isOpenEnded: false,
  },
  hook: {
    domain: ['media', 'automation'],
    lifecycle: 'idea',
    isOpenEnded: false,
  },
}

function lifecycleFromLegacy(experiment: Experiment): ProjectLifecycle {
  if (experiment.status === '보류') return 'paused'
  if (experiment.category === 'planning') return 'idea'
  if (experiment.category === 'completed' || experiment.status === '완료') return 'completed'
  return 'active'
}

function projectFromExperiment(experiment: Experiment): ProjectProjection {
  const override = PROJECT_OVERRIDES[experiment.id]
  return {
    id: experiment.id,
    title: experiment.name,
    purpose: experiment.whyText || experiment.description,
    domain: override?.domain || ['other'],
    lifecycle: override?.lifecycle || lifecycleFromLegacy(experiment),
    isOpenEnded: override?.isOpenEnded ?? false,
    source: 'experiments.ts',
    legacyStatus: experiment.status,
    legacyCategory: experiment.category,
    isDummy: Boolean(experiment.isDummy),
  }
}

/**
 * Read-only semantic projection of the legacy Experiment registry.
 * The original `experiments.ts` remains the source for existing pages.
 */
export const PROJECT_CATALOG: ProjectProjection[] = experiments.map(projectFromExperiment)

export function getProjectProjection(projectId: string): ProjectProjection | undefined {
  return PROJECT_CATALOG.find(project => project.id === projectId)
}

export function projectRef(projectId: string): string {
  return `project:${projectId}`
}
