import { getCurrentStage, getLatestResult, getSortedTimeline } from './labs'
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
console.log('labs helper tests passed')
