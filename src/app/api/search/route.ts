import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Full-Text Search using the fts tsvector column
  const { data } = await supabase
    .from('posts')
    .select('id, slug, title, excerpt, labels, published, cover_image, blog_id')
    .eq('status', 'live')
    .textSearch('fts', q, { config: 'simple' })
    .order('published', { ascending: false })
    .limit(20)

  return NextResponse.json({ results: data ?? [] })
}
