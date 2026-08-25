export interface FeedProjectLink {
  projectId: string
  href: string
  label: string
}

const FEED_PROJECTS: Record<string, FeedProjectLink> = {
  aitech: {
    projectId: 'blog',
    href: '/labs/blog',
    label: 'AI Tech 자동화 시스템',
  },
  stockpulse: {
    projectId: 'stockpulse-ai-self-improvement',
    href: '/labs/stockpulse-ai-self-improvement',
    label: 'StockPulse 자기개선 실험',
  },
}

export function feedProjectForBlog(blogId: string): FeedProjectLink | null {
  return FEED_PROJECTS[blogId] || null
}
