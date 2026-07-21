// 현재 진행 중인 큰 박스 — 수동 관리
// docs/DESIGN.md 참조
// v3: experiments.ts의 AI Omok 데이터를 직접 사용

import { experiments } from './experiments'

const aiOmok = experiments.find(e => e.id === 'ai-omok')

export interface CurrentExperiment {
  id: string
  title: string
  subtitle: string
  progress: number
  status: string
  parts: Array<{ name: string; status: string }>
  link: string
}

export const currentExperiment: CurrentExperiment = aiOmok ? {
  id: aiOmok.id,
  title: aiOmok.name,
  subtitle: aiOmok.description,
  progress: aiOmok.progress,
  status: aiOmok.status,
  parts: aiOmok.timeline?.map(t => ({ name: t.name, status: t.status })) || [],
  link: '/lab/ai-omok',
} : {
  id: 'ai-omok',
  title: 'AI Omok Project',
  subtitle: 'AI 오목 엔진 개발 및 성능 고도화 실험',
  progress: 70,
  status: '진행중',
  parts: [
    { name: 'Part 1: RuleBot 대결',         status: '완료' },
    { name: 'Part 2: Minimax 엔진 개발',    status: '진행중' },
    { name: 'Part 3: Rapfi 엔진과 대결',    status: '예정' },
    { name: 'Part 4: 시각화 및 분석',       status: '예약' },
  ],
  link: '/lab/ai-omok',
}
