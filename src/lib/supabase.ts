import { createClient } from '@supabase/supabase-js'
import type { FeedProvenance } from './provenance'
import type { FeedLifecycleStatus } from './ia/feed-lifecycle'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// This module is imported only by server components/routes. Never expose the
// service key to client bundles; public responses still apply explicit filters.
export const supabase = createClient(supabaseUrl, supabaseKey)

export type Post = {
  id: number
  slug: string
  title: string
  content: string
  excerpt: string | null
  labels: string[] | null
  published: string | null
  updated: string
  status: string
  lifecycle_status: FeedLifecycleStatus
  seo_desc: string | null
  cover_image: string | null
  blogger_id: string | null
  provenance: FeedProvenance | null
  blog_id: string
  views: number
}
