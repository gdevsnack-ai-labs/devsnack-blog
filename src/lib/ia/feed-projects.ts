export interface FeedProjectLink {
  projectId: string
  href: string
  label: string
}

const FEED_PROJECTS: Record<string, FeedProjectLink> = {}

export function feedProjectForBlog(blogId: string): FeedProjectLink | null {
  return FEED_PROJECTS[blogId] || null
}
