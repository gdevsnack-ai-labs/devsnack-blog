import { experiments, type Experiment } from '@/data/experiments'
import {
  getCurrentStage,
  getDomainLabel,
  getFeaturedExperiment,
  getProjectFinding,
  validateProjectFinding,
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

function expectValidProjectFinding(finding: ReturnType<typeof getProjectFinding>, label: string) {
  const errors = validateProjectFinding(finding)
  if (errors.length > 0) throw new Error(`${label} Project Finding is invalid: ${errors.join(', ')}`)
}

const validFinding = {
  statement: 'scoped conclusion',
  evidence: ['supporting evidence'],
  scope: 'bounded scope',
  confidence: 'limited',
}
expectEqual(validateProjectFinding(undefined).includes('missing'), true, 'missing Project Finding must be rejected')
expectEqual(validateProjectFinding({ ...validFinding, statement: '' }).includes('statement'), true, 'empty Finding statement must be rejected')
expectEqual(validateProjectFinding({ ...validFinding, evidence: [] }).includes('evidence'), true, 'empty Finding evidence must be rejected')
expectEqual(validateProjectFinding({ ...validFinding, scope: '' }).includes('scope'), true, 'missing Finding scope must be rejected')
expectEqual(validateProjectFinding({ ...validFinding, confidence: undefined }).includes('confidence'), true, 'missing Finding confidence must be rejected')

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

const knownActiveSameDate: Experiment = { ...activeSameDate, id: 'ai-omok' }
const knownCompletedSameDate: Experiment = { ...completedSameDate, id: 'stockpulse-ai-self-improvement' }
expectEqual(getFeaturedExperiment([knownCompletedSameDate, knownActiveSameDate])?.id, 'ai-omok', 'featured experiment must prefer active work on a date tie')
const localLlmFinding = getProjectFinding({ ...experiment, id: 'local-llm-benchmark' })
expectValidProjectFinding(localLlmFinding, 'Local LLM')
const autonomous = experiments.find(item => item.id === 'autonomous-ai-blog')!
expectEqual(getProjectFinding(autonomous), undefined, 'autonomous publications must not become a project finding')
expectEqual(getProjectFinding({ ...experiment, id: 'activity-only-project' }), undefined, 'Latest Activity must not become a Project Finding')
expectEqual(getRecentFindings([experiment, activeSameDate]).length, 0, 'findings feed must exclude projects without curated findings')

for (const projectId of ['blog', 'local-llm-benchmark', 'ai-omok', 'stockpulse-ai-self-improvement', 'hermes-memory', 'luna-agentic-game-dev', 'isekai-instagram-mage-experiment']) {
  const project = experiments.find(item => item.id === projectId)
  if (!project) throw new Error(`Finding-bearing project is missing: ${projectId}`)
  expectValidProjectFinding(getProjectFinding(project), projectId)
}

const stockpulseFixed = experiments.find(item => item.id === 'stockpulse-v1-fixed')!
expectEqual(getLatestResult(stockpulseFixed)?.date, '2026.09.03', 'StockPulse V1 Fixed hub activity must follow the latest projection')
expectEqual(getLatestResult(stockpulseFixed)?.name, 'Day 1 Evening Evaluation', 'StockPulse V1 Fixed hub activity must use the completed Evening stage')

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
