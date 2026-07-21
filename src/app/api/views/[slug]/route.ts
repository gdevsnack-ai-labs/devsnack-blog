import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get current views
  const { data } = await supabase
    .from('posts')
    .select('views')
    .eq('slug', slug)
    .single()

  if (data) {
    const newViews = (data.views || 0) + 1
    await supabase
      .from('posts')
      .update({ views: newViews })
      .eq('slug', slug)
  }

  return NextResponse.json({ ok: true })
}
