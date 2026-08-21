import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const ALLOWED_KINDS = new Set(['keyword', 'cardnews'])

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>
    const title = stringValue(body.title)
    const content = stringValue(body.content)
    const fingerprint = stringValue(body.topic_fingerprint)
    const normalizedTitle = stringValue(body.normalized_title, title)
    const summary = stringValue(body.summary, stringValue(body.excerpt))
    const keywords = stringArray(body.keywords)
    const sourceUrls = stringArray(body.source_urls)
    const relatedEntities = stringArray(body.related_entities)
    const kind = stringValue(body.kind, 'keyword')

    if (!title || !fingerprint) {
      return NextResponse.json({ error: 'title and topic_fingerprint are required' }, { status: 400 })
    }
    if (!ALLOWED_KINDS.has(kind)) {
      return NextResponse.json({ error: 'kind must be keyword or cardnews' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data: suppression, error: suppressionError } = await supabase
      .from('research_suppressions')
      .select('topic_fingerprint, reason')
      .eq('topic_fingerprint', fingerprint)
      .maybeSingle()

    if (suppressionError) throw suppressionError
    if (suppression) {
      return NextResponse.json({
        accepted: false,
        route: 'suppressed',
        reason: suppression.reason,
        topic_fingerprint: fingerprint,
      })
    }

    if (content) {
      const { data: reservation, error: reservationError } = await supabase.rpc('reserve_research_draft', {
        p_slug: stringValue(body.slug),
        p_title: title,
        p_content: content,
        p_excerpt: summary || null,
        p_labels: stringArray(body.labels),
        p_published: stringValue(body.published) || new Date().toISOString(),
        p_source_type: stringValue(body.source_type, 'poc-agent'),
        p_topic_fingerprint: fingerprint,
      })

      if (reservationError) throw reservationError
      if (reservation?.accepted) {
        return NextResponse.json({ accepted: true, route: 'draft', reservation }, { status: 201 })
      }
    }

    const { data: existingCandidate, error: existingError } = await supabase
      .from('research_candidates')
      .select('*')
      .eq('topic_fingerprint', fingerprint)
      .maybeSingle()

    if (existingError) throw existingError
    if (existingCandidate) {
      const { data: refreshed, error: refreshError } = await supabase
        .from('research_candidates')
        .update({ last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', existingCandidate.id)
        .select('*')
        .single()
      if (refreshError) throw refreshError
      return NextResponse.json({ accepted: false, route: 'candidate-existing', candidate: refreshed })
    }

    const { data: candidate, error: candidateError } = await supabase
      .from('research_candidates')
      .insert({
        title,
        kind,
        summary,
        keywords,
        source_urls: sourceUrls,
        topic_fingerprint: fingerprint,
        normalized_title: normalizedTitle,
        related_entities: relatedEntities,
        card_slides: Array.isArray(body.card_slides) ? body.card_slides : null,
        status: 'new',
        feedback: '',
      })
      .select('*')
      .single()

    if (candidateError) throw candidateError
    return NextResponse.json({ accepted: false, route: 'candidate', candidate }, { status: 201 })
  } catch (error) {
    console.error('Research POC intake error:', error)
    return NextResponse.json({ error: 'Research POC intake failed' }, { status: 500 })
  }
}
