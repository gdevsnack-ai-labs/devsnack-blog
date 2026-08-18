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
  description: 'AI 오목 엔진 개발 및 자율 개선 실험',
  progress: 80,
  color: 'green',
  status: '진행중',
  category: 'running',
  startedAt: '2026.07',
  whyText: '생성형 AI가 오목을 둘 수 있을까? 단순히 LLM에게 "착수하라"고 프롬프트를 주는 것만으로는 전혀 작동하지 않았다. Threat Analyzer라는 외부 도구를 연결했을 때 비로소 22턴까지 방어하는 수준에 도달. 이후 AI가 만든 Minimax 엔진은 Rapfi(NNUE)에게 5:0 완패, AI가 스스로 고치고 테스트하는 자율 개선 루프(69판)도 승률 0% — "AI가 강해질수록 더 많은 도구가 필요하다"는 역설을 검증하는 실험.',
  nextGoals: ['MCTS 탐색 적용 (알파고 방식)', 'Self-Play 강화학습', 'NNUE 신경망 평가 학습', '시각화 및 분석'],
  timeline: [
    { name: 'RuleBot 대결',          status: '완료',   date: '2026.07', blogSlug: '/devsnack/ai-llm-omok-experiment',          result: 'LLM 혼자서는 RuleBot을 이기지 못했으나 ThreatAnalyzer 도구 연결 후 22턴 방어 성공' },
    { name: 'Minimax 엔진 개발',      status: '완료',   date: '2026.07', blogSlug: '/devsnack/ai-built-gomoku-engine-vs-rapfi', result: 'Deepseek가 1시간 만에 작성한 780줄 Minimax + Alpha-Beta 엔진. 유령 돌 버그 발견 및 수정, 최종 Rapfi 5:0' },
    { name: 'Rapfi 엔진과 대결',      status: '완료',   date: '2026.07', result: 'Minimax vs Rapfi(NNUE) 5:0 패배. NNUE 로드·유령 돌 등 버그 6종 수정 후 정상 결과 확인' },
    { name: 'AI 자율 개선 루프 (Phase 2-2)', status: '완료', date: '2026.08', result: 'AI가 테스트→로그 분석→개선→재테스트. 69판 전부 0% — TT 히트율 1% 미만, 폭 제한 회귀, 평가 개선은 턴 수만 향상(19.6→23.2)' },
    { name: '머신러닝 기반 실험 (MCTS·학습)',  status: '예정' },
    { name: '시각화 및 분석',         status: '예약' },
  ],
  blogPosts: ['/devsnack/ai-llm-omok-experiment', '/devsnack/ai-built-gomoku-engine-vs-rapfi'],
  githubUrl: 'https://github.com/gdevsnack-ai-labs/ai-omok',
}

// ── StockPulse AI 자기개선 실험 ──
const STOCKPULSE_SELF: Experiment = {
  id: 'stockpulse-ai-self-improvement',
  name: 'StockPulse AI 자기개선 실험',
  description: 'AI가 스스로 예측을 분석하고 개선하는 실험 — 매일 아침 KOSPI 예측을 저장하고, 장 마감 후 정확도를 측정하여 LLM이 개선 방안을 도출, 실제 프롬프트/ML 파라미터/데이터 피처를 자동 변경하는 자기개선 루프',
  progress: 88,
  color: 'orange',
  status: '진행중',
  category: 'running',
  startedAt: '2026.07.21',
  whyText: '매일 아침 08:30 KOSPI 예측 저장 → 장 마감 후 16:30 정확도 측정 → LLM이 실패 원인 분석 + 개선 방안 도출 → 개선 방안을 실제 파이프라인에 자동 적용(프롬프트 패치/ML 파라미터/피처 변경) → 다음날 개선된 환경에서 재예측. 이 루프가 매일 반복되며, "분석만 하고 끝"이 아니라 실제로 시스템이 진화하는 것이 목표. 투자 목적이 아닌 AI 예측 모델이 스스로 개선할 수 있는지 탐구하는 실험.',
  nextGoals: ['정확도 60% 이상 달성', '장기 예측 정확도 추세 분석'],
  timeline: [
    { name: '파이프라인 설계',        status: '완료',   date: '2026.07.21', result: '설계 문서 위키 저장' },
    { name: 'predictions 테이블 생성', status: '완료',   date: '2026.07.21', result: 'Supabase 16개 컬럼' },
    { name: '아침 예측 저장 로직',    status: '완료',   date: '2026.07.21', result: 'stockpulse_publish.py' },
    { name: '저녁 분석 + Lab 게시',   status: '완료',   date: '2026.07.21', blogSlug: '/lab/stockpulse-self-2026-07-21', result: '7/21 예측(하락) vs 실제(상승) 분석 — 정확도 0.65, LLM 개선 방안 생성, Lab 포스트 발행' },
    { name: '프론트 성공률 위젯',     status: '완료',   date: '2026.07.22', result: 'Stock 페이지 상단 예측 현황 3-칼럼 위젯 + API' },
    { name: '자기개선 루프 구축',      status: '완료',   date: '2026.07.22', result: 'LLM action plan → 자동 프롬프트/ML/피처 변경 → Lab 기록' },
    { name: '7일 연속 예측 기록 수집', status: '완료',   date: '2026.08.13', result: '8/4~8/13 연속 예측 — 7일 이상 데이터 확보' },
    { name: 'Lab 페이지 실시간 정확도 표시', status: '완료', date: '2026.08.13', result: 'Lab 상세 페이지에 LLM/ML 정확도 위젯 추가 (Stock 위젯 재사용)' },
    { name: '실패 패턴 분석 및 프롬프트 개선', status: '진행중', date: '2026.08.13', result: '매일 저녁 LLM이 예측 실패 분석 → 프롬프트/ML 파라미터/피처 자동 개선 루프 가동 중' },
  ],
  blogPosts: ['/lab/stockpulse-self-2026-07-21', '/lab/stockpulse-self-2026-08-07', '/lab/stockpulse-self-2026-08-10', '/lab/stockpulse-self-2026-08-11', '/lab/stockpulse-self-2026-08-12', '/lab/stockpulse-self-2026-08-13'],
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

// ── Local LLM Benchmark — DGX Spark GB10 GGUF 성능 실험 (2026-08-18 시작) ──
const LLM_BENCH: Experiment = {
  id: 'local-llm-benchmark',
  name: 'Local LLM Benchmark',
  description: 'DGX Spark GB10에서 GGUF 양자화 로컬 LLM의 실측 성능 비교 — MTP 스펙 디코딩, 프리필/디코드 속도, 수락률, 실사용 생성 품질을 단일 프롬프트로 검증',
  progress: 45,
  color: 'blue',
  status: '진행중',
  category: 'running',
  startedAt: '2026.08.18',
  whyText: 'GB10(128GB 통합 메모리, Blackwell sm_120)에서 27B급 dense 모델의 현실적 로컬 라인이 어디까지인지 실측한다. GPU 메모리 여유가 커서 NVFP4 같은 고밀도 양자화를 그대로 활용할 수 있고, MTP 헤드 내장 모델은 별도 드래프터 없이 스펙 디코딩을 켤 수 있다. 스펙만 보면 되는 게 아니라 실제 서빙 부하(4슬롯 동시)와 생성 품질(단일 프롬프트 → 산출물)까지 봐야 판단할 수 있다.',
  nextGoals: ['VERY-HIGH 티어 비교 실측', 'thinking ON/OFF 품질 차이 검증', 'Self Bench Pack 24종 에이전트 실행 (8080 qwen3.5-35b)', '벤치마크 자동화 스크립트 구축', 'Muse Glimmer 30B·DeepSeek V4 Pro 등 경쟁 모델 비교'],
  timeline: [
    { name: '실행 스크립트 4종 작성',     status: '완료',   date: '2026.08.18', result: 'HIGH/VERY-HIGH × thinking ON/OFF, MTP n-max 6 + p-min 0.75' },
    { name: '단일 테스트 실측',            status: '완료',   date: '2026.08.18', result: '프리필 680~930 t/s, 디코드 17~19.5 t/s, 수락률 93.1%' },
    { name: '장기 서빙 실측 (4슬롯 동시)', status: '완료',   date: '2026.08.18', result: '장문 생성 18~22 t/s 유지, 수락률 평균 ~94%, 초장문 8,287토큰 18.5 t/s' },
    { name: '실사용 데모 (단일 프롬프트)', status: '완료',   date: '2026.08.18', result: 'Ragdoll Playground HTML — 1회 생성으로 완성, 데모 공개' },
    { name: 'Self Bench Pack 자체 설계 (24종)', status: '완료', date: '2026.08.18', result: 'TokenChaser 84개 참고·한영 이중언어 + 자기검증 루프 내장, 오픈코드 에이전트 실행기 구축' },
    { name: '실사용 데모 — Stock Dashboard (Ridge 3.7bpw)', status: '완료', date: '2026.08.19', result: 'Qwen3.8-27B Ridge 3.7bpw로 KOSPI/KOSDAQ 대시보드 1회 생성. 디코드 ~29 t/s, MTP 수락률 ~88%, worklog+llama_log 기록' },
    { name: '벤치 프롬프트 에이전트 실행', status: '예정',   result: '8080 qwen3.5-35b 백본, 생성→테스트→수정 루프' },
    { name: '다른 모델과 비교 (Muse Glimmer 30B 등)', status: '예정' },
  ],
  blogPosts: ['/research/qwen3-8-27b-nvfp4-mtp-gguf-gb10', '/research/local-llm-benchmark'],
  githubUrl: 'https://github.com/gdevsnack-ai-labs/devsnack-blog',
}

export const experiments: Experiment[] = [STOCKPULSE_SELF, AI_OMOK, BLOG_AUTO, LLM_BENCH, ...DUMMIES]
