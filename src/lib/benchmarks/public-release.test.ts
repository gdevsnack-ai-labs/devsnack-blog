// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { BENCHMARK_SUITE_KEYS, loadPublicBenchmarkRelease } from './public-release.ts'

const release = loadPublicBenchmarkRelease()
if (BENCHMARK_SUITE_KEYS.length !== 8 || release.scope.suite_count !== 8) {
  throw new Error(`Expected eight benchmark suites, got ${BENCHMARK_SUITE_KEYS.length}/${release.scope.suite_count}`)
}
if (release.updated_at !== '2026-09-17') {
  throw new Error(`Current benchmark projection update date drifted: ${release.updated_at}`)
}
const available = release.models.filter(model => model.suites.external_tool_eval.status === 'available')
const notMeasured = release.models.filter(model => model.suites.external_tool_eval.status === 'not_in_public_export')
if (release.models.length !== 28 || available.length !== 13 || notMeasured.length !== 15) {
  throw new Error(`Benchmark coverage mismatch: models=${release.models.length}, available=${available.length}, notMeasured=${notMeasured.length}`)
}
if (release.scope.model_variant_count !== 28 || release.scope.source_run_references !== 209 || release.scope.fresh_full_cycle_runs !== 63 || release.scope.external_evaluator_runs !== 13) {
  throw new Error(`Benchmark scope mismatch: ${JSON.stringify(release.scope)}`)
}
const laguna = release.models.find(model => model.model_id === 'laguna-s-2-1-apex-i-balanced')
if (!laguna || laguna.suites.performance.status !== 'available' || laguna.suites.server_performance.status !== 'available' || laguna.suites.knowledge.status !== 'available' || laguna.suites.knowledge.version !== 1.2 || laguna.suites.knowledge.correct !== 88 || laguna.suites.knowledge.total !== 100 || laguna.suites.knowledge.source_run_id !== '20260917-125510-132b45' || laguna.suites.coding.status !== 'available' || laguna.suites.tool_call.status !== 'available' || laguna.suites.agent_single.status !== 'available' || laguna.suites.agent_multi.status !== 'available' || laguna.suites.external_tool_eval.score !== 86 || laguna.suites.external_tool_eval.scored !== 69 || laguna.suites.external_tool_eval.attempted !== 69 || laguna.suites.external_tool_eval.safety_gate_passed !== false) {
  throw new Error('Laguna S 2.1 benchmark result contract failed')
}
const xsExpected: Record<string, { quantization: string; knowledge: number; external: number }> = {
  'laguna-xs-2-1-q4-k-m': { quantization: 'Q4_K_M', knowledge: 85, external: 86 },
  'laguna-xs-2-1-q5-k-m': { quantization: 'Q5_K_M', knowledge: 88, external: 88 },
  'laguna-xs-2-1-q6-k-l': { quantization: 'Q6_K_L', knowledge: 88, external: 88 },
  'laguna-xs-2-1-q8-0': { quantization: 'Q8_0', knowledge: 84, external: 87 },
}
if (release.model_families['laguna-xs-2-1']?.variant_count !== 4) {
  throw new Error('Laguna XS 2.1 family contract failed')
}
for (const [modelId, expected] of Object.entries(xsExpected)) {
  const xs = release.models.find(model => model.model_id === modelId)
  if (!xs || xs.model !== 'Laguna XS 2.1' || xs.variant !== expected.quantization || xs.quantization !== expected.quantization || xs.mtp_mode !== 'non-mtp' || xs.suites.knowledge.status !== 'available' || xs.suites.knowledge.version !== 1.2 || xs.suites.knowledge.correct !== expected.knowledge || xs.suites.knowledge.total !== 100 || xs.suites.external_tool_eval.score !== expected.external || xs.suites.external_tool_eval.scored !== 69 || xs.suites.external_tool_eval.attempted !== 69 || xs.suites.external_tool_eval.safety_gate_passed !== false) {
    throw new Error(`Laguna XS 2.1 benchmark result contract failed: ${modelId}`)
  }
}
const n25Q6 = release.models.find(model => model.model_id === 'n2-5-mini-q6-k')
if (n25Q6?.suites.external_tool_eval.score !== 91 || n25Q6.suites.external_tool_eval.scored !== 65 || n25Q6.suites.external_tool_eval.attempted !== 69) {
  throw new Error('N2.5 Mini Q6_K external tool-eval result contract failed')
}
if (notMeasured.some(model => 'score' in model.suites.external_tool_eval)) {
  throw new Error('Unmeasured external tool-eval rows must not contain numeric scores')
}

console.log(`public benchmark projection tests passed: models=${release.models.length}, externalAvailable=${available.length}`)
