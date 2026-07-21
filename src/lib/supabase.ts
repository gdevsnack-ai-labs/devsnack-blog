import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  seo_desc: string | null
  cover_image: string | null
  blogger_id: string | null
  blog_id: string
  views: number
}
