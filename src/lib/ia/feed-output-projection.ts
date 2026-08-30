import { postHref } from '@/config/site-catalog'
import { supabase } from '@/lib/supabase'
import { feedProjectForBlog } from './feed-projects'
import type { FeedProvenance } from '@/lib/provenance'
import { feedListFilters } from './feed-lifecycle'

export interface ProjectFeedOutput {
  id: number
  slug: string
  title: string
  published: string | null
  updated: string | null
  provenance: FeedProvenance | null
  blogId: string
  href: string
}

const PROJECT_FEED_BLOG: Record<string, string> = {}

export async function getProjectFeedOutputs(projectId: string, limit = 8): Promise<ProjectFeedOutput[]> {
  const blogId = PROJECT_FEED_BLOG[projectId]
  if (!blogId || !feedProjectForBlog(blogId)) return []

  let query = supabase
    .from('posts')
    .select('id, slug, title, published, updated, provenance, blog_id')
  for (const [column, value] of Object.entries(feedListFilters(blogId))) {
    query = query.eq(column, value)
  }
  const { data, error } = await query
    .order('published', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data.flatMap(row => {
    const href = postHref(blogId, row.slug)
    if (!href) return []
    return [{
      id: row.id,
      slug: row.slug,
      title: row.title,
      published: row.published,
      updated: row.updated,
      provenance: (row.provenance || null) as FeedProvenance | null,
      blogId,
      href,
    }]
  })
}
