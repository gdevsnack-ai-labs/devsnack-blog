export const PRIMARY_TYPES = [
  'story',
  'experiment',
  'benchmark',
  'build',
  'system',
  'creative_test',
  'showcase',
  'knowledge',
  'feed',
  'dataset',
  'tracker',
] as const

export type PrimaryType = (typeof PRIMARY_TYPES)[number]

export const DOMAINS = [
  'llm',
  'inference',
  'game_ai',
  'agent_memory',
  'media',
  'creative_ai',
  'infrastructure',
  'automation',
  'finance',
  'hardware',
  'web',
  'other',
] as const

export type Domain = (typeof DOMAINS)[number]

/**
 * `ai_generated` is kept explicit because generated creative artifacts are
 * not necessarily produced by a deterministic automated publishing job.
 */
export const PROVENANCES = [
  'human',
  'ai_assisted',
  'automated',
  'data_generated',
  'ai_generated',
] as const

export type Provenance = (typeof PROVENANCES)[number]

export const PROJECT_LIFECYCLES = [
  'idea',
  'building',
  'testing',
  'active',
  'paused',
  'completed',
  'archived',
] as const

export type ProjectLifecycle = (typeof PROJECT_LIFECYCLES)[number]

export const ASSET_LIFECYCLES = [
  'draft',
  'active',
  'testing',
  'paused',
  'completed',
  'archived',
] as const

export type AssetLifecycle = (typeof ASSET_LIFECYCLES)[number]

/** A semantic role inside an Asset, not an additional primary Type. */
export const ASSET_ROLES = [
  'summary',
  'run',
  'finding',
  'result',
  'plan',
  'artifact',
  'report',
] as const

export type AssetRole = (typeof ASSET_ROLES)[number]

export const RELATION_TYPES = [
  'informs',
  'measures',
  'produces',
  'published_as',
  'implemented_in',
  'derived_from',
  'supports',
  'outputs',
] as const

export type RelationType = (typeof RELATION_TYPES)[number]

export type Classification = 'confirmed' | 'inferred' | 'ambiguous'
export type AssetSource = 'experiment' | 'demo' | 'post' | 'research' | 'misc' | 'data' | 'manual'

export interface LegacyPostLike {
  slug: string
  title: string
  blog_id: string
  labels?: readonly string[] | null
  status?: string | null
}

export interface ProjectProjection {
  id: string
  title: string
  purpose: string
  domain: Domain[]
  lifecycle: ProjectLifecycle
  isOpenEnded: boolean
  source: 'experiments.ts'
  legacyStatus: string
  legacyCategory: string
  isDummy: boolean
}

export interface AssetRef {
  assetId: string
  route: string
  title?: string
  primaryType: PrimaryType
  role?: AssetRole
  projectId?: string
  domain?: Domain[]
  provenance?: Provenance
  lifecycle?: AssetLifecycle
  source?: AssetSource
  classification?: Classification
  artifactHref?: string
}

export interface AssetRelation {
  from: string
  relation: RelationType
  to: string
}

export interface IAFoundation {
  projects: ProjectProjection[]
  assets: AssetRef[]
  relations: AssetRelation[]
}
