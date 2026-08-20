import { BLOG_LABEL, BLOG_PATH, type BlogId } from '@/lib/colors'

export type DestinationId = 'home' | BlogId | 'demos' | 'operations'
export type NavGroupId = 'blogs' | 'lab' | 'research' | 'tools' | 'more'
export type IconKey = 'house' | 'fileText' | 'flask' | 'telescope' | 'wrench' | 'server' | 'play' | 'search' | 'info' | 'link' | 'rss'

export interface NavItem {
  id: string
  href: string
  label: string
  icon?: IconKey
  blogId?: BlogId
}

export interface NavGroup {
  id: NavGroupId
  label: string
  icon: IconKey
  items: NavItem[]
}

export const DESTINATION_META: Record<DestinationId, {
  path: string
  label: string
  kind: 'home' | 'blog' | 'lab' | 'research' | 'tool' | 'demo'
  navGroup?: NavGroupId
}> = {
  home: { path: '/', label: 'Home', kind: 'home' },
  devsnack: { path: BLOG_PATH.devsnack, label: BLOG_LABEL.devsnack, kind: 'blog', navGroup: 'blogs' },
  stockpulse: { path: BLOG_PATH.stockpulse, label: BLOG_LABEL.stockpulse, kind: 'blog', navGroup: 'blogs' },
  aitech: { path: BLOG_PATH.aitech, label: BLOG_LABEL.aitech, kind: 'blog', navGroup: 'blogs' },
  lab: { path: BLOG_PATH.lab, label: BLOG_LABEL.lab, kind: 'lab', navGroup: 'lab' },
  research: { path: BLOG_PATH.research, label: BLOG_LABEL.research, kind: 'research', navGroup: 'research' },
  realestate: { path: BLOG_PATH.realestate, label: BLOG_LABEL.realestate, kind: 'tool', navGroup: 'tools' },
  misc: { path: BLOG_PATH.misc, label: BLOG_LABEL.misc, kind: 'tool', navGroup: 'tools' },
  operations: { path: '/tools/operations', label: '운영중인 시스템', kind: 'tool', navGroup: 'tools' },
  demos: { path: '/demos', label: 'Demos', kind: 'demo', navGroup: 'lab' },
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'blogs',
    label: 'Blogs',
    icon: 'fileText',
    items: [
      { id: 'devsnack', href: DESTINATION_META.devsnack.path, label: 'DevSnack', blogId: 'devsnack' },
      { id: 'stockpulse', href: DESTINATION_META.stockpulse.path, label: 'StockPulse', blogId: 'stockpulse' },
      { id: 'aitech', href: DESTINATION_META.aitech.path, label: 'AI Tech', blogId: 'aitech' },
    ],
  },
  {
    id: 'lab',
    label: 'Lab',
    icon: 'flask',
    items: [
      { id: 'lab', href: DESTINATION_META.lab.path, label: 'Experiments' },
      { id: 'demos', href: DESTINATION_META.demos.path, label: 'Demos', icon: 'play' },
    ],
  },
  {
    id: 'research',
    label: 'Research',
    icon: 'telescope',
    items: [
      { id: 'research-all', href: '/research', label: '전체' },
      { id: 'research-llm', href: '/research/category/llm', label: '🤖 LLM/모델' },
      { id: 'research-tts', href: '/research/category/tts', label: '🎙️ TTS' },
      { id: 'research-media', href: '/research/category/media', label: '🎨 미디어' },
      { id: 'research-benchmark', href: '/research/category/benchmark', label: '📊 벤치마크' },
      { id: 'research-hardware', href: '/research/category/hardware', label: '🖥️ 하드웨어' },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: 'wrench',
    items: [
      { id: 'realestate', href: DESTINATION_META.realestate.path, label: '부동산 데이터', blogId: 'realestate' },
      { id: 'misc', href: DESTINATION_META.misc.path, label: 'Junk Drawer', blogId: 'misc' },
      { id: 'operations', href: DESTINATION_META.operations.path, label: '운영중인 시스템', icon: 'server' },
    ],
  },
  {
    id: 'more',
    label: 'More',
    icon: 'info',
    items: [
      { id: 'search', href: '/search', label: '검색', icon: 'search' },
      { id: 'links', href: '/links', label: 'Links', icon: 'link' },
      { id: 'about', href: '/about', label: 'About', icon: 'info' },
      { id: 'rss', href: '/rss.xml', label: 'RSS', icon: 'rss' },
      { id: 'privacy', href: '/privacy', label: '개인정보처리방침' },
      { id: 'contact', href: '/contact', label: '문의' },
    ],
  },
]

export const SINGLE_NAV_ITEMS: NavItem[] = [
  { id: 'home', href: '/', label: 'Home', icon: 'house' },
]

export const MOBILE_NAV_GROUPS = NAV_GROUPS.filter(group => group.id !== 'more' || group.items.length > 0)

export function getDestinationPath(id: string): string | null {
  if (id === 'home') return DESTINATION_META.home.path
  if (id === 'demos') return DESTINATION_META.demos.path
  if (id === 'operations') return DESTINATION_META.operations.path
  if (id in BLOG_PATH) return BLOG_PATH[id as BlogId]
  return null
}

export function postHref(blogId: string, slug: string): string | null {
  const path = getDestinationPath(blogId)
  return path ? `${path}/${slug}` : null
}

export function destinationLabel(blogId: string): string {
  if (blogId in BLOG_LABEL) return BLOG_LABEL[blogId as BlogId]
  return blogId
}
