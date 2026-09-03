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
if (view.date !== '2026-09-03') throw new Error('Vercel Lab projection is not on the latest trading date')
if (view.snapshot.morning !== '하락 0.68') throw new Error('wrong Morning summary')
if (view.snapshot.actual !== '상승') throw new Error('wrong actual summary')
if (view.snapshot.llmResult !== 'Incorrect') throw new Error('wrong LLM result')
if (view.snapshot.ml !== '50 Pending') throw new Error('wrong ML summary')
if (view.snapshot.improvement !== 'Applied') throw new Error('wrong improvement summary')
if (view.publication.morning.href !== 'https://gdevsnack-ai-labs.github.io/stockpulse-v1-fixed-publication/reports/2026-09-03/morning/') throw new Error('wrong Morning publication href')
if (view.publication.evening.href !== 'https://gdevsnack-ai-labs.github.io/stockpulse-v1-fixed-publication/reports/2026-09-03/evening/') throw new Error('wrong Evening publication href')
if (view.findings.length !== 0) throw new Error('Day 1 must have no findings')
if (view.improvements.length !== 1) throw new Error('Day 1 must expose the applied improvement record')
if (view.improvements[0].actual_applied !== true) throw new Error('Day 1 improvement lacks verified application')
if (view.publicSecurityHits.length !== 0) throw new Error(`public security scan failed: ${view.publicSecurityHits.join(', ')}`)
if (componentSource.includes('evaluated 0 · pending 50')) throw new Error('ML metric note is hardcoded to the first run')
if (componentSource.includes('Morning report · 2026-09-02')) throw new Error('publication label is hardcoded to the first run')
if (componentSource.includes('Evening report · 2026-09-02')) throw new Error('publication label is hardcoded to the first run')

console.log('StockPulse V1 Fixed view model test passed')
