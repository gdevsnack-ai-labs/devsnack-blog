import { experiments, type Experiment } from '@/data/experiments'
import {
  getCurrentStage,
  getDomainLabel,
  getFeaturedExperiment,
  getKeyFinding,
  getLabBoardMetadata,
  getLabStatusCounts,
  getLatestResult,
  getNature,
  getRecentFindings,
  getSortedTimeline,
  parseLabFilter,
} from './labs'

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

const aiOmok = experiments.find(item => item.id === 'ai-omok')!
const aiGameAssets = experiments.find(item => item.id === 'ai-game-assets-sprite-lab')!
expectEqual(getLabBoardMetadata(aiOmok).status, 'paused', 'AI Omok with completed runs and only planned next steps should project as Paused')
expectEqual(getLabBoardMetadata(aiOmok).confidence, 'inferred', 'AI Omok status must retain inferred confidence')
expectEqual(getLabBoardMetadata(aiGameAssets).status, 'completed', 'completed AI Game Assets experiment should project as Completed')
expectEqual(getLabBoardMetadata(aiGameAssets).confidence, 'confirmed', 'explicitly completed AI Game Assets status should not be marked inferred')
expectEqual(getLabBoardMetadata(aiOmok).nextAction, 'MCTS 탐색 적용 (알파고 방식)', 'next action should use the first explicit next goal')
expectEqual(getLabStatusCounts([aiOmok, aiGameAssets]).paused, 1, 'status counts must include Paused projects')
expectEqual(getLabStatusCounts([aiOmok, aiGameAssets]).completed, 1, 'status counts must include Completed projects')
expectEqual(getDomainLabel(aiGameAssets), 'Creative AI', 'AI Game Assets detail should use its Creative AI domain')
expectEqual(getNature(aiGameAssets).label, 'Creative Test', 'AI Game Assets detail should use its Creative Test nature')
expectEqual(parseLabFilter('running'), 'active', 'legacy running filter must remain compatible')
expectEqual(parseLabFilter('planning'), 'backlog', 'legacy planning filter must remain compatible')
console.log('labs helper tests passed')
