// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { isIndexablePostSitemapEntry, type SearchPolicyPostLike } from './search-policy.ts'

export type RssPostLike = SearchPolicyPostLike & {
  blog_id: string
  slug: string
}

/** Keep the RSS projection on the same post search policy as the sitemap. */
export function isRssEligiblePost(post: RssPostLike): boolean {
  return isIndexablePostSitemapEntry(post)
}
