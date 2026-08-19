export type ResearchStatus = '조사완료' | '적용대기' | '진행중' | '적용완료' | '보류'
export type ResearchCategory = 'llm' | 'tts' | 'media' | 'benchmark' | 'hardware'
export type JunkStatus = '운영중' | '대기중' | '보관' | '완료' | '폐기'

export const RESEARCH_STATUS_META: Record<ResearchStatus, { emoji: string; label: string; badge: string }> = {
  조사완료: { emoji: '🔍', label: '조사 완료', badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  적용대기: { emoji: '⏳', label: '적용 대기', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  진행중: { emoji: '🔄', label: '진행 중', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  적용완료: { emoji: '✅', label: '적용 완료', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  보류: { emoji: '📦', label: '보류', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export const RESEARCH_CATEGORY_LABEL: Record<ResearchCategory, string> = {
  llm: '🤖 LLM / 모델',
  tts: '🎙️ TTS 엔진',
  media: '🎨 이미지 · 영상 · 음악',
  benchmark: '📊 벤치마크 · 도구',
  hardware: '🖥️ 하드웨어 · 기타',
}

export const RESEARCH_CATEGORIES = Object.keys(RESEARCH_CATEGORY_LABEL) as ResearchCategory[]

export const JUNK_STATUS_META: Record<JunkStatus, { emoji: string; label: string; badge: string }> = {
  운영중: { emoji: '🔧', label: '운영 중', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  대기중: { emoji: '⏸️', label: '대기 중', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  보관: { emoji: '📦', label: '보관', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  완료: { emoji: '✅', label: '완료', badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  폐기: { emoji: '🗑️', label: '폐기', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const RESEARCH_STATUS_ALIASES: Record<string, ResearchStatus> = {
  조사완료: '조사완료',
  적용대기: '적용대기',
  진행중: '진행중',
  적용중: '진행중',
  적용완료: '적용완료',
  보류: '보류',
}

export function classifyResearch(labels: readonly string[] | null | undefined) {
  const values = labels ?? []
  const status = values.map(label => RESEARCH_STATUS_ALIASES[label]).find(Boolean) ?? '조사완료'
  const category = values.find(label => RESEARCH_CATEGORIES.includes(label as ResearchCategory)) as ResearchCategory | undefined
  return {
    status,
    category: category ?? 'hardware',
    tags: values.filter(label => !RESEARCH_STATUS_ALIASES[label] && !RESEARCH_CATEGORIES.includes(label as ResearchCategory)),
  }
}

export function classifyJunk(labels: readonly string[] | null | undefined) {
  const values = labels ?? []
  const status = values.find(label => label in JUNK_STATUS_META) as JunkStatus | undefined
  return {
    status: status ?? '운영중',
    tags: values.filter(label => !(label in JUNK_STATUS_META)),
  }
}
