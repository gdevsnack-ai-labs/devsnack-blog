import { postHref } from '@/config/site-catalog'
import { supabase } from '@/lib/supabase'
import { feedProjectForBlog } from './feed-projects'
import type { FeedProvenance } from '@/lib/provenance'

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

const PROJECT_FEED_BLOG: Record<string, string> = {
  blog: 'aitech',
  'stockpulse-ai-self-improvement': 'stockpulse',
}

export async function getProjectFeedOutputs(projectId: string, limit = 8): Promise<ProjectFeedOutput[]> {
  const blogId = PROJECT_FEED_BLOG[projectId]
  if (!blogId || !feedProjectForBlog(blogId)) return []

  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, title, published, updated, provenance, blog_id')
    .eq('blog_id', blogId)
    .eq('status', 'live')
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
