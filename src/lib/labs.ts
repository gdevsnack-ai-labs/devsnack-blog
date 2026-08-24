import type { Experiment, TimelineItem } from '@/data/experiments'
import { AUTONOMOUS_AI_BLOG_LIVE } from '@/data/autonomous-ai-blog-live'

export type LabBoardStatus = 'active' | 'next' | 'backlog' | 'paused' | 'completed'
export type LabStatusConfidence = 'confirmed' | 'inferred' | 'ambiguous'
export type LabFilter = 'all' | LabBoardStatus

export const LAB_FILTERS: Array<{ key: LabFilter; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'active', label: 'Active' },
  { key: 'next', label: 'Next' },
  { key: 'backlog', label: 'Backlog' },
  { key: 'paused', label: 'Paused' },
  { key: 'completed', label: 'Completed' },
]

export interface LabBoardMetadata {
  status: LabBoardStatus
  confidence: LabStatusConfidence
  lastActivity?: string
  nextAction?: string
}

const DOMAIN_BY_ID: Record<string, string> = {
  'autonomous-ai-blog': 'Autonomous AI',
  'ai-omok': 'Game AI',
  'ai-game-assets-sprite-lab': 'Creative AI',
  'stockpulse-ai-self-improvement': 'Self-Improving AI',
  blog: 'Automation',
  'local-llm-benchmark': 'Local AI',
  'hermes-memory': 'Agent Memory',
  'luna-agentic-game-dev': 'Agentic Game Development',
  'isekai-instagram-mage-experiment': 'Content AI',
  'music-qa': 'Content AI',
  hook: 'Content AI',
}

type ExperimentNature = { label: string; description: string; openEnded: boolean }

const NATURE_BY_ID: Record<string, ExperimentNature> = {
  'autonomous-ai-blog': {
    label: '자율 운영 실험',
    description: 'AI가 편집권을 갖고 블로그를 직접 운영하는 장기 실험입니다.',
    openEnded: true,
  },
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
  'hermes-memory': {
    label: '장기 실험',
    description: 'Phase별 결과를 하나의 Lab 기록에 계속 쌓아가는 실험입니다.',
    openEnded: true,
  },
  'luna-agentic-game-dev': {
    label: '장기 실험',
    description: 'AI 개발팀의 책임 분리와 실제 PR lifecycle을 단계별로 검증하는 실험입니다.',
    openEnded: true,
  },
  'ai-game-assets-sprite-lab': {
    label: 'Creative Test',
    description: '생성형 AI 결과물을 실제 게임 에셋으로 사용할 수 있는지 비교한 테스트입니다.',
    openEnded: false,
  },
}

/**
 * AI Omok has completed its recorded runs and only has future experiments.
 * Keep this as an inferred projection instead of mutating the legacy source
 * status until the project is explicitly resumed.
 */
const LAB_BOARD_STATUS_OVERRIDES: Record<string, { status: LabBoardStatus; confidence: LabStatusConfidence }> = {
  'ai-omok': { status: 'paused', confidence: 'inferred' },
}

export interface LabMetric {
  label: string
  value: string
  note?: string
}

interface LabKnowledge {
  keyFinding: string
  metrics?: LabMetric[]
  showInFindings: boolean
}

/**
 * Activity 로그에서 자동 계산할 수 없는 "가장 중요한 발견"을 관리합니다.
 * 원본 experiments.ts를 복제하지 않고, 공개 화면용 의미 레이어만 별도로 둡니다.
 */
const LAB_KNOWLEDGE: Record<string, LabKnowledge> = {
  'autonomous-ai-blog': {
    keyFinding: AUTONOMOUS_AI_BLOG_LIVE.keyFinding,
    showInFindings: true,
  },
  'local-llm-benchmark': {
    keyFinding: 'Qwen3.8-27B의 장문 서빙 실측에 이어 Qwen3.6 품질 비교와 Ornith-1.5 서버 실측을 진행했습니다. Ornith는 Q5_K_M이 64.6 tok/s·5회 내 2/2, Q6_K이 59.8 tok/s·2/2를 기록했고, Q8_0은 54.4 tok/s였지만 두 fixture 모두 품질 게이트를 통과하지 못했습니다.',
    metrics: [
      { label: 'Qwen3.8 단일 Decode', value: '17~19.5 t/s', note: '기존 MTP 실측' },
      { label: 'Qwen3.8 4-slot', value: '18~22 t/s', note: '평균 acceptance 약 94%' },
      { label: 'Ornith Q5_K_M', value: '64.6 tok/s', note: '5회 내 품질 2/2' },
      { label: 'Ornith Q6_K', value: '59.8 tok/s', note: '5회 내 품질 2/2' },
      { label: 'Ornith Q8_0', value: '54.4 tok/s', note: '5회 내 품질 0/2' },
      { label: 'Qwen3.6 quality', value: '9/12', note: '6종·5회 내 최종 통과' },
    ],
    showInFindings: true,
  },
  'ai-omok': {
    keyFinding: 'ThreatAnalyzer를 연결하자 LLM은 22턴까지 방어했지만, AI가 만든 Minimax 엔진은 Rapfi(NNUE)에 5:0으로 패배했고 자율 개선 루프 69판에서도 승률 0%였습니다.',
    showInFindings: true,
  },
  'stockpulse-ai-self-improvement': {
    keyFinding: 'StockPulse는 예측→평가→실패 분석→프롬프트·ML 파라미터·피처 적용 루프를 실제 운영 중이며, 분석 결과가 다음 예측 파이프라인에 반영되는 자기개선 실험입니다.',
    showInFindings: true,
  },
  'hermes-memory': {
    keyFinding: 'Phase 1 implementation complete / evaluation pending — USER.md와 MEMORY.md의 역할을 분리했지만, 실제 기억 경험의 변화는 새 세션 평가 후 판단합니다.',
    showInFindings: true,
  },
  'luna-agentic-game-dev': {
    keyFinding: '첫 번째 trivial Godot task가 Qwen worker의 독립 branch·Forgejo PR·Luna review·protected merge·post-merge smoke까지 통과했지만, 더 어려운 task와 장기 운영은 아직 검증되지 않았습니다.',
    metrics: [
      { label: 'Local tests', value: '25 passed', note: '첫 E2E 기준선' },
      { label: 'Godot smoke', value: 'PASS', note: 'merge 후 clean checkout' },
      { label: 'Protected main', value: 'Direct push rejected', note: 'Forgejo pre-receive hook' },
      { label: 'Session dry-run', value: '15 states', note: 'WAKE → COMPLETE' },
    ],
    showInFindings: true,
  },
  'isekai-instagram-mage-experiment': {
    keyFinding: 'GPT Image 2 기준 시트를 모든 장면에 참조해도 개별 프레임의 해부학적 품질과 장면 간 얼굴 identity는 별개였고, 최종 영상에서 다른 얼굴로 변하는 현상을 확인했습니다.',
    showInFindings: true,
  },
  blog: {
    keyFinding: 'Hermes Agent와 로컬 LLM을 연결한 발행·분석 파이프라인이 실제 운영 중이며, 반복 작업 자동화와 Lab 결과 기록을 함께 검증하고 있습니다.',
    showInFindings: false,
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

export function getKeyFinding(experiment: Experiment): string | undefined {
  return LAB_KNOWLEDGE[experiment.id]?.keyFinding
}

export function getKeyMetrics(experiment: Experiment): LabMetric[] {
  return LAB_KNOWLEDGE[experiment.id]?.metrics || []
}

function sortByImportanceAndActivity(a: Experiment, b: Experiment): number {
  const dateDiff = getTimelineDateKey(getLatestResult(b)?.date) - getTimelineDateKey(getLatestResult(a)?.date)
  if (dateDiff) return dateDiff

  const activeDiff = Number(b.category === 'running') - Number(a.category === 'running')
  if (activeDiff) return activeDiff

  return Number(Boolean(getKeyFinding(b))) - Number(Boolean(getKeyFinding(a)))
}

/** 최신 활동을 우선하되, 같은 날짜에는 현재 진행 중인 실험을 대표 실험으로 선택합니다. */
export function getFeaturedExperiment(experiments: Experiment[]): Experiment | undefined {
  return experiments
    .filter(experiment => !experiment.isDummy && Boolean(getLatestResult(experiment)))
    .sort(sortByImportanceAndActivity)[0]
}

/** 핵심 발견이 별도로 정리된 실험만 결과 피드에 노출합니다. */
export function getRecentFindings(experiments: Experiment[], limit = 4): Experiment[] {
  return experiments
    .filter(experiment => !experiment.isDummy && LAB_KNOWLEDGE[experiment.id]?.showInFindings)
    .sort(sortByImportanceAndActivity)
    .slice(0, limit)
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

function deriveLabBoardStatus(experiment: Experiment): LabBoardStatus {
  if (experiment.isDummy || experiment.category === 'planning') return 'backlog'
  if (experiment.status === '보류') return 'paused'
  if (experiment.category === 'completed' || experiment.status === '완료') return 'completed'
  if (experiment.status === '진행중' || experiment.timeline?.some(item => item.status === '진행중')) return 'active'
  return 'next'
}

function getNextAction(experiment: Experiment): string | undefined {
  const explicitGoal = experiment.nextGoals?.find(goal => goal.trim())
  if (explicitGoal) return explicitGoal

  return getSortedTimeline(experiment).find(item => item.status === '예정' || item.status === '예약')?.name
}

export function getLabBoardMetadata(experiment: Experiment): LabBoardMetadata {
  const override = LAB_BOARD_STATUS_OVERRIDES[experiment.id]
  const latestActivity = getLatestResult(experiment)

  return {
    status: override?.status || deriveLabBoardStatus(experiment),
    confidence: override?.confidence || 'confirmed',
    lastActivity: latestActivity?.date || experiment.startedAt || undefined,
    nextAction: getNextAction(experiment),
  }
}

export function getLabStatusCounts(experiments: Experiment[]): Record<LabBoardStatus, number> {
  const counts: Record<LabBoardStatus, number> = {
    active: 0,
    next: 0,
    backlog: 0,
    paused: 0,
    completed: 0,
  }

  for (const experiment of experiments) counts[getLabBoardMetadata(experiment).status] += 1
  return counts
}

export function parseLabFilter(value?: string | string[]): LabFilter {
  const candidate = Array.isArray(value) ? value[0] : value
  const aliases: Record<string, LabFilter> = {
    active: 'active',
    next: 'next',
    backlog: 'backlog',
    paused: 'paused',
    completed: 'completed',
    // Preserve old non-canonical filter URLs as query compatibility aliases.
    running: 'active',
    planning: 'backlog',
  }
  return candidate && aliases[candidate] ? aliases[candidate] : 'all'
}
