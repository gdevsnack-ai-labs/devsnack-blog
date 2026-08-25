import { supabase } from '@/lib/supabase'
import type { KnowledgePostInput } from '@/lib/ia/hub-projections'

export interface StoryPostInput {
  slug: string
  title: string
  excerpt?: string | null
  published: string
  updated?: string | null
  cover_image?: string | null
  blog_id: 'devsnack'
  status: 'live'
}

export interface DataHubSnapshot {
  aiTech: { slug: string; title: string; published?: string | null; updated?: string | null } | null
  stockPulse: { slug: string; title: string; published?: string | null; updated?: string | null } | null

}

export async function getKnowledgePosts(): Promise<KnowledgePostInput[]> {
  const { data } = await supabase
    .from('posts')
    .select('slug, title, excerpt, labels, published, updated, blog_id, status')
    .eq('blog_id', 'research')
    .eq('status', 'live')
    .order('published', { ascending: false })
    .limit(200)

  return (data || []) as KnowledgePostInput[]
}

export async function getRecentStories(limit = 3): Promise<StoryPostInput[]> {
  const { data } = await supabase
    .from('posts')
    .select('slug, title, excerpt, published, updated, cover_image, blog_id, status')
    .eq('blog_id', 'devsnack')
    .eq('status', 'live')
    .order('published', { ascending: false })
    .limit(limit)

  return (data || []) as StoryPostInput[]
}

export async function getLatestPost(blogId: 'aitech' | 'stockpulse') {
  const { data } = await supabase
    .from('posts')
    .select('slug, title, published, updated')
    .eq('blog_id', blogId)
    .eq('status', 'live')
    .order('published', { ascending: false })
    .limit(1)

  return data?.[0] || null
}

export async function getDataHubSnapshot(): Promise<DataHubSnapshot> {
  const [aiTech, stockPulse] = await Promise.all([
    getLatestPost('aitech'),
    getLatestPost('stockpulse'),
  ])

  return { aiTech, stockPulse }
}
