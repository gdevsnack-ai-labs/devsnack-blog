import type { Experiment, TimelineItem } from '@/data/experiments'
import { AUTONOMOUS_AI_BLOG_LIVE } from '@/data/autonomous-ai-blog-live'
import fixedProjection from '@/data/stockpulse-v1-fixed-projection.json'

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
  'stockpulse-v1-fixed': 'StockPulse',
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
  'stockpulse-v1-fixed': {
    label: 'Live Shadow 실험',
    description: '고정된 입력 snapshot에서 예측·실제 결과·평가·개선 상태를 분리해 관찰하는 실험입니다.',
    openEnded: true,
  },
  'autonomous-ai-blog': {
    label: '자율 운영 실험',
    description: 'AI가 편집권을 갖고 블로그를 직접 운영하는 장기 실험입니다.',
    openEnded: true,
  },
  'stockpulse-ai-self-improvement': {
    label: '완료된 v1 실험',
    description: '예측·평가·개선 시도 루프를 운영한 뒤, 결과와 한계를 정리한 종료 실험입니다.',
    openEnded: false,
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

export interface ProjectFinding {
  statement: string
  evidence: string[]
  scope: string
  confidence?: string
}

interface LabKnowledge {
  projectFinding?: ProjectFinding
  metrics?: LabMetric[]
  showInFindings: boolean
}

/**
 * Project Finding is a bounded conclusion supported by explicit evidence.
 * Latest Activity and Latest Publication are intentionally kept elsewhere.
 */
const LAB_KNOWLEDGE: Record<string, LabKnowledge> = {
  'autonomous-ai-blog': {
    projectFinding: AUTONOMOUS_AI_BLOG_LIVE.projectFinding || undefined,
    showInFindings: false,
  },
  'local-llm-benchmark': {
    projectFinding: {
      statement: '현재 YouTube production contract와 반복 생성 비용을 함께 고려하면 Q5는 속도·용량·통과율의 균형이 좋고, Q6은 재시도 수렴성이 좋았습니다. Q8은 현재 조건에서 우위가 확인되지 않았습니다.',
      evidence: ['Ornith Q5/Q6/Q8 서버 품질·속도 측정', 'Q5 2/2·64.6 tok/s, Q6 2/2·59.8 tok/s, Q8 0/2·54.4 tok/s'],
      scope: 'DGX Spark GB10, Science·History 두 fixture, 모델당 1회 반복, 현재 structured output contract',
      confidence: 'limited',
    },
    metrics: [
      { label: 'Qwen3.8 단일 Decode', value: '17~19.5 t/s', note: '기존 MTP 실측' },
      { label: 'Qwen3.8 4-slot', value: '18~22 t/s', note: '평균 acceptance 약 94%' },
      { label: 'Hook contract fix', value: '90 passed', note: 'production regression tests' },
      { label: 'External one-shot', value: '1/1', note: 'gpt-5.6-luna · hook refs=[]' },
      { label: 'Ornith Q5 corrected', value: '67.6 tok/s', note: '5회 내 1/2 · single repeat' },
      { label: 'Ornith Q6 corrected', value: '60.9 tok/s', note: '5회 내 2/2 · single repeat' },
      { label: 'Ornith Q8 corrected', value: '52.5 tok/s', note: '5회 내 1/2 · single repeat' },
      { label: 'Qwen3.6 quality', value: '9/12', note: '이전 6종·5회 내 최종 통과' },
    ],
    showInFindings: true,
  },
  'ai-omok': {
    projectFinding: {
      statement: '현재 오목 실험 조건에서는 LLM 단독 구조보다 ThreatAnalyzer와 탐색 엔진을 결합한 구조가 더 오래 방어했지만, AI가 만든 Minimax 엔진은 Rapfi에 5:0으로 패배했고 자율 개선 루프도 승률을 높이지 못했습니다.',
      evidence: ['ThreatAnalyzer 연결 후 22턴 방어', 'Minimax 대 Rapfi 5:0', '자율 개선 루프 69판 승률 0%'],
      scope: '현재 AI Omok 구현·평가 환경과 기록된 69판의 실험 범위',
      confidence: 'limited',
    },
    showInFindings: true,
  },
  'stockpulse-ai-self-improvement': {
    projectFinding: {
      statement: 'StockPulse v1은 예측→실제 결과 평가→LLM·ML 비교→개선 시도 루프를 실제 운영했지만, 개선 전략이 정확도를 높였다는 효과는 충분히 규명하지 못했습니다. v1은 종료하고 Daily publication은 GitHub Pages로 분리했습니다.',
      evidence: ['68개 Daily Report', '54개 prediction raw', '26개 Daily Lab Note와 외부 Weekly publication'],
      scope: '2026-07~08 StockPulse v1 운영 기록과 보존된 prediction/evaluation 자료',
      confidence: 'confirmed',
    },
    metrics: [
      { label: 'Daily Reports', value: '68개', note: 'v1 전체 외부 보존' },
      { label: 'Prediction raw', value: '54개', note: 'Morning 28 · ML 26' },
      { label: 'Daily Lab Notes', value: '26개', note: 'v1 source 기록' },
      { label: 'Weekly Lab Note', value: '1개', note: 'GitHub Pages로 이전' },
    ],
    showInFindings: true,
  },
  'hermes-memory': {
    projectFinding: {
      statement: 'Phase 1에서 USER.md와 MEMORY.md의 역할을 분리하는 구현은 완료했지만, 실제 기억 경험이 개선됐다는 결론은 새 세션 평가 전까지 확정하지 않습니다.',
      evidence: ['USER.md와 MEMORY.md 역할 분리', '새 세션 사용 데이터 평가 보류'],
      scope: 'Hermes Memory Experiment Phase 1 구현과 후속 평가 계획',
      confidence: 'limited',
    },
    showInFindings: true,
  },
  'luna-agentic-game-dev': {
    projectFinding: {
      statement: '첫 번째 Godot task는 독립 branch·Forgejo PR·Luna review·protected merge·post-merge smoke까지 통과했지만, 더 어려운 task와 장기 운영까지 가능하다는 결론은 아직 검증되지 않았습니다.',
      evidence: ['첫 E2E local tests 25 passed', 'protected main direct push rejected', 'merge 후 Godot smoke PASS'],
      scope: 'Luna Agentic Game Development Lab Phase 0~4의 첫 E2E 기준선',
      confidence: 'limited',
    },
    metrics: [
      { label: 'Local tests', value: '25 passed', note: '첫 E2E 기준선' },
      { label: 'Godot smoke', value: 'PASS', note: 'merge 후 clean checkout' },
      { label: 'Protected main', value: 'Direct push rejected', note: 'Forgejo pre-receive hook' },
      { label: 'Session dry-run', value: '15 states', note: 'WAKE → COMPLETE' },
    ],
    showInFindings: true,
  },
  'isekai-instagram-mage-experiment': {
    projectFinding: {
      statement: 'GPT Image 2 기준 시트를 모든 장면에 참조해도 개별 프레임의 해부학적 품질과 장면 간 얼굴 identity는 별개였고, 최종 영상에서 다른 얼굴로 변하는 현상을 확인했습니다.',
      evidence: ['6개 장면 기준 시트 참조', '최종 영상 cross-scene 얼굴 identity 변화', 'Scene 4 손 crop 재생성 기록'],
      scope: 'GPT Image 2와 LTX 2.5로 만든 60초 프롤로그의 장면·프레임 비교',
      confidence: 'confirmed',
    },
    showInFindings: true,
  },
  blog: {
    projectFinding: {
      statement: 'AI 기반 daily 기사 자동화는 실제 운영 가능했지만, 일부 결과에서 사실과 다른 내용과 과장된 표현이 확인되어 v1을 완료 처리했습니다. v2는 source·evidence·quality gate 중심으로 재설계합니다.',
      evidence: ['AI Tech v1 daily pipeline 운영', '사실과 다른 내용·과장된 표현에 대한 독자 평가', 'v2 GitHub Pages publication 전환 결정'],
      scope: 'AI Tech v1 자동 발행 실험의 운영·품질 검토 기록',
      confidence: 'confirmed',
    },
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

/** The V1 Fixed detail page is projection-driven; mirror its latest actual run on the Lab hub. */
type FixedProjectionForHub = {
  runs?: {
    records?: Array<{
      stage?: string
      trading_date?: string
      overall_status?: string
      actual_market_result?: {
        status?: string
        kospi_close?: number | null
        direction?: string | null
      }
    }>
  }
}

function getStockpulseFixedProjectionResult(experiment: Experiment): TimelineItem | undefined {
  if (experiment.id !== 'stockpulse-v1-fixed') return undefined
  const record = (fixedProjection as FixedProjectionForHub).runs?.records?.[0]
  const actual = record?.actual_market_result
  if (!record?.trading_date || record.overall_status !== 'complete' || actual?.status !== 'available') return undefined
  const close = typeof actual.kospi_close === 'number' ? actual.kospi_close.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '미확인'
  return {
    name: record.stage === 'evening' ? 'Day 1 Evening Evaluation' : 'Day 1 Morning Live Shadow',
    status: '완료',
    date: record.trading_date.replaceAll('-', '.'),
    result: `실제 KOSPI ${close}, 방향 ${actual.direction || '미확인'}을 최신 projection에서 read-back했습니다.`,
  }
}

/** 계획 문구가 아니라 실제 결과가 기록된 가장 최근 항목을 반환합니다. */
export function getLatestResult(experiment: Experiment): TimelineItem | undefined {
  return getStockpulseFixedProjectionResult(experiment) || getSortedTimeline(experiment).find(isActualResult)
}

export function getKeyResults(experiment: Experiment, limit = 3): TimelineItem[] {
  return getSortedTimeline(experiment).filter(isActualResult).slice(0, limit)
}

export function getProjectFinding(experiment: Experiment): ProjectFinding | undefined {
  return LAB_KNOWLEDGE[experiment.id]?.projectFinding
}

/** Validate the semantic contract for a promoted, scoped Project Finding. */
export function validateProjectFinding(finding: ProjectFinding | undefined): string[] {
  if (!finding) return ['missing']

  const errors: string[] = []
  if (!finding.statement.trim()) errors.push('statement')
  if (!Array.isArray(finding.evidence) || finding.evidence.length === 0) {
    errors.push('evidence')
  } else if (finding.evidence.some(item => !item.trim())) {
    errors.push('evidence_item')
  }
  if (!finding.scope.trim()) errors.push('scope')
  if (!finding.confidence?.trim()) errors.push('confidence')
  return errors
}

export function getKeyMetrics(experiment: Experiment): LabMetric[] {
  return LAB_KNOWLEDGE[experiment.id]?.metrics || []
}

function sortByImportanceAndActivity(a: Experiment, b: Experiment): number {
  const dateDiff = getTimelineDateKey(getLatestResult(b)?.date) - getTimelineDateKey(getLatestResult(a)?.date)
  if (dateDiff) return dateDiff

  const activeDiff = Number(b.category === 'running') - Number(a.category === 'running')
  if (activeDiff) return activeDiff

  return Number(Boolean(getProjectFinding(b))) - Number(Boolean(getProjectFinding(a)))
}

/** 최신 활동을 우선하되, 같은 날짜에는 현재 진행 중인 실험을 대표 실험으로 선택합니다. */
export function getFeaturedExperiment(experiments: Experiment[]): Experiment | undefined {
  return experiments
    .filter(experiment => !experiment.isDummy && Boolean(getProjectFinding(experiment)))
    .sort(sortByImportanceAndActivity)[0]
}

/** 핵심 발견이 별도로 정리된 실험만 결과 피드에 노출합니다. */
export function getRecentFindings(experiments: Experiment[], limit = 4): Experiment[] {
  return experiments
    .filter(experiment => !experiment.isDummy && Boolean(getProjectFinding(experiment)) && LAB_KNOWLEDGE[experiment.id]?.showInFindings)
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
