import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.INGEST_API_TOKEN

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('posts')
      .insert({
        title: body.title,
        slug: body.slug,
        content: body.content,
        excerpt: body.excerpt || null,
        labels: body.labels || [],
        published: body.published || new Date().toISOString(),
        status: body.status || 'draft',
        seo_desc: body.seo_desc || null,
        cover_image: body.cover_image || null,
        blogger_id: body.blogger_id || null,
      })
      .select()

    if (error) throw error

    return NextResponse.json({ ok: true, id: data[0]?.id })
  } catch (error) {
    console.error('Ingest error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
