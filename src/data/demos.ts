// 데모 카탈로그 — 로컬 AI 생성 결과물 모음 (수동 관리)
// 카테고리: html / music / image / shortmovie
// href는 public/ 또는 외부 URL

export type DemoCategory = 'html' | 'music' | 'image' | 'shortmovie'

export interface Demo {
  id: string
  title: string
  description: string
  href: string
  /** iframe 임베드 가능 여부 (같은 도메인 정적 html 등) */
  embeddable?: boolean
  /** 외부 미디어의 렌더링 방식 */
  mediaType?: 'video'
  model: string
  createdAt: string
  /** 출처/비고 */
  note?: string
}

export interface DemoCategoryMeta {
  key: DemoCategory
  label: string
  emoji: string
  description: string
}

export const DEMO_CATEGORIES: DemoCategoryMeta[] = [
  { key: 'html',  label: 'HTML',  emoji: '📄', description: '단일 파일 HTML 인터랙티브 데모' },
  { key: 'music', label: 'Music', emoji: '🎵', description: 'AI 생성 음악/오디오 데모' },
  { key: 'image', label: 'Image', emoji: '🖼️', description: 'AI 생성 이미지 데모' },
  { key: 'shortmovie', label: 'Short Movie', emoji: '🎬', description: 'AI 생성 단편 영상 — LTX 2.5 + Krea2' },
]

export const DEMOS: Record<DemoCategory, Demo[]> = {
  html: [
    {
      id: 'ragdoll-playground-qwen3.8',
      title: 'Ragdoll Playground',
      description: '래그돌 물리 시뮬레이터 — 드래그·낙하·바운스·안티그래비티, Qwen3.8-27B가 단일 프롬프트 1회로 생성',
      href: '/ragdoll-playground-qwen3.8.html',
      embeddable: true,
      model: 'Qwen3.8-27B NVFP4 MTP HIGH (nothink)',
      createdAt: '2026.08.18',
      note: '프롬프트 출처: Token Chaser MiMo-v2.5 vs Qwen3.6 27B 영상. 수정·재시도 없이 한 번에 나온 결과물.',
    },
    {
      id: 'stock-dashboard-qwen3.8',
      title: 'Stock Dashboard — Qwen3.8-27B Ridge 3.7bpw',
      description: 'KOSPI/KOSDAQ 한국 주식 대시보드 — 8개 종목 카드, 실시간 등락률, 7일 스파크라인, 30일 캔버스 차트, KO/EN 이중언어, 검색 필터, 모달 상세보기',
      href: '/stock-dashboard-qwen3.8.html',
      embeddable: true,
      model: 'Qwen3.8-27B Ridge 3.7bpw (nothink, MTP)',
      createdAt: '2026.08.19',
      note: 'Local LLM Benchmark 실험 — 벤치 프롬프트 "한국 주식 대시보드" 1회 생성. 디코드 ~29 t/s, MTP 수락률 ~88%. worklog + llama_log 포함.',
    },
    {
      id: 'html-in-canvas',
      title: 'HTML in Canvas — DOM Overlay Lab',
      description: 'Canvas 애니메이션 배경과 HTML DOM UI를 겹쳐 구성하고, DOM 카드를 별도 Canvas bitmap으로 변환하는 렌더링 데모',
      href: '/html-in-canvas.html',
      embeddable: true,
      model: 'Vanilla HTML + Canvas API + html2canvas',
      createdAt: '2026.08.20',
      note: 'Canvas 그래픽·HTML overlay·HTML→Canvas snapshot을 한 화면에서 비교. html2canvas CDN이 로드되면 PNG 다운로드까지 지원.',
    },
  ],
  music: [],
  image: [],
  shortmovie: [
    {
      id: 'hero-intro-30s',
      title: '히어로 인트로 — 30초 6히어로',
      description: '6명의 히어로가 각자 능력을 시전하는 30초 인트로 영상. 각 씬별 시네마틱 이미지 + LTX 2.5 i2v.',
      href: '/hero-intro.html',
      embeddable: true,
      model: 'Krea2 (Flux) + LTX 2.5 22B i2v',
      createdAt: '2026.08.18',
      note: '이미지 6장(Krea2 1280×720) → 영상 6개(LTX 2.5, 각 5초) → ffmpeg concat. GB10 로컬 생성.',
    },
    {
      id: 'isekai-instagram-mage-prologue',
      title: '이세계 인스타 여신 마법사 — 1회차 프롤로그',
      description: 'GPT Image 2 캐릭터 기준 시트에서 출발해 LTX 2.5 native audio로 만든 58초 프롤로그. 얼굴 identity drift를 포함한 first-pass baseline.',
      href: 'https://devsnack-blog.vercel.app/api/drive?id=11sHsDe7pabvrxu1uiixefufmoWg0D4CI',
      embeddable: true,
      mediaType: 'video',
      model: 'GPT Image 2 Medium + LTX 2.5 distilled NVFP4',
      createdAt: '2026.08.20',
      note: '6장면 × 10초, 1280×704, 24fps, native AAC. 상세 실험 기록은 Lab 글에서 확인할 수 있습니다.',
    },
  ],
}

export function getDemoCategoryMeta(key: string): DemoCategoryMeta | undefined {
  return DEMO_CATEGORIES.find(c => c.key === key)
}