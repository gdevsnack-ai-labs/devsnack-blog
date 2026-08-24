import { BLOG_LABEL, BLOG_PATH, type BlogId } from '@/lib/colors'

export {
  NAV_DESTINATIONS,
  NAV_GROUP_REGISTRY,
  NAV_GROUPS,
  MOBILE_NAV_GROUPS,
  SINGLE_NAV_ITEMS,
  activeHrefMatches,
  enabledNavigationItems,
  navigationDestinationById,
} from '@/lib/ia/navigation-projection'
export type {
  IconKey,
  NavGroup,
  NavGroupId,
  NavItem,
  NavigationDestination,
} from '@/lib/ia/navigation-projection'

/** Legacy destination identifiers retained for content URL resolution. */
export type DestinationId = 'home' | BlogId | 'demos' | 'operations'

/**
 * Legacy destination metadata remains available to callers that still need
 * the old blog_id/path vocabulary. Navigation groups are now projected from
 * `src/lib/ia/navigation-projection.ts` instead.
 */
export const DESTINATION_META: Record<DestinationId, {
  path: string
  label: string
  kind: 'home' | 'blog' | 'lab' | 'research' | 'tool' | 'demo'
  navGroup?: string
}> = {
  home: { path: '/', label: 'Home', kind: 'home' },
  devsnack: { path: BLOG_PATH.devsnack, label: BLOG_LABEL.devsnack, kind: 'blog', navGroup: 'stories' },
  stockpulse: { path: BLOG_PATH.stockpulse, label: BLOG_LABEL.stockpulse, kind: 'blog', navGroup: 'data' },
  aitech: { path: BLOG_PATH.aitech, label: BLOG_LABEL.aitech, kind: 'blog', navGroup: 'data' },
  lab: { path: BLOG_PATH.lab, label: BLOG_LABEL.lab, kind: 'lab', navGroup: 'lab' },
  research: { path: BLOG_PATH.research, label: BLOG_LABEL.research, kind: 'research', navGroup: 'knowledge' },
  realestate: { path: BLOG_PATH.realestate, label: BLOG_LABEL.realestate, kind: 'tool', navGroup: 'data' },
  misc: { path: BLOG_PATH.misc, label: BLOG_LABEL.misc, kind: 'tool', navGroup: 'more' },
  operations: { path: '/tools/operations', label: '운영중인 시스템', kind: 'tool', navGroup: 'more' },
  demos: { path: '/demos', label: 'Showcase', kind: 'demo', navGroup: 'lab' },
}

export function getDestinationPath(id: string): string | null {
  if (id === 'home') return DESTINATION_META.home.path
  if (id === 'demos') return DESTINATION_META.demos.path
  if (id === 'operations') return DESTINATION_META.operations.path
  if (id in BLOG_PATH) return BLOG_PATH[id as BlogId]
  return null
}

/** Existing content URL resolver. Do not use this for hub navigation paths. */
export function postHref(blogId: string, slug: string): string | null {
  const path = getDestinationPath(blogId)
  return path ? `${path}/${slug}` : null
}

export function destinationLabel(blogId: string): string {
  if (blogId in BLOG_LABEL) return BLOG_LABEL[blogId as BlogId]
  return blogId
}
