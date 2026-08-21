import { getSupabaseAdmin } from '@/lib/supabase-admin'

export type ResearchDraft = {
  id: number
  slug: string
  title: string
  content: string
  excerpt: string | null
  labels: string[] | null
  published: string | null
  updated: string | null
  status: string
  workflow_state: string
  reviewed_at: string | null
  reviewed_by: string | null
  published_at: string | null
  source_type: string
  topic_fingerprint: string | null
}

export type ResearchCandidate = {
  id: number
  title: string
  kind: 'keyword' | 'cardnews'
  summary: string
  keywords: string[]
  source_urls: string[]
  topic_fingerprint: string
  normalized_title: string
  related_entities: string[]
  card_slides: Array<{ heading?: string; body?: string }> | null
  status: 'new' | 'reviewing' | 'deferred' | 'not_interested' | 'promoted' | 'discarded'
  feedback: string
  snooze_until: string | null
  created_at: string
  updated_at: string
  last_seen_at: string
}

export async function getResearchPocSnapshot() {
  const supabase = getSupabaseAdmin()
  const [draftResult, candidateResult] = await Promise.all([
    supabase
      .from('posts')
      .select('id, slug, title, content, excerpt, labels, published, updated, status, workflow_state, reviewed_at, reviewed_by, published_at, source_type, topic_fingerprint')
      .eq('blog_id', 'research')
      .eq('status', 'draft')
      .eq('workflow_state', 'research_draft')
      .order('updated', { ascending: false }),
    supabase
      .from('research_candidates')
      .select('*')
      .order('updated_at', { ascending: false }),
  ])

  if (draftResult.error) throw new Error(`Research draft query failed: ${draftResult.error.message}`)
  if (candidateResult.error) throw new Error(`Research candidate query failed: ${candidateResult.error.message}`)

  return {
    drafts: (draftResult.data || []) as ResearchDraft[],
    candidates: (candidateResult.data || []) as ResearchCandidate[],
    draftLimit: 5,
  }
}
