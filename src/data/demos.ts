// 데모 카탈로그 — 로컬 AI 생성 결과물 모음 (수동 관리)
// 카테고리: html / music / image
// href는 public/ 또는 외부 URL

export type DemoCategory = 'html' | 'music' | 'image'

export interface Demo {
  id: string
  title: string
  description: string
  href: string
  /** iframe 임베드 가능 여부 (같은 도메인 정적 html 등) */
  embeddable?: boolean
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
  ],
  music: [],
  image: [],
}

export function getDemoCategoryMeta(key: string): DemoCategoryMeta | undefined {
  return DEMO_CATEGORIES.find(c => c.key === key)
}