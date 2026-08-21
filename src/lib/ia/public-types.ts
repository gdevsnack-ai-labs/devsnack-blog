// Compatibility re-export kept separate so the IA entrypoint can be imported
// by future server/client projections without exposing implementation details.
export type {
  AssetRef,
  AssetRelation,
  IAFoundation,
  LegacyPostLike,
  ProjectProjection,
} from './types'

export {
  ASSET_ROLES,
  ASSET_LIFECYCLES,
  DOMAINS,
  PRIMARY_TYPES,
  PROVENANCES,
  PROJECT_LIFECYCLES,
  RELATION_TYPES,
} from './types'
