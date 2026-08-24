import type { Experiment } from '@/data/experiments'
import { mergePublishedLabNotes, type PublishedLabNote } from './lab-note-projection'

function expectEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`)
}

function expectTrue(value: boolean, message: string) {
  if (!value) throw new Error(message)
}

const experiment: Experiment = {
  id: 'stockpulse-ai-self-improvement',
  name: 'StockPulse AI 자기개선 실험',
  description: 'fixture',
  progress: 88,
  color: 'orange',
  status: '진행중',
  category: 'running',
  startedAt: '2026.07.21',
  timeline: [
    { name: '실패 패턴 분석 및 프롬프트 개선', status: '진행중', date: '2026.08.13', result: '기존 정적 기록' },
  ],
}

const notes: PublishedLabNote[] = [
  {
    slug: 'stockpulse-self-2026-08-24',
    title: 'StockPulse 자기개선 실험 — 2026-08-24 (❌ 실패)',
    excerpt: '8월 24일 최신 실패 분석',
    published: '2026-08-24T07:31:40.308179+00:00',
    updated: '2026-08-24T07:31:40.487991+00:00',
  },
  {
    slug: 'stockpulse-self-2026-08-13',
    title: 'StockPulse 자기개선 실험 — 2026-08-13 (✅ 성공)',
    excerpt: '기존 timeline과 같은 날짜의 Lab Note',
    published: '2026-08-13T07:32:54.215424+00:00',
    updated: '2026-08-13T07:32:54.351936+00:00',
  },
]

const merged = mergePublishedLabNotes(experiment, notes)
expectEqual(merged.timeline?.length, 2, 'notes newer than the static timeline must be appended once')
expectEqual(merged.timeline?.[1].date, '2026.08.24', 'published timestamp must become a timeline date')
expectEqual(merged.timeline?.[1].status, '완료', 'published Lab Note must be represented as a completed record')
expectEqual(merged.timeline?.[1].blogSlug, '/lab/stockpulse-self-2026-08-24', 'Lab Note must keep its public content route')
expectTrue(merged.timeline?.[1].result?.includes('8월 24일') === true, 'Lab Note excerpt must be visible as the result')
console.log('lab note projection tests passed')
