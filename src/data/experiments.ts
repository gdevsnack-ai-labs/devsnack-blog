// 현재 운영 상태 projection — Agent Field Notes operator가 갱신합니다.
import { AUTONOMOUS_AI_BLOG_LIVE } from './autonomous-ai-blog-live'

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
  externalLinks?: Array<{ label: string; href: string }>
  operatingModel?: string
  humanInterventionPolicy?: string
  retrospective?: string | null
  /** Include this formal project in public Search and Sitemap discovery. */
  publicDiscovery?: boolean
}

// ── AI 완전 자율 블로그 운영 실험 ──
const AUTONOMOUS_AI_BLOG: Experiment = {
  id: 'autonomous-ai-blog',
  name: 'AI 완전 자율 블로그 운영 실험',
  description: 'AI가 주제 선택부터 조사·작성·검증·발행까지 스스로 결정하는 독립 블로그 운영 실험',
  progress: AUTONOMOUS_AI_BLOG_LIVE.progress,
  color: 'purple',
  status: '진행중',
  category: 'running',
  startedAt: '2026.08.22',
  publicDiscovery: true,
  whyText: '사람이 매번 주제와 방향을 정해주는 자동화가 아니라, AI에게 편집권 자체를 맡기면 어떤 콘텐츠 취향과 매체의 색깔이 생기는지 관찰한다. GitHub·Supabase·Vercel을 기존 블로그와 분리하고, AI가 주제·출처·형식·발행 여부를 결정한다. 첫 단계는 7일 블라인드 운영이며, 이후 1개월·3개월·6개월 단위로 판단의 변화와 운영 지속성을 비교한다.',
  operatingModel: 'AI가 주제 선택·출처 탐색·형식 선택·작성·검증·발행 또는 보류를 한 유한 cycle 안에서 결정합니다. 각 cycle의 결과와 운영 지표는 별도 기록으로 남기고, Agent Field Notes가 실제 publication을 담당합니다.',
  humanInterventionPolicy: '사람의 개입은 계정·보안·인프라·서비스 장애·실험 중단 또는 연장 결정으로 제한합니다. 개입은 AI의 편집 취향으로 재해석하지 않고 별도 intervention 기록으로 보존합니다.',
  retrospective: AUTONOMOUS_AI_BLOG_LIVE.retrospective,
  nextGoals: AUTONOMOUS_AI_BLOG_LIVE.nextGoals,
  timeline: [
    { name: '자율 운영 실험 프로토콜 확정', status: '완료', date: '2026.08.22', result: '주제·형식·발행 여부를 AI가 결정하고 사람 개입은 인프라·보안·계정 문제로 제한하는 규칙 확정' },
    { name: '독립 GitHub·Supabase·Vercel 기반 구성', status: '완료', date: '2026.08.22', result: '독립 저장소·Supabase schema/RLS·Next.js 공개 화면 구성. 운영 secret은 로컬에만 보관' },
    { name: 'Vercel 첫 배포', status: '진행중', date: '2026.08.22', result: 'GitHub main push와 Vercel 프로젝트 연결은 완료했으나 공개 주소는 아직 HTTP 404. 첫 Deployment와 Production Branch 상태 확인 대기' },
    { name: '7일 블라인드 자율 운영', status: '예정', result: '사람의 주제 지시 없이 AI가 조사·작성·검증·발행. 개입은 별도 로그로 기록' },
    { name: '1개월 편집 회고', status: '예정', result: '주제 선택의 반복성, 출처 품질, 글 형식, 자기수정 여부 비교' },
    { name: '3개월·6개월 지속성 비교', status: '예정', result: 'AI의 편집 취향이 안정되는지, 독립 매체로 지속 가능한지 평가' },
    ...AUTONOMOUS_AI_BLOG_LIVE.timeline,
  ],
  blogPosts: [],
  externalLinks: [
    { label: 'Agent Field Notes', href: 'https://agentfieldnotes.vercel.app' },
  ],
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
  name: 'StockPulse v1 자기개선 실험',
  description: '일일 KOSPI 예측을 저장하고 실제 결과를 평가한 뒤 LLM·ML 개선을 시도하는 자동화 루프를 구축한 v1 실험. v1은 자동화 루프의 운영 가능성을 확인했지만, 어떤 개선 전략이 실제 정확도 향상으로 이어지는지는 충분히 규명하지 못했다.',
  progress: 100,
  color: 'orange',
  status: '완료',
  category: 'completed',
  startedAt: '2026.07.21',
  whyText: 'StockPulse v1은 매일의 예측과 실제 장 결과를 비교하고, 실패 원인을 분석해 프롬프트·ML 파라미터·피처 변경을 시도하는 자기개선 루프를 실제로 운영했다. 68개 Daily Report와 54개 prediction raw를 남겼고, 반복적인 개선 시도와 데이터 누적을 통해 자동화 파이프라인의 장단점을 확인했다. 다만 짧고 비정상적인 시장 구간, 평가 기준의 혼재, 개선안 적용 효과를 분리해 검증하지 못했기 때문에 v1을 성공적인 정확도 개선으로 과장하지 않는다.',
  nextGoals: ['v1 raw/evaluation 재분석', '새 평가 방법과 실험 가설 설계', '별도 StockPulse v2 Lab 준비'],
  timeline: [
    { name: '파이프라인 설계',        status: '완료',   date: '2026.07.21', result: '예측·평가·개선 루프 설계와 실험 범위 확정' },
    { name: 'predictions 테이블 생성', status: '완료',   date: '2026.07.21', result: '아침/ML 예측과 장 마감 평가 raw 저장 구조 구성' },
    { name: '아침 예측 저장 로직',    status: '완료',   date: '2026.07.21', result: 'Morning prediction raw와 ML prediction raw 누적' },
    { name: '저녁 분석 + Lab 기록',   status: '완료',   date: '2026.07.21', result: '예측과 실제 결과 비교, 개선안과 실패 원인 기록' },
    { name: '자기개선 루프 구축',      status: '완료',   date: '2026.07.22', result: 'LLM action plan → prompt/ML/features 변경 시도 → journal 기록' },
    { name: '7일 이상 예측 기록 수집', status: '완료', date: '2026.08.13', result: '연속 예측·평가 표본을 확보하고 주간 집계 기반 마련' },
    { name: 'Daily Report 68개 보존 결정', status: '완료', date: '2026.08.30', result: 'Daily Report 전문을 전용 GitHub Pages publication으로 이전' },
    { name: 'Daily Lab Note source 전환', status: '완료', date: '2026.08.30', result: '기존 26개 Daily Lab Note는 v1 원자료로 보존하고 새 독립 daily 글은 만들지 않음' },
    { name: 'StockPulse v1 종료', status: '완료', date: '2026.08.30', result: '자동화 루프는 구축했으나 개선 방법론의 효과는 미완성이라는 결론으로 종료' },
  ],
  blogPosts: [],
  githubUrl: 'https://github.com/gdevsnack-ai-labs/stockpulse-publication',
  externalLinks: [
    { label: 'StockPulse Publication', href: 'https://gdevsnack-ai-labs.github.io/stockpulse-publication/' },
    { label: 'Daily Report Archive', href: 'https://gdevsnack-ai-labs.github.io/stockpulse-publication/archive/' },
    { label: 'Weekly Lab Notes', href: 'https://gdevsnack-ai-labs.github.io/stockpulse-publication/lab-notes/' },
  ],
}

// ── AI Tech v1 자동화 뉴스 실험 ──
const BLOG_AUTO: Experiment = {
  id: 'blog',
  name: 'AI Tech v1 자동화 뉴스 실험',
  description: 'AI를 활용한 자동화 파이프라인으로 매일 AI 기술·산업 기사를 작성하고, 생성 결과를 독자 관점에서 평가한 v1 실험',
  progress: 100,
  color: 'green',
  status: '완료',
  category: 'completed',
  startedAt: '2026.04',
  whyText: 'AI를 활용한 자동화 파이프라인으로 매일 AI 기술·산업 기사를 작성하고, 생성된 결과를 독자 관점에서 평가하는 실험을 진행했다. 일부 결과에서 사실과 다른 내용이나 과장된 표현이 확인되어 v1을 완료 처리하고, source·evidence·quality gate를 강화한 v2 실험을 준비한다. v2의 실제 기사는 GitHub Pages에서 발행하고, Vercel의 DevSnack Lab에는 단순 피드 전용 slug를 만들지 않고 기사 생성 과정과 실험 기록을 남긴다.',
  nextGoals: ['v2 source·evidence pipeline 설계', 'GitHub Pages publication 전환'],
  timeline: [
    { name: 'AI Tech 뉴스 자동 발행', status: '완료', date: '2026.04', result: 'AI가 주제 선택·source 수집·작성·검증·발행을 연결하는 daily pipeline을 운영' },
    { name: 'AI Tech v1 독자 평가', status: '완료', date: '2026.08', result: '생성 결과를 독자 관점에서 평가하고, 일부 기사에서 사실과 다른 내용과 과장된 표현을 확인' },
    { name: 'v1 compact history 정리', status: '완료', date: '2026.08', result: '185개 v1 기록은 /aitech compact history에 제목·발행일만 남기고, 기존 detail은 공개 discovery에서 분리' },
    { name: 'v1 완료 및 v2 전환 결정', status: '완료', date: '2026.08', result: 'Season 2 실제 기사는 GitHub Pages에서 발행하고, DevSnack Lab에는 source·evidence·quality·개선 과정을 기록하는 방향 확정' },
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
  nextGoals: ['Qwen3.6 HQ·TURBO·Q8_0 서버 속도 반복 측정', 'Ornith reasoning ON/OFF 및 coding/tool-call lane 분리 측정', 'Self Bench Pack 24종 에이전트 실행 (8080 qwen3.5-35b)', '벤치마크 자동화 스크립트와 모델 패밀리 메뉴 확장'],
  timeline: [
    { name: '실행 스크립트 4종 작성',     status: '완료',   date: '2026.08.18', result: 'HIGH/VERY-HIGH × thinking ON/OFF, MTP n-max 6 + p-min 0.75' },
    { name: '단일 테스트 실측',            status: '완료',   date: '2026.08.18', result: '프리필 680~930 t/s, 디코드 17~19.5 t/s, 수락률 93.1%' },
    { name: '장기 서빙 실측 (4슬롯 동시)', status: '완료',   date: '2026.08.18', result: '장문 생성 18~22 t/s 유지, 수락률 평균 ~94%, 초장문 8,287토큰 18.5 t/s' },
    { name: '실사용 데모 (단일 프롬프트)', status: '완료',   date: '2026.08.18', result: 'Ragdoll Playground HTML — 1회 생성으로 완성, 데모 공개' },
    { name: 'Self Bench Pack 자체 설계 (24종)', status: '완료', date: '2026.08.18', result: 'TokenChaser 84개 참고·한영 이중언어 + 자기검증 루프 내장, 오픈코드 에이전트 실행기 구축' },
    { name: '실사용 데모 — Stock Dashboard (Ridge 3.7bpw)', status: '완료', date: '2026.08.19', result: 'Qwen3.8-27B Ridge 3.7bpw로 KOSPI/KOSDAQ 대시보드 1회 생성. 디코드 ~29 t/s, MTP 수락률 ~88%, worklog+llama_log 기록', blogSlug: '/lab/local-llm-benchmark-report' },
    { name: 'HTML in Canvas 데모', status: '완료', date: '2026.08.20', result: 'Canvas bitmap + HTML DOM overlay + html2canvas snapshot을 단일 HTML로 공개', blogSlug: '/research/html-in-canvas-dom-overlay-rasterization' },
    { name: 'Qwen3.6 YouTube 대본 품질 비교', status: '완료', date: '2026.08.24', result: '6종 파생 모델을 같은 Science·History production fixture로 비교. 12회 실행에서 5회 내 최종 통과 9/12, 평균 3.1회', blogSlug: '/lab/qwen36-youtube-script-reliability-benchmark' },
    { name: 'Ornith-1.5 서버 품질·실사용 속도 (original protocol)', status: '완료', date: '2026.08.24', result: 'Q5/Q6/Q8을 모델당 한 번 로드해 실제 긴 품질 prompt에서 속도 측정. 원래 contract 기준 Q5 64.6 tok/s·2/2, Q6 59.8 tok/s·2/2, Q8 54.4 tok/s·0/2', blogSlug: '/lab/ornith15-server-quality-speed-benchmark' },
    { name: 'Production contract calibration — pure hook refs', status: '완료', date: '2026.08.24', result: '순수 rhetorical/hypothetical hook의 fact_refs 규칙 충돌을 production과 benchmark에 반영. 외부 gpt-5.6-luna 1회 결과는 hook refs=[]로 통과했고, 새 local matrix는 Q6/Q8 1차 통과가 1/2로 개선됨', blogSlug: '/labs/local-llm-benchmark' },
    { name: '벤치 프롬프트 에이전트 실행', status: '예정',   result: '8080 qwen3.5-35b 백본, 생성→테스트→수정 루프' },
    { name: '다른 모델과 비교 (Muse Glimmer 30B 등)', status: '예정' },
  ],
  blogPosts: [
    '/research/qwen3-8-27b-nvfp4-mtp-gguf-gb10',
    '/lab/qwen36-youtube-script-reliability-benchmark',
    '/lab/ornith15-server-quality-speed-benchmark',
  ],
  githubUrl: 'https://github.com/gdevsnack-ai-labs/devsnack-blog',
  externalLinks: [
    { label: 'Public Prompt Packs', href: 'https://github.com/gdevsnack-ai-labs/llm-bench-prompt-packs' },
  ],
}

// ── StockPulse V1 Fixed — 정식 Live Shadow Project (2026.09.02 시작) ──
const STOCKPULSE_V1_FIXED: Experiment = {
  id: 'stockpulse-v1-fixed',
  name: 'StockPulse V1 Fixed',
  description: '예측·실제 결과·평가·개선 상태를 Run Board로 확인하는 별도 Live Shadow 실험 대시보드입니다.',
  progress: 0,
  color: 'blue',
  status: '진행중',
  category: 'running',
  startedAt: '2026.09.02',
  publicDiscovery: true,
  nextGoals: [
    'ML 50개 예측의 target maturity 이후 평가',
    '다음 trading day Live Shadow run',
    '평가 결과에 따른 개선 cycle 검토',
  ],
  timeline: [
    {
      name: 'Day 1 Morning Live Shadow',
      status: '완료',
      date: '2026.09.02',
      result: 'Morning LLM prediction은 실제 결과 평가까지 완료했고, ML 50개 예측은 target maturity 이후 평가 대기입니다.',
    },
    {
      name: 'Day 1 Evening Evaluation',
      status: '완료',
      date: '2026.09.02',
      result: '실제 KOSPI·KOSDAQ 결과를 read-back했으며, ML 50개는 아직 평가되지 않았습니다.',
    },
  ],
  blogPosts: [],
}

const ISEKAI_MAGE: Experiment = {
  id: 'isekai-instagram-mage-experiment',
  name: '이세계 인스타 여신 마법사 — GPT Image 2 + LTX 2.5',
  description: 'GPT Image 2 캐릭터 기준 시트와 LTX 2.5 native audio I2V를 결합해 같은 인물이 서울에서 이세계의 마법사로 이어지는 60초 프롤로그 숏 무비를 만드는 실험',
  progress: 100,
  color: 'purple',
  status: '완료',
  category: 'completed',
  startedAt: '2026.08.20',
  whyText: '이 실험은 완벽한 영화 제작이 아니라 로컬 AI 비디오 생성, GPT Luna의 프롬프트 작성·검증 능력, Hermes 멀티툴 자동화, LTX 2.5의 native audio를 한 번에 확인하는 Lab 테스트다. GPT Image 2 캐릭터 기준 시트를 모든 장면에 참조했지만, 최종 영상에서는 여성·헤어·분위기는 유지되고 얼굴 identity는 장면 중간에 달라졌다. 개별 프레임의 해부학 검증만으로는 cross-scene 동일 인물을 보장할 수 없다는 검증 프로토콜의 한계를 확인했다.',
  nextGoals: ['얼굴이 잘 보이는 2~3개 장면만 distilled/base 모델 비교', 'steps 증가에 따른 얼굴 보존·생성 시간 trade-off 측정', '얼굴 identity gate와 임베딩 기반 비교 추가'],
  timeline: [
    { name: 'GPT Image 2 캐릭터 기준 시트', status: '완료', date: '2026.08.20', result: '정면·3/4·전신·측면 2×2 시트 생성, identity anchor 확정' },
    { name: '6개 장면 이미지 생성', status: '완료', date: '2026.08.20', result: '동일 기준 시트 참조, 장면별 시각 검수 및 Scene 4 손 crop 재생성' },
    { name: 'LTX 2.5 6개 I2V 클립', status: '완료', date: '2026.08.20', result: '채택 클립 생성 1125.513초, 6개 모두 10.041667초·1280×704·24fps·AAC native audio' },
    { name: '얼굴 identity 비교 검증', status: '완료', date: '2026.08.20', result: '개별 프레임은 해부학적으로 사용 가능했지만, 기준 시트와 cross-scene 비교에서 다른 얼굴로 변하는 현상 확인' },
    { name: '최종 MP4 합성 + 출력 검증', status: '완료', date: '2026.08.20', blogSlug: '/lab/isekai-instagram-mage-prologue', result: '6개 클립을 0.45초 xfade/acrossfade로 합성. 최종 58초·1280×704·H.264 NVENC·AAC 생성, ffprobe 및 faststart/yuv420p 검증, 공개 게시' },
  ],
  blogPosts: ['/lab/isekai-instagram-mage-prologue'],
  githubUrl: 'https://github.com/gdevsnack-ai-labs/devsnack-blog',
}

// ── Luna Agentic Game Development Lab — AI 개발팀 E2E 실험 (2026.08.23 시작) ──
const LUNA_AGENTIC_GAME_DEV: Experiment = {
  id: 'luna-agentic-game-dev',
  name: 'Luna Agentic Game Development Lab',
  description: 'Hermes Agent와 GPT-5.6 Luna가 로컬 LLM worker·Godot·Forgejo를 연결해 실제 AI 개발팀의 PR·review·merge 루프를 수행할 수 있는지 검증하는 장기 실험',
  progress: 35,
  color: 'blue',
  status: '진행중',
  category: 'running',
  startedAt: '2026.08.23',
  whyText: 'AI에게 게임 기능을 한 번 만들어보게 하는 것이 아니라, 실제 소프트웨어 프로젝트의 책임 구조를 나누고 결과를 다음 세션에 이어받을 수 있는지 확인한다. Luna는 계획·검토·merge를 담당하고 worker는 독립 workspace와 branch에서 구현한다. 첫 단계는 작은 Godot task로 시작해 server-side main 보호, PR review, post-merge test까지 실제로 연결하는 것이다.',
  nextGoals: ['worker-qwen과 Luna 계정 분리 후 공식 APPROVED review 검증', 'non-trivial Godot task-002', 'worker metrics/profile 영속화', 'live safe-stop/watchdog', '두 번째 worker와 resource budget 검증', 'conflict recovery 실험'],
  timeline: [
    { name: 'Phase 0 — Environment Audit', status: '완료', date: '2026.08.23', result: 'Hermes·GB10·Qwen·Godot·Forgejo·Git·delegation을 실제 환경에서 확인하고 Orinith unavailable 상태를 분리' },
    { name: 'Phase 1 — Repository & Godot Baseline', status: '완료', date: '2026.08.23', result: '빈 저장소를 local main으로 초기화하고 deterministic Godot smoke scene과 handoff/session 기록 구축' },
    { name: 'Phase 2 — Worker Registry & Workspace', status: '완료', date: '2026.08.23', result: 'Qwen registry, workspace/branch guard, health probe, 독립 clone 준비' },
    { name: 'Phase 3 — Protected Forgejo E2E', status: '완료', date: '2026.08.23', result: 'worker task → PR #1 → Luna review → protected merge → post-merge Godot smoke를 실제 실행. direct main push 거부도 확인' },
    { name: 'Phase 4 — Session Manager Foundation', status: '진행중', date: '2026.08.23', result: 'WAKE부터 COMPLETE까지 15개 상태 전이와 60분 new-task lock 정책을 dry-run. live watchdog과 scheduled session은 미검증' },
    { name: 'Sol 설계 검수', status: '진행중', date: '2026.08.23', result: '설계·구현·검증 사실과 다음 결정이 필요한 경계를 별도 검수 문서로 정리' },
    { name: 'Phase 5 — Parallel Workers', status: '예정', result: 'worker 계정 분리와 두 모델 resource probe 이후 시작' },
    { name: 'Phase 6 — Conflict Recovery', status: '예정', result: '의도적인 rebase conflict와 다음 세션 복구를 검증' },
  ],
  blogPosts: ['/lab/luna-agentic-game-dev-e2e'],
}

// ── Hermes Memory Experiment — 장기 메모리 구조 개선 실험 (2026.08.23 시작) ──
const HERMES_MEMORY: Experiment = {
  id: 'hermes-memory',
  name: 'Hermes Memory Experiment',
  description: '기억을 더 많이 저장하는 대신, 항상 알고 있어야 하는 기억부터 정리하면 AI 에이전트의 기억 경험이 달라지는지 검증하는 장기 실험',
  progress: 17,
  color: 'blue',
  status: '진행중',
  category: 'running',
  startedAt: '2026.08.23',
  whyText: 'Hermes를 실제 비서처럼 사용하면서 Hindsight에 기억은 계속 쌓이는데도 나를 기억한다기보다 매번 검색하는 느낌을 받았다. 이번 실험은 Hindsight를 더 크게 만드는 대신 SOUL·USER·MEMORY·Hindsight·Wiki가 무엇을 항상 알고 있어야 하는지부터 나누고, 새 세션의 실제 사용 데이터로 기억 경험이 달라지는지 확인한다.',
  nextGoals: ['새 Hermes 세션에서 Phase 1 사용 데이터 수집', 'Phase 2 Recall Diet A/B', 'Phase 3 Current-turn Recall 비교', 'Phase 4 Cross-layer Consolidation', 'Phase 5 Forgetting', 'Phase 6 Blind Memory Test'],
  timeline: [
    { name: 'Memory diagnosis와 Before 기준선 확인', status: '완료', date: '2026.08.23', result: 'Hindsight facts·observations·links와 USER/MEMORY 사용량을 역사적 Before 스냅샷으로 고정' },
    { name: 'Phase 1 — Working Memory Restructure', status: '완료', date: '2026.08.23', result: 'USER.md는 안정적 사용자 모델, MEMORY.md는 현재 working memory로 재정의. Hindsight bank·container·backend는 변경하지 않음' },
    { name: 'Phase 1 평가 — 새 세션 사용 데이터', status: '진행중', date: '2026.08.23', result: '구조 변경은 완료했지만 기억 경험의 개선 여부는 새 Hermes 세션의 실제 질문·recall·stale memory 관찰 후 판단' },
    { name: 'Phase 2 — Recall Diet', status: '예정', result: 'recall 양·관련성·stale intrusion·noise·latency·토큰량을 동일 질문 세트로 비교' },
    { name: 'Phase 3 — Current-turn Recall', status: '예정', result: 'previous-turn prefetch와 current-query synchronous·topic-change fallback 비교' },
    { name: 'Phase 4 — Memory Consolidation', status: '예정', result: '반복성·proof count·최근성·충돌을 평가해 안정적인 User Model과 Current State 후보 생성' },
    { name: 'Phase 5 — Forgetting', status: '예정', result: 'Stable·Current·Episodic·Transient·Expired lifecycle로 오래된 상태와 일회성 노이즈 분리' },
    { name: 'Phase 6 — Blind Memory Test', status: '예정', result: '30문항으로 user model·current state·episode recall·conflict·stale·noise를 Before/After 비교' },
  ],
  blogPosts: ['/lab/hermes-memory-experiment'],
}

const AI_GAME_ASSETS: Experiment = {
  id: 'ai-game-assets-sprite-lab',
  name: 'AI Game Assets — GPT Image vs LTX 2.5',
  description: '같은 2D 픽셀 캐릭터를 GPT Image 직접 스프라이트와 LTX 2.5 I2V 프레임으로 각각 만들고 게임 에셋으로 쓸 수 있는지 비교하는 실험',
  progress: 100,
  color: 'blue',
  status: '완료',
  category: 'completed',
  startedAt: '2026.08.23',
  whyText: '이미지 한 장을 게임 캐릭터로 쓰는 것과, 실제로 움직이는 스프라이트를 만드는 것은 다른 문제다. 같은 로컬 AI 마법사를 기준으로 GPT Image에는 연속 포즈 시트를 직접 요청하고, LTX 2.5에는 1:1 시작 이미지와 단일 동작을 넣어 영상에서 프레임을 추출했다. 두 레인의 캐릭터 일관성·프레임 연결성·배경 제거·캔버스 설정 문제를 직접 비교한다. 동시에 사용자의 교정 지시가 에이전트 작업에 어떻게 반영되는지, 지시와 하네스가 결과 품질을 어떻게 바꾸는지도 관찰한다.',
  nextGoals: ['생성 전 입력·출력 조건과 성공 기준을 고정하는 하네스 개선', '공격 모션의 수동 프레임 보정', 'Unity·Godot용 메타데이터 포맷 추가', '다른 캐릭터 실루엣으로 재현성 확인'],
  timeline: [
    { name: 'GPT Image 캐릭터 기준 시트', status: '완료', date: '2026.08.23', result: '로컬 AI 마법사의 정면·3/4·전신·측면 픽셀 아트 기준 시트 생성' },
    { name: 'GPT Image 직접 스프라이트', status: '완료', date: '2026.08.23', result: 'idle·walk·jump·attack 4×2 시트 생성, 모션당 8프레임으로 분할' },
    { name: 'LTX 직사각 출력 실패 기록', status: '완료', date: '2026.08.23', result: '1280·720 설정에서 실제 704×1280 출력. 사이드뷰 지팡이 경계 잘림 확인' },
    { name: 'LTX 정사각 I2V', status: '완료', date: '2026.08.23', result: '720·720 요청 → 실제 704×704, 24fps, 5.041667초, H.264/AAC 영상 4개 생성' },
    { name: '스프라이트 후처리', status: '완료', date: '2026.08.23', result: 'LTX 12·24프레임과 GPT Image 8프레임을 192×192 RGBA로 정규화하고 크로마 키·spill 제거' },
    { name: '비교 데모 공개', status: '완료', date: '2026.08.23', result: 'GPT Image·LTX 12f·LTX 24f를 같은 모션 버튼으로 비교하는 HTML Showcase 제작' },
    { name: 'Walk 24fps 전체 프레임 테스트', status: '완료', date: '2026.08.23', result: '2초 영상에서 48장, 3초 영상에서 72장을 추출해 24fps·원본 시간으로 재생하는 전용 Showcase 레인 추가' },
    { name: '사용자 지시 기반 교정 루프', status: '완료', date: '2026.08.23', result: '1:1 캔버스, 5초→3초 Walk, 24×2·24×3 정확한 프레임 수, 데모 레인 추가를 순차 반영. 구체적 지시에는 빠르게 맞췄지만 기존 워크플로를 재검토하지 않고 이어받은 문제를 확인' },
    { name: '4일차 운영 관찰과 하네스 개선 가설', status: '진행중', date: '2026.08.23', result: 'Hermes·GPT-5.6 Luna의 지능 부족보다 GPT 실행 하네스와 Hermes의 메모리·스킬·사용 지침, 기존 파일이 겹치며 기존 경로를 우선했을 가능성을 기록. 704×704 필요성·첫 Showcase 속도 기준을 사전 재판단하지 못한 사례를 근거로, 짧은 아이디어 테스트만으로 일반화하지 않고 컨텍스트 분리·목표 재선언·지시 템플릿을 비교 검증' },
  ],
  blogPosts: [],
  externalLinks: [
    { label: 'Sprite Motion Demo', href: '/ai-game-assets.html' },
  ],
}

export const experiments: Experiment[] = [AUTONOMOUS_AI_BLOG, STOCKPULSE_V1_FIXED, STOCKPULSE_SELF, AI_OMOK, BLOG_AUTO, LLM_BENCH, ISEKAI_MAGE, HERMES_MEMORY, LUNA_AGENTIC_GAME_DEV, AI_GAME_ASSETS, ...DUMMIES]

export function getPublicLabProjects(source: readonly Experiment[] = experiments): Experiment[] {
  return source.filter(experiment => !experiment.isDummy && experiment.publicDiscovery)
}
