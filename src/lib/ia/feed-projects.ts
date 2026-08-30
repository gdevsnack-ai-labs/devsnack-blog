export interface FeedProjectLink {
  projectId: string
  href: string
  label: string
}

const FEED_PROJECTS: Record<string, FeedProjectLink> = {
  stockpulse: {
    projectId: 'stockpulse-ai-self-improvement',
    href: '/labs/stockpulse-ai-self-improvement',
    label: 'StockPulse 자기개선 실험',
  },
}

export function feedProjectForBlog(blogId: string): FeedProjectLink | null {
  return FEED_PROJECTS[blogId] || null
}
