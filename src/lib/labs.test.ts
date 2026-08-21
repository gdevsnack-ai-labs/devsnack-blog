import { getCurrentStage, getFeaturedExperiment, getKeyFinding, getLatestResult, getRecentFindings, getSortedTimeline } from './labs'
import type { Experiment } from '@/data/experiments'

function expectEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`)
}

function expectArray(actual: unknown[], expected: unknown[], message: string) {
  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

const experiment: Experiment = {
  id: 'fixture',
  name: 'Fixture',
  description: 'Fixture',
  progress: 45,
  color: 'blue',
  status: '진행중',
  category: 'running',
  startedAt: '2026.08.01',
  timeline: [
    { name: '실험 A', status: '완료', date: '2026.08.18', result: '오래된 결과' },
    { name: '실험 B', status: '예정', date: '2026.08.21', result: '아직 실행하지 않은 계획' },
    { name: '실험 C', status: '진행중', date: '2026.08.20', result: '최신 실제 결과' },
  ],
}

expectEqual(getLatestResult(experiment)?.name, '실험 C', 'latest result must ignore future plans')
expectEqual(getCurrentStage(experiment), '실험 C', 'current stage must prefer active work')
expectArray(getSortedTimeline(experiment).map(item => item.name), ['실험 B', '실험 C', '실험 A'], 'timeline must be newest first')

const activeSameDate: Experiment = {
  ...experiment,
  id: 'active-same-date',
  category: 'running',
  timeline: [{ name: '활성 실험', status: '진행중', date: '2026.08.20', result: '현재 결과' }],
}
const completedSameDate: Experiment = {
  ...experiment,
  id: 'completed-same-date',
  status: '완료',
  category: 'completed',
  timeline: [{ name: '완료 실험', status: '완료', date: '2026.08.20', result: '완료 결과' }],
}

expectEqual(getFeaturedExperiment([completedSameDate, activeSameDate])?.id, 'active-same-date', 'featured experiment must prefer active work on a date tie')
expectEqual(getKeyFinding({ ...experiment, id: 'local-llm-benchmark' })?.includes('Qwen3.8-27B'), true, 'key finding must use curated verified knowledge')
expectEqual(getRecentFindings([experiment, activeSameDate]).length, 0, 'findings feed must exclude projects without curated findings')
console.log('labs helper tests passed')
