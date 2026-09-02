import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { getStockpulseFixedViewModel } from './stockpulse-v1-fixed.ts'

const projectionPath = fileURLToPath(new URL('../data/stockpulse-v1-fixed-projection.json', import.meta.url))
const projection = JSON.parse(readFileSync(projectionPath, 'utf-8'))
const view = getStockpulseFixedViewModel(projection)

if (view.project.id !== 'stockpulse-v1-fixed') throw new Error('wrong Project ID')
if (view.project.route !== '/labs/stockpulse-v1-fixed') throw new Error('wrong Project route')
if (view.snapshot.dayLabel !== 'Day 1') throw new Error('wrong day label')
if (view.snapshot.morning !== '하락 0.62') throw new Error('wrong Morning summary')
if (view.snapshot.actual !== '하락') throw new Error('wrong actual summary')
if (view.snapshot.llmResult !== 'Correct') throw new Error('wrong LLM result')
if (view.snapshot.ml !== '50 Pending') throw new Error('wrong ML summary')
if (view.snapshot.improvement !== 'None') throw new Error('wrong improvement summary')
if (view.publication.morning.href !== 'https://gdevsnack-ai-labs.github.io/stockpulse-v1-fixed-publication/reports/2026-09-02/morning/') throw new Error('wrong Morning publication href')
if (view.publication.evening.href !== 'https://gdevsnack-ai-labs.github.io/stockpulse-v1-fixed-publication/reports/2026-09-02/evening/') throw new Error('wrong Evening publication href')
if (view.findings.length !== 0) throw new Error('Day 1 must have no findings')
if (view.improvements.length !== 0) throw new Error('Day 1 must have no improvement records')
if (view.publicSecurityHits.length !== 0) throw new Error(`public security scan failed: ${view.publicSecurityHits.join(', ')}`)

console.log('StockPulse V1 Fixed view model test passed')
