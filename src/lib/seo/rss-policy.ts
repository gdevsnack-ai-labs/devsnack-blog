import { isMigratedResearchSlug } from '@/lib/research-note-migration'

export interface RssPostLike {
  blog_id: string
  slug: string
  status?: string | null
}

/** RSS may expose only live rows that still have a Vercel detail URL. */
export function isRssEligiblePost(post: RssPostLike): boolean {
  if (post.status !== 'live') return false
  return !(post.blog_id === 'research' && isMigratedResearchSlug(post.slug))
}
