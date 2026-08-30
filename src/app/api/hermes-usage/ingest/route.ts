import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateHermesUsagePayload, type HermesUsageIngestPayload } from '@/lib/hermes-usage'

export const dynamic = 'force-dynamic'

const MAX_PAYLOAD_BYTES = 1_000_000

export async function POST(request: NextRequest) {
  const expectedToken = process.env.HERMES_USAGE_INGEST_TOKEN
  const authorization = request.headers.get('authorization')

  if (!expectedToken) {
    return NextResponse.json({ error: 'Hermes usage ingest token is not configured' }, { status: 503 })
  }
  if (authorization !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const raw = await request.text()
    if (new TextEncoder().encode(raw).byteLength > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    let body: unknown
    try {
      body = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const validation = validateHermesUsagePayload(body)
    if (!validation.valid) {
      return NextResponse.json({
        error: 'Invalid Hermes usage payload',
        details: validation.errors.slice(0, 20),
      }, { status: 400 })
    }

    const payload = body as HermesUsageIngestPayload
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Supabase server environment is not configured' }, { status: 503 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const { data, error } = await supabase
      .from('hermes_usage_snapshots')
      .upsert({
        id: 'public',
        captured_at: payload.capturedAt,
        report_version: payload.reportVersion,
        scope: payload.scope,
        report_hash: payload.reportHash,
        report: payload.report,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select('id, captured_at, report_hash, updated_at')
      .single()

    if (error) {
      console.error('Hermes usage Supabase upsert failed:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json({ error: 'Supabase upsert failed', code: error.code || 'unknown' }, { status: 502 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Supabase upsert returned no row' }, { status: 502 })
    }

    return NextResponse.json({
      ok: true,
      id: data.id,
      capturedAt: data.captured_at,
      reportHash: data.report_hash,
      updatedAt: data.updated_at,
    })
  } catch (error) {
    console.error('Hermes usage ingest error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      detail: error instanceof Error ? error.message : 'unknown error',
    }, { status: 500 })
  }
}
