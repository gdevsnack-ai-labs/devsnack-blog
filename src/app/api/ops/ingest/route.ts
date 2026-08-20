import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normalizeOperationsSnapshot } from '@/lib/operations-types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const expectedToken = process.env.OPS_INGEST_TOKEN || process.env.INGEST_API_TOKEN
  const authorization = request.headers.get('authorization')

  if (!expectedToken) {
    return NextResponse.json({ error: 'Ops ingest token is not configured' }, { status: 503 })
  }

  if (authorization !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json() as { snapshot?: unknown }
    const snapshot = normalizeOperationsSnapshot(body.snapshot ?? body)

    if (!snapshot.capturedAt || !snapshot.source) {
      return NextResponse.json({ error: 'Invalid operations snapshot' }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Supabase server environment is not configured' }, { status: 503 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const { data, error } = await supabase
      .from('system_snapshots')
      .insert({
        captured_at: snapshot.capturedAt,
        source: snapshot.source,
        host: snapshot.host,
        snapshot,
      })
      .select('id, captured_at')
      .single()

    if (error) {
      console.error('Operations ingest Supabase insert failed:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json({
        error: 'Supabase insert failed',
        code: error.code || 'unknown',
        detail: error.message || 'unknown database error',
      }, { status: 502 })
    }
    return NextResponse.json({ ok: true, id: data.id, capturedAt: data.captured_at })
  } catch (error) {
    console.error('Operations ingest error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
