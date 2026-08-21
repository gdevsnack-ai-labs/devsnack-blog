import type { Experiment, TimelineItem } from '@/data/experiments'

export type LabFilter = 'all' | 'running' | 'planning' | 'completed'

export const LAB_FILTERS: Array<{ key: LabFilter; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'running', label: '진행중' },
  { key: 'planning', label: '계획' },
  { key: 'completed', label: '완료' },
]

const DOMAIN_BY_ID: Record<string, string> = {
  'ai-omok': 'Game AI',
  'stockpulse-ai-self-improvement': 'Self-Improving AI',
  blog: 'Automation',
  'local-llm-benchmark': 'Local AI',
  'isekai-instagram-mage-experiment': 'Content AI',
  'music-qa': 'Content AI',
  hook: 'Content AI',
}

type ExperimentNature = { label: string; description: string; openEnded: boolean }

const NATURE_BY_ID: Record<string, ExperimentNature> = {
  'stockpulse-ai-self-improvement': {
    label: '지속 실험',
    description: '자기개선 루프가 계속 반복되는 실험입니다.',
    openEnded: true,
  },
  'local-llm-benchmark': {
    label: '확장형 벤치마크',
    description: '모델별 하위 실험을 계속 추가할 수 있는 실험군입니다.',
    openEnded: true,
  },
}

export function getDomainLabel(experiment: Experiment): string {
  return DOMAIN_BY_ID[experiment.id] || 'AI Experiment'
}

export function getNature(experiment: Experiment): ExperimentNature {
  return NATURE_BY_ID[experiment.id] || {
    label: '단계형 실험',
    description: '단계별 결과를 쌓아가는 실험입니다.',
    openEnded: false,
  }
}

/** YYYY.MM 또는 YYYY.MM.DD 형식을 비교 가능한 숫자로 바꿉니다. */
export function getTimelineDateKey(date?: string): number {
  if (!date) return 0
  const parts = date.split(/[./-]/).map(Number)
  const year = parts[0] || 0
  const month = parts[1] || 0
  const day = parts[2] || 0
  return year * 10000 + month * 100 + day
}

/** 상세 페이지에서 최신 기록이 먼저 오도록 정렬합니다. */
export function getSortedTimeline(experiment: Experiment): TimelineItem[] {
  return (experiment.timeline || [])
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const dateDiff = getTimelineDateKey(b.item.date) - getTimelineDateKey(a.item.date)
      return dateDiff || b.index - a.index
    })
    .map(({ item }) => item)
}

function isActualResult(item: TimelineItem): boolean {
  return Boolean(item.result?.trim()) && (item.status === '완료' || item.status === '진행중')
}

/** 계획 문구가 아니라 실제 결과가 기록된 가장 최근 항목을 반환합니다. */
export function getLatestResult(experiment: Experiment): TimelineItem | undefined {
  return getSortedTimeline(experiment).find(isActualResult)
}

export function getKeyResults(experiment: Experiment, limit = 3): TimelineItem[] {
  return getSortedTimeline(experiment).filter(isActualResult).slice(0, limit)
}

/** 카드에 표시할 현재 단계. 진행중 항목을 우선하고, 없으면 다음 계획을 표시합니다. */
export function getCurrentStage(experiment: Experiment): string {
  const active = (experiment.timeline || []).find(item => item.status === '진행중')
  if (active) return active.name

  if (experiment.status === '완료') return '실험 완료'

  const next = (experiment.timeline || []).find(item => item.status === '예정' || item.status === '예약')
  if (next) return `다음: ${next.name}`

  if (experiment.status === '예정' || experiment.status === '미정') return '계획 중'
  return '상태 기록 중'
}

export function parseLabFilter(value?: string | string[]): LabFilter {
  const candidate = Array.isArray(value) ? value[0] : value
  return candidate === 'running' || candidate === 'planning' || candidate === 'completed'
    ? candidate
    : 'all'
}
