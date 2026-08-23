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
  whyText: '사람이 매번 주제와 방향을 정해주는 자동화가 아니라, AI에게 편집권 자체를 맡기면 어떤 콘텐츠 취향과 매체의 색깔이 생기는지 관찰한다. GitHub·Supabase·Vercel을 기존 블로그와 분리하고, AI가 주제·출처·형식·발행 여부를 결정한다. 첫 단계는 7일 블라인드 운영이며, 이후 1개월·3개월·6개월 단위로 판단의 변화와 운영 지속성을 비교한다.',
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
    ...(AUTONOMOUS_AI_BLOG_LIVE.latestPostUrl ? [{ label: 'Latest Note', href: AUTONOMOUS_AI_BLOG_LIVE.latestPostUrl }] : []),
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
  nextGoals: ['thinking ON/OFF 품질 차이 검증', 'Self Bench Pack 24종 에이전트 실행 (8080 qwen3.5-35b)', '벤치마크 자동화 스크립트 구축', 'Ridge vs NVFP4HIGH 속도·품질 비교'],
  timeline: [
    { name: '실행 스크립트 4종 작성',     status: '완료',   date: '2026.08.18', result: 'HIGH/VERY-HIGH × thinking ON/OFF, MTP n-max 6 + p-min 0.75' },
    { name: '단일 테스트 실측',            status: '완료',   date: '2026.08.18', result: '프리필 680~930 t/s, 디코드 17~19.5 t/s, 수락률 93.1%' },
    { name: '장기 서빙 실측 (4슬롯 동시)', status: '완료',   date: '2026.08.18', result: '장문 생성 18~22 t/s 유지, 수락률 평균 ~94%, 초장문 8,287토큰 18.5 t/s' },
    { name: '실사용 데모 (단일 프롬프트)', status: '완료',   date: '2026.08.18', result: 'Ragdoll Playground HTML — 1회 생성으로 완성, 데모 공개' },
    { name: 'Self Bench Pack 자체 설계 (24종)', status: '완료', date: '2026.08.18', result: 'TokenChaser 84개 참고·한영 이중언어 + 자기검증 루프 내장, 오픈코드 에이전트 실행기 구축' },
    { name: '실사용 데모 — Stock Dashboard (Ridge 3.7bpw)', status: '완료', date: '2026.08.19', result: 'Qwen3.8-27B Ridge 3.7bpw로 KOSPI/KOSDAQ 대시보드 1회 생성. 디코드 ~29 t/s, MTP 수락률 ~88%, worklog+llama_log 기록', blogSlug: '/lab/local-llm-benchmark-report' },
    { name: 'HTML in Canvas 데모', status: '완료', date: '2026.08.20', result: 'Canvas bitmap + HTML DOM overlay + html2canvas snapshot을 단일 HTML로 공개', blogSlug: '/research/html-in-canvas-dom-overlay-rasterization' },
    { name: '벤치 프롬프트 에이전트 실행', status: '예정',   result: '8080 qwen3.5-35b 백본, 생성→테스트→수정 루프' },
    { name: '다른 모델과 비교 (Muse Glimmer 30B 등)', status: '예정' },
  ],
  blogPosts: ['/research/qwen3-8-27b-nvfp4-mtp-gguf-gb10'],
  githubUrl: 'https://github.com/gdevsnack-ai-labs/devsnack-blog',
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

const AI_GAME_ASSETS: Experiment = {
  id: 'ai-game-assets-sprite-lab',
  name: 'AI Game Assets — GPT Image vs LTX 2.5',
  description: '같은 2D 픽셀 캐릭터를 GPT Image 직접 스프라이트와 LTX 2.5 I2V 프레임으로 각각 만들고 게임 에셋으로 쓸 수 있는지 비교하는 실험',
  progress: 100,
  color: 'blue',
  status: '완료',
  category: 'completed',
  startedAt: '2026.08.23',
  whyText: '이미지 한 장을 게임 캐릭터로 쓰는 것과, 실제로 움직이는 스프라이트를 만드는 것은 다른 문제다. 같은 로컬 AI 마법사를 기준으로 GPT Image에는 연속 포즈 시트를 직접 요청하고, LTX 2.5에는 1:1 시작 이미지와 단일 동작을 넣어 영상에서 프레임을 추출했다. 두 레인의 캐릭터 일관성·프레임 연결성·배경 제거·캔버스 설정 문제를 직접 비교한다.',
  nextGoals: ['공격 모션의 수동 프레임 보정', 'Unity·Godot용 메타데이터 포맷 추가', '다른 캐릭터 실루엣으로 재현성 확인'],
  timeline: [
    { name: 'GPT Image 캐릭터 기준 시트', status: '완료', date: '2026.08.23', result: '로컬 AI 마법사의 정면·3/4·전신·측면 픽셀 아트 기준 시트 생성' },
    { name: 'GPT Image 직접 스프라이트', status: '완료', date: '2026.08.23', result: 'idle·walk·jump·attack 4×2 시트 생성, 모션당 8프레임으로 분할' },
    { name: 'LTX 직사각 출력 실패 기록', status: '완료', date: '2026.08.23', result: '1280·720 설정에서 실제 704×1280 출력. 사이드뷰 지팡이 경계 잘림 확인' },
    { name: 'LTX 정사각 I2V', status: '완료', date: '2026.08.23', result: '720·720 요청 → 실제 704×704, 24fps, 5.041667초, H.264/AAC 영상 4개 생성' },
    { name: '스프라이트 후처리', status: '완료', date: '2026.08.23', result: 'LTX 12·24프레임과 GPT Image 8프레임을 192×192 RGBA로 정규화하고 크로마 키·spill 제거' },
    { name: '비교 데모 공개', status: '완료', date: '2026.08.23', result: 'GPT Image·LTX 12f·LTX 24f를 같은 모션 버튼으로 비교하는 HTML Showcase 제작' },
  ],
  blogPosts: [],
  externalLinks: [
    { label: 'Sprite Motion Demo', href: '/ai-game-assets.html' },
  ],
}

export const experiments: Experiment[] = [AUTONOMOUS_AI_BLOG, STOCKPULSE_SELF, AI_OMOK, BLOG_AUTO, LLM_BENCH, ISEKAI_MAGE, AI_GAME_ASSETS, ...DUMMIES]
