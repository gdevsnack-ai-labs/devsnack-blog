import { BLOG_LABEL, BLOG_PATH, type BlogId } from '../colors'

export type NavGroupId = 'stories' | 'lab' | 'benchmarks' | 'knowledge' | 'data' | 'more'
export type IconKey = 'house' | 'fileText' | 'flask' | 'telescope' | 'wrench' | 'server' | 'play' | 'search' | 'info' | 'link' | 'rss'

export interface NavItem {
  id: string
  href: string
  label: string
  icon?: IconKey
  blogId?: BlogId
  /** Existing content prefixes that should highlight this destination. */
  activeHrefs?: string[]
  /** A disabled registry entry is not rendered into the public navigation. */
  enabled?: boolean
}

export interface NavGroup {
  id: NavGroupId
  label: string
  icon: IconKey
  items: NavItem[]
  enabled?: boolean
  disabledReason?: string
}

export interface NavigationDestination {
  id: string
  href: string
  label: string
  layer: 'hub' | 'collection' | 'content' | 'utility'
  enabled: boolean
}

/**
 * Phase 2 navigation registry. It deliberately contains only destinations
 * that already exist. Benchmarks is kept as a disabled registry entry until
 * the Phase 3 `/benchmarks` hub exists.
 */
export const NAV_GROUP_REGISTRY: NavGroup[] = [
  {
    id: 'stories',
    label: 'Stories',
    icon: 'fileText',
    items: [
      { id: 'stories-devsnack', href: BLOG_PATH.devsnack, label: 'DevSnack', blogId: 'devsnack' },
    ],
  },
  {
    id: 'lab',
    label: 'Lab',
    icon: 'flask',
    items: [
      {
        id: 'lab-experiments',
        href: '/labs',
        label: 'Experiments',
        activeHrefs: ['/labs', '/lab'],
      },
      { id: 'lab-showcase', href: '/demos', label: 'Showcase', icon: 'play' },
    ],
  },
  {
    id: 'benchmarks',
    label: 'Benchmarks',
    icon: 'fileText',
    items: [
      { id: 'benchmarks-hub', href: '/benchmarks', label: 'Benchmarks Hub' },
    ],
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    icon: 'telescope',
    items: [
      { id: 'knowledge-all', href: BLOG_PATH.research, label: 'All Knowledge', blogId: 'research' },
      { id: 'knowledge-llm', href: '/research/category/llm', label: 'AI / LLM' },
      { id: 'knowledge-tts', href: '/research/category/tts', label: 'TTS' },
      { id: 'knowledge-media', href: '/research/category/media', label: 'Image / Video / Audio' },
      { id: 'knowledge-benchmark-research', href: '/research/category/benchmark', label: 'Benchmark Research' },
      { id: 'knowledge-hardware-other', href: '/research/category/hardware', label: 'Hardware / Other' },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    icon: 'server',
    items: [
      { id: 'data-hub', href: '/data', label: 'Data Hub' },
      { id: 'data-aitech', href: BLOG_PATH.aitech, label: 'AI Tech', blogId: 'aitech' },
      { id: 'data-stockpulse', href: BLOG_PATH.stockpulse, label: 'StockPulse', blogId: 'stockpulse' },
      { id: 'data-realestate', href: BLOG_PATH.realestate, label: 'Real Estate', blogId: 'realestate' },
      { id: 'data-mining', href: '/misc/mining-leaderboard', label: 'Mining' },
    ],
  },
  {
    id: 'more',
    label: 'More',
    icon: 'info',
    items: [
      { id: 'more-search', href: '/search', label: 'Search', icon: 'search' },
      { id: 'more-about', href: '/about', label: 'About', icon: 'info' },
      { id: 'more-links', href: '/links', label: 'Links', icon: 'link' },
      { id: 'more-rss', href: '/rss.xml', label: 'RSS', icon: 'rss' },
      { id: 'more-contact', href: '/contact', label: 'Contact' },
      { id: 'more-privacy', href: '/privacy', label: 'Privacy' },
      { id: 'more-sandbox', href: BLOG_PATH.misc, label: 'Sandbox / Misc', blogId: 'misc' },
      { id: 'more-operations', href: '/tools/operations', label: 'Operations', icon: 'server' },
    ],
  },
]

/** Enabled desktop groups only. Disabled destinations never become dead links. */
export const NAV_GROUPS: NavGroup[] = NAV_GROUP_REGISTRY.filter(group => group.enabled !== false)

/** Mobile keeps the same semantic source but places Benchmarks inside More if tabs would be crowded. */
export const MOBILE_NAV_GROUPS: NavGroup[] = NAV_GROUPS
  .filter(group => group.id !== 'benchmarks')
  .map(group => group.id === 'more'
    ? {
        ...group,
        items: [
          { id: 'more-benchmarks', href: '/benchmarks', label: 'Benchmarks' },
          ...group.items,
        ],
      }
    : group)

export const SINGLE_NAV_ITEMS: NavItem[] = [
  { id: 'home', href: '/', label: 'Home', icon: 'house' },
]

export const NAV_DESTINATIONS: NavigationDestination[] = [
  { id: 'home', href: '/', label: 'Home', layer: 'hub', enabled: true },
  { id: 'stories', href: BLOG_PATH.devsnack, label: 'Stories', layer: 'collection', enabled: true },
  { id: 'lab', href: '/labs', label: 'Lab', layer: 'hub', enabled: true },
  { id: 'benchmarks', href: '/benchmarks', label: 'Benchmarks', layer: 'hub', enabled: true },
  { id: 'knowledge', href: BLOG_PATH.research, label: 'Knowledge', layer: 'collection', enabled: true },
  { id: 'data', href: '/data', label: 'Data', layer: 'collection', enabled: true },
  { id: 'more', href: '/search', label: 'More', layer: 'utility', enabled: true },
]

export function activeHrefMatches(pathname: string, item: Pick<NavItem, 'href' | 'activeHrefs'>): boolean {
  const prefixes = [item.href, ...(item.activeHrefs || [])]
  return prefixes.some(href => href === '/' ? pathname === '/' : pathname.startsWith(href))
}

export function enabledNavigationItems(groups: readonly NavGroup[] = NAV_GROUPS): NavItem[] {
  return groups.flatMap(group => group.items.filter(item => item.enabled !== false))
}

export function navigationDestinationById(id: string): NavigationDestination | undefined {
  return NAV_DESTINATIONS.find(destination => destination.id === id)
}

export { BLOG_LABEL }
export type { BlogId }
