import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const ACTION_STATUS = {
  review: 'reviewing',
  defer: 'deferred',
  not_interested: 'not_interested',
  discard: 'discarded',
} as const

type Action = keyof typeof ACTION_STATUS | 'memo'

function getAction(value: unknown): Action | null {
  if (typeof value !== 'string') return null
  return value in ACTION_STATUS || value === 'memo' ? value as Action : null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const candidateId = Number(id)
    if (!Number.isInteger(candidateId) || candidateId < 1) {
      return NextResponse.json({ error: 'Invalid candidate id' }, { status: 400 })
    }

    const body = await request.json() as Record<string, unknown>
    const action = getAction(body.action)
    const feedback = typeof body.feedback === 'string' ? body.feedback.trim() : undefined
    if (!action) return NextResponse.json({ error: 'Invalid candidate action' }, { status: 400 })

    const supabase = getSupabaseAdmin()
    const { data: candidate, error: findError } = await supabase
      .from('research_candidates')
      .select('*')
      .eq('id', candidateId)
      .single()
    if (findError || !candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })

    if (action === 'not_interested') {
      const { error: suppressionError } = await supabase
        .from('research_suppressions')
        .upsert({
          topic_fingerprint: candidate.topic_fingerprint,
          normalized_title: candidate.normalized_title,
          keywords: candidate.keywords,
          related_entities: candidate.related_entities,
          reason: 'not_interested',
          source_candidate_id: candidate.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'topic_fingerprint' })
      if (suppressionError) throw suppressionError
    }

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (action === 'memo') {
      patch.feedback = feedback ?? candidate.feedback
    } else {
      patch.status = ACTION_STATUS[action]
      if (feedback !== undefined) patch.feedback = feedback
    }

    const { data: updated, error: updateError } = await supabase
      .from('research_candidates')
      .update(patch)
      .eq('id', candidateId)
      .select('*')
      .single()
    if (updateError) throw updateError

    return NextResponse.json({ ok: true, candidate: updated })
  } catch (error) {
    console.error('Research POC candidate action error:', error)
    return NextResponse.json({ error: 'Research POC candidate update failed' }, { status: 500 })
  }
}
