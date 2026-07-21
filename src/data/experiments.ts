// 진행 중 실험 — 수동 관리
// docs/DESIGN.md 참조
//
// isDummy: true 인 항목은 "더미" — 실제 진행 중이 아닌,
// 추후 Lab 페이지에서 관리될 때 활성화.
// 현재는 회색 진행률 + 흐릿한 표시.

export type ExperimentStatus = '진행중' | '완료' | '예정' | '보류' | '미정'
export type ExperimentColor = 'blue' | 'green' | 'orange' | 'purple'
export type ExperimentCategory = 'running' | 'planning' | 'completed'
export type PartStatus = '완료' | '진행중' | '예정' | '예약'

export interface TimelineItem {
  name: string
  status: PartStatus
  date?: string
  /** 연결된 블로그 글 slug (예: '/devsnack/ai-omok-experiment') */
  blogSlug?: string
  /** 이 단계의 결과/산출물 요약 */
  result?: string
}

export interface Experiment {
  id: string
  name: string
  description: string
  progress: number
  color: ExperimentColor
  status: ExperimentStatus
  /** 더미 데이터 여부. true면 회색으로 표시하고 "예정" 배지 */
  isDummy?: boolean

  // v3: Lab 페이지 그룹핑 및 상세 정보
  category: ExperimentCategory
  startedAt: string
  whyText?: string
  nextGoals?: string[]
  timeline?: TimelineItem[]

  // v3: 콘텐츠 연결
  blogPosts?: string[]
  youtubeVideos?: string[]
  githubUrl?: string
}

// ── 실제 진행 중 ──
const AI_OMOK: Experiment = {
  id: 'ai-omok',
  name: 'AI Omok Project',
  description: 'AI 오목 엔진 개발 및 성능 고도화 실험',
  progress: 50,
  color: 'green',
  status: '진행중',
  category: 'running',
  startedAt: '2026.07',
  whyText: '생성형 AI가 오목을 둘 수 있을까? 단순히 LLM에게 "착수하라"고 프롬프트를 주는 것만으로는 전혀 작동하지 않았다. Threat Analyzer라는 외부 도구를 연결했을 때 비로소 22턴까지 방어하는 수준에 도달. "AI가 강해질수록 더 많은 도구가 필요하다"는 역설을 검증하는 실험.',
  nextGoals: ['시각화 대시보드', 'Self-Play 강화학습', 'Rapfi 엔진과 대결', '성능 평가 자동화'],
  timeline: [
    { name: 'RuleBot 대결',          status: '완료',   date: '2026.07', blogSlug: '/devsnack/ai-llm-omok-experiment',          result: 'LLM 혼자서는 RuleBot을 이기지 못했으나 ThreatAnalyzer 도구 연결 후 22턴 방어 성공' },
    { name: 'Minimax 엔진 개발',      status: '완료',   date: '2026.07', blogSlug: '/devsnack/ai-built-gomoku-engine-vs-rapfi', result: 'Deepseek가 1시간 만에 작성한 780줄 Minimax + Alpha-Beta 엔진. 유령 돌 버그 발견 및 수정, 최종 Rapfi 5:0' },
    { name: 'Rapfi 엔진과 대결',      status: '예정' },
    { name: '시각화 및 분석',         status: '예약' },
  ],
  blogPosts: ['/devsnack/ai-llm-omok-experiment', '/devsnack/ai-built-gomoku-engine-vs-rapfi'],
  githubUrl: 'https://github.com/gdevsnack-ai-labs/ai-omok',
}

// ── StockPulse AI 자기개선 실험 ──
const STOCKPULSE_SELF: Experiment = {
  id: 'stockpulse-ai-self-improvement',
  name: 'StockPulse AI 자기개선 실험',
  description: 'AI가 스스로 예측을 분석하고 개선하는 실험 — 매일 아침 KOSPI 예측을 저장하고, 장 마감 후 정확도를 측정하며 개선 방안을 LLM이 자동 생성',
  progress: 80,
  color: 'orange',
  status: '진행중',
  category: 'running',
  startedAt: '2026.07.21',
  whyText: 'StockPulse의 아침 예측이 얼마나 정확한지 측정하고, 실패 원인을 분석하여 점진적으로 개선하는 것이 목표. 투자 목적이 아닌 AI 예측 모델의 정확도 한계를 탐구하는 순수 실험.',
  nextGoals: ['7일 연속 예측 기록 수집', '실패 패턴 분석 및 프롬프트 개선', '정확도 60% 이상 달성', 'Lab 대시보드에 실시간 정확도 표시'],
  timeline: [
    { name: '파이프라인 설계',        status: '완료',   date: '2026.07.21', result: '설계 문서 위키 저장' },
    { name: 'predictions 테이블 생성', status: '완료',   date: '2026.07.21', result: 'Supabase 16개 컬럼' },
    { name: '아침 예측 저장 로직',    status: '완료',   date: '2026.07.21', result: 'stockpulse_publish.py' },
    { name: '저녁 분석 + Lab 게시',   status: '완료',   date: '2026.07.21', blogSlug: '/lab/stockpulse-self-2026-07-21', result: '7/21 예측(하락) vs 실제(상승) 분석 — 정확도 0.65, LLM 개선 방안 생성, Lab 포스트 발행' },
    { name: '프론트 성공률 위젯',     status: '예정' },
  ],
  blogPosts: ['/lab/stockpulse-self-2026-07-21'],
  githubUrl: 'https://github.com/gdevsnack-ai-labs/devsnack-blog',
}

// ── Blog Automation (더미 → 실제 전환) ──
const BLOG_AUTO: Experiment = {
  id: 'blog',
  name: 'Blog Automation',
  description: 'AI 기반 블로그 발행 자동화 파이프라인',
  progress: 85,
  color: 'green',
  status: '진행중',
  category: 'running',
  startedAt: '2026.04',
  whyText: '매일 4시 StockPulse 리포트, 10시 AI Tech 뉴스, YouTube 댓글 자동 배치 — 이 모든 것이 Hermes Agent + 로컬 LLM(Qwen3.5-35B) 자동화 파이프라인으로 돌아간다. 사람이 검증만 하면 되는 시스템.',
  nextGoals: ['Blogger/Vercel 동시 발행 안정화', 'Lab 메트릭 자동 업데이트'],
  timeline: [
    { name: 'AI Tech 뉴스 자동 발행',    status: '완료',   date: '2026.04' },
    { name: 'StockPulse 리포트 자동화',  status: '완료',   date: '2026.05' },
    { name: 'Supabase/Vercel 연동',     status: '완료',   date: '2026.07' },
    { name: 'Lab 메트릭 대시보드',      status: '진행중', date: '2026.07' },
  ],
  blogPosts: [],
  githubUrl: 'https://github.com/gdevsnack-ai-labs/devsnack-blog',
}

// ── 더미 — 추후 Lab 페이지에서 관리 예정 ──
const DUMMIES: Experiment[] = [
  {
    id: 'llm-bench',
    name: 'Local LLM Benchmark',
    description: 'DGX Spark GB10 기반 GGUF 모델 성능 비교',
    progress: 0,
    color: 'blue',
    status: '미정',
    isDummy: true,
    category: 'planning',
    startedAt: '',
  },
  {
    id: 'music-qa',
    name: 'Music QA System',
    description: 'AI 음악 품질 평가 시스템',
    progress: 0,
    color: 'purple',
    status: '미정',
    isDummy: true,
    category: 'planning',
    startedAt: '',
  },
  {
    id: 'hook',
    name: 'Hook Engine',
    description: '쇼츠 콘텐츠 생성 시스템',
    progress: 0,
    color: 'orange',
    status: '미정',
    isDummy: true,
    category: 'planning',
    startedAt: '',
  },
]

export const experiments: Experiment[] = [STOCKPULSE_SELF, AI_OMOK, BLOG_AUTO, ...DUMMIES]
