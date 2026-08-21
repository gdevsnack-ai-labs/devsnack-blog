import { PROJECT_CATALOG, projectRef } from './project-catalog'
import { buildAssetCatalog } from './asset-catalog'
import {
  ASSET_LIFECYCLES,
  ASSET_ROLES,
  DOMAINS,
  PRIMARY_TYPES,
  PROVENANCES,
  PROJECT_LIFECYCLES,
  RELATION_TYPES,
  type AssetRef,
  type AssetRelation,
  type IAFoundation,
  type LegacyPostLike,
} from './public-types'

export * from './types'
export * from './project-catalog'
export * from './asset-catalog'
export * from './relation-registry'

const PROJECT_KEYS = new Set(PROJECT_CATALOG.map(project => projectRef(project.id)))

function relationEndpointExists(endpoint: string, assets: readonly AssetRef[]): boolean {
  if (PROJECT_KEYS.has(endpoint)) return true
  return assets.some(asset => asset.assetId === endpoint)
}

export function validateIAFoundation(foundation: IAFoundation): string[] {
  const errors: string[] = []
  const projectIds = new Set<string>()
  const assetIds = new Set<string>()

  for (const project of foundation.projects) {
    if (projectIds.has(project.id)) errors.push(`duplicate project: ${project.id}`)
    projectIds.add(project.id)
    if (!project.title.trim()) errors.push(`project title is empty: ${project.id}`)
    if (project.domain.length === 0) errors.push(`project domain is empty: ${project.id}`)
  }

  for (const asset of foundation.assets) {
    if (assetIds.has(asset.assetId)) errors.push(`duplicate asset: ${asset.assetId}`)
    assetIds.add(asset.assetId)
    if (!asset.route) errors.push(`asset route is empty: ${asset.assetId}`)
    if (!PRIMARY_TYPES.includes(asset.primaryType)) errors.push(`invalid primary type: ${asset.assetId}`)
    if (asset.projectId && !projectIds.has(asset.projectId)) {
      errors.push(`unknown project for asset ${asset.assetId}: ${asset.projectId}`)
    }
  }

  for (const relation of foundation.relations) {
    if (!relationEndpointExists(relation.from, foundation.assets)) errors.push(`unknown relation source: ${relation.from}`)
    if (!relationEndpointExists(relation.to, foundation.assets)) errors.push(`unknown relation target: ${relation.to}`)
    if (!RELATION_TYPES.includes(relation.relation)) errors.push(`invalid relation: ${relation.relation}`)
  }

  return errors
}

export function createIAFoundation(posts: readonly LegacyPostLike[] = [], relations: readonly AssetRelation[] = []): IAFoundation {
  return {
    projects: PROJECT_CATALOG,
    assets: buildAssetCatalog(posts),
    relations: [...relations],
  }
}

export {
  ASSET_ROLES,
  ASSET_LIFECYCLES,
  DOMAINS,
  PRIMARY_TYPES,
  PROVENANCES,
  PROJECT_LIFECYCLES,
}
