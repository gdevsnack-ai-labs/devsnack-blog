import type { Experiment, TimelineItem } from '@/data/experiments'

export interface PublishedLabNote {
  slug: string
  title: string
  excerpt?: string | null
  published: string
  updated?: string | null
}

function timelineDate(published: string): string {
  const date = published.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.replaceAll('-', '.') : published
}

export function labNoteToTimelineItem(note: PublishedLabNote): TimelineItem {
  return {
    name: note.title,
    status: '완료',
    date: timelineDate(note.published),
    blogSlug: `/lab/${note.slug}`,
    result: note.excerpt?.trim() || 'Published Lab Note',
  }
}

function dateKey(date?: string): string {
  return date ? date.replaceAll('.', '-') : ''
}

/**
 * Keep the hand-maintained experiment record as the baseline and append only
 * published Lab Notes newer than its latest recorded timeline date.
 */
export function mergePublishedLabNotes(experiment: Experiment, notes: PublishedLabNote[]): Experiment {
  const latestStaticDate = (experiment.timeline || [])
    .map(item => dateKey(item.date))
    .filter(Boolean)
    .sort()
    .at(-1) || ''

  const additions = notes
    .map(labNoteToTimelineItem)
    .filter(item => dateKey(item.date) > latestStaticDate)

  if (additions.length === 0) return experiment

  return {
    ...experiment,
    timeline: [...(experiment.timeline || []), ...additions],
  }
}
