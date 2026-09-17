// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { BENCHMARK_SUITE_KEYS, loadPublicBenchmarkRelease } from './public-release.ts'

const release = loadPublicBenchmarkRelease()
if (BENCHMARK_SUITE_KEYS.length !== 8 || release.scope.suite_count !== 8) {
  throw new Error(`Expected eight benchmark suites, got ${BENCHMARK_SUITE_KEYS.length}/${release.scope.suite_count}`)
}
if (release.updated_at !== '2026-09-16') {
  throw new Error(`Current benchmark projection update date drifted: ${release.updated_at}`)
}
const available = release.models.filter(model => model.suites.external_tool_eval.status === 'available')
const notMeasured = release.models.filter(model => model.suites.external_tool_eval.status === 'not_in_public_export')
if (available.length !== 8 || notMeasured.length !== 15) {
  throw new Error(`External tool-eval coverage mismatch: available=${available.length}, notMeasured=${notMeasured.length}`)
}
const n25Q6 = release.models.find(model => model.model_id === 'n2-5-mini-q6-k')
if (n25Q6?.suites.external_tool_eval.score !== 91 || n25Q6.suites.external_tool_eval.scored !== 65 || n25Q6.suites.external_tool_eval.attempted !== 69) {
  throw new Error('N2.5 Mini Q6_K external tool-eval result contract failed')
}
if (notMeasured.some(model => 'score' in model.suites.external_tool_eval)) {
  throw new Error('Unmeasured external tool-eval rows must not contain numeric scores')
}

console.log(`public benchmark projection tests passed: models=${release.models.length}, externalAvailable=${available.length}`)
