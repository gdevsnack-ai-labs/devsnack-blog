export const AUTOMATED_FEED_BLOG_IDS = ['aitech', 'stockpulse'] as const

export type AutomatedFeedBlogId = (typeof AUTOMATED_FEED_BLOG_IDS)[number]
export type FeedLifecycleStatus = 'live' | 'consolidated' | 'archived' | 'purge_candidate'

export interface FeedLifecyclePostLike {
  blog_id?: string | null
  status?: string | null
  lifecycle_status?: FeedLifecycleStatus | string | null
}

const AUTOMATED_FEED_BLOG_ID_SET = new Set<string>(AUTOMATED_FEED_BLOG_IDS)

export function isAutomatedFeedBlog(blogId?: string | null): blogId is AutomatedFeedBlogId {
  return Boolean(blogId && AUTOMATED_FEED_BLOG_ID_SET.has(blogId))
}

/**
 * Return the equality filters used by a feed-specific public list query.
 * Stories intentionally retain their existing status-only policy.
 */
export function feedListFilters(blogId: string): Record<string, string> {
  const filters: Record<string, string> = {
    blog_id: blogId,
    status: 'live',
  }
  if (isAutomatedFeedBlog(blogId)) filters.lifecycle_status = 'live'
  return filters
}

export function feedDetailFilters(blogId: string): Record<string, string> {
  return {
    blog_id: blogId,
    status: 'live',
  }
}

/**
 * PostgREST OR expression for a global public-post query.
 * The status=live equality must still be applied separately.
 */
export function publicFeedOrFilter(): string {
  return `blog_id.not.in.(${AUTOMATED_FEED_BLOG_IDS.join(',')}),lifecycle_status.eq.live`
}

/**
 * Whether a row may appear in a public Feed list/index projection.
 * Detail URL accessibility is deliberately handled by a different helper.
 */
export function isFeedListable(post: FeedLifecyclePostLike): boolean {
  if (post.status !== 'live') return false
  if (!isAutomatedFeedBlog(post.blog_id)) return true
  return post.lifecycle_status === 'live'
}

/**
 * Whether a Feed detail route may render before the later URL lifecycle phase.
 * A live row remains directly accessible regardless of retention lifecycle.
 */
export function isFeedDetailAccessible(post: FeedLifecyclePostLike, expectedBlogId?: string): boolean {
  if (post.status !== 'live') return false
  if (expectedBlogId && post.blog_id !== expectedBlogId) return false
  return isAutomatedFeedBlog(post.blog_id) || post.blog_id === 'devsnack'
}
