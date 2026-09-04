import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { getStockpulseFixedViewModel } from './stockpulse-v1-fixed.ts'

const projectionPath = fileURLToPath(new URL('../data/stockpulse-v1-fixed-projection.json', import.meta.url))
const projection = JSON.parse(readFileSync(projectionPath, 'utf-8'))
const componentSource = readFileSync(fileURLToPath(new URL('../components/stockpulse-v1-fixed-lab.tsx', import.meta.url)), 'utf-8')
const view = getStockpulseFixedViewModel(projection)

if (view.project.id !== 'stockpulse-v1-fixed') throw new Error('wrong Project ID')
if (view.project.route !== '/labs/stockpulse-v1-fixed') throw new Error('wrong Project route')
if (view.snapshot.dayLabel !== 'Day 1') throw new Error('wrong day label')
if (view.date !== '2026-09-04') throw new Error('Vercel Lab projection is not on the latest trading date')
if (view.run.morning_llm_prediction.direction !== '보합') throw new Error('wrong latest Morning summary')
if (view.snapshot.morning !== '보합 0.61') throw new Error('wrong Morning summary')
if (view.snapshot.actual !== '상승') throw new Error('wrong actual summary')
if (view.snapshot.llmResult !== 'Incorrect') throw new Error('wrong LLM result')
if (view.snapshot.ml !== '50 Pending') throw new Error('wrong ML summary')
if (view.snapshot.improvement !== 'Applied') throw new Error('wrong improvement summary')
if (view.publication.morning.href !== 'https://gdevsnack-ai-labs.github.io/stockpulse-v1-fixed-publication/reports/2026-09-04/morning/') throw new Error('wrong latest Morning publication href')
if (view.publication.evening.href !== 'https://gdevsnack-ai-labs.github.io/stockpulse-v1-fixed-publication/reports/2026-09-04/evening/') throw new Error('wrong latest Evening publication href')
const priorView = getStockpulseFixedViewModel(projection, projection.runs.records[1])
if (priorView.publication.morning.href !== 'https://gdevsnack-ai-labs.github.io/stockpulse-v1-fixed-publication/reports/2026-09-03/morning/') throw new Error('wrong prior Morning publication href')
if (priorView.publication.evening.href !== 'https://gdevsnack-ai-labs.github.io/stockpulse-v1-fixed-publication/reports/2026-09-03/evening/') throw new Error('wrong prior Evening publication href')
if (view.findings.length !== 0) throw new Error('Day 1 must have no findings')
if (view.improvements.length !== 2) throw new Error('Lab must expose both 9/3 and 9/4 improvement records')
if (view.improvements[0].actual_applied !== true) throw new Error('latest improvement lacks verified application')
if (projection.runs.records.map((run: { trading_date: string }) => run.trading_date).join(',') !== '2026-09-04,2026-09-03') throw new Error('Run Board archive dates are incomplete')
if (view.publicSecurityHits.length !== 0) throw new Error(`public security scan failed: ${view.publicSecurityHits.join(', ')}`)
if (componentSource.includes('evaluated 0 · pending 50')) throw new Error('ML metric note is hardcoded to the first run')
if (componentSource.includes('Morning report · 2026-09-02')) throw new Error('publication label is hardcoded to the first run')
if (componentSource.includes('Evening report · 2026-09-02')) throw new Error('publication label is hardcoded to the first run')

console.log('StockPulse V1 Fixed view model test passed')
