import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
// @ts-expect-error Node's strip-types runner requires the explicit extension.
import {
  getStockpulseFixedViewModel,
  STOCKPULSE_V1_FIXED_PUBLICATION_ROOT,
  type StockpulseFixedProjection,
} from './stockpulse-v1-fixed.ts'

const projectionPath = fileURLToPath(new URL('../data/stockpulse-v1-fixed-projection.json', import.meta.url))
const projection = JSON.parse(readFileSync(projectionPath, 'utf-8')) as StockpulseFixedProjection
const componentSource = readFileSync(fileURLToPath(new URL('../components/stockpulse-v1-fixed-lab.tsx', import.meta.url)), 'utf-8')

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function expectedPublicationHref(
  publication: { status: string; path: string | null },
): string | null {
  if (publication.status !== 'available' || !publication.path) return null
  return `${STOCKPULSE_V1_FIXED_PUBLICATION_ROOT}/${publication.path.replace(/^\/+/, '')}`
}

expect(projection.runs.records.length > 0, 'projection must contain at least one run')
expect(projection.project.id === 'stockpulse-v1-fixed', 'wrong Project ID')
expect(projection.project.route === '/labs/stockpulse-v1-fixed', 'wrong Project route')

for (const run of projection.runs.records) {
  const view = getStockpulseFixedViewModel(projection, run)
  expect(view.date === run.trading_date, 'view date must follow the selected run')
  expect(view.publication.morning.href === expectedPublicationHref(run.publications.morning), 'Morning href must follow its actual publication path')
  expect(view.publication.evening.href === expectedPublicationHref(run.publications.evening), 'Evening href must follow its actual publication path')
  expect(view.publication.morning.status === run.publications.morning.status, 'Morning status must be projected unchanged')
  expect(view.publication.evening.status === run.publications.evening.status, 'Evening status must be projected unchanged')
}

const fixtureProjection = JSON.parse(JSON.stringify(projection)) as StockpulseFixedProjection
fixtureProjection.runs.records[0].publications = {
  morning: { status: 'available', path: 'reports/custom/morning/' },
  evening: { status: 'not_started', path: null },
}
const fixtureView = getStockpulseFixedViewModel(fixtureProjection)
expect(
  fixtureView.publication.morning.href === `${STOCKPULSE_V1_FIXED_PUBLICATION_ROOT}/reports/custom/morning/`,
  'available Morning must use the supplied publication path rather than the date'
)
expect(fixtureView.publication.evening.href === null, 'not_started Evening must not expose an inferred href')
expect(!/2026-09-0\d/.test(componentSource), 'component must not hardcode a publication date')
expect(!componentSource.includes('<Link href={view.publication.'), 'component must not pass a nullable pending href directly to Link')
expect(fixtureView.publicSecurityHits.length === 0, 'public security scan failed for the projection')

console.log(`StockPulse V1 Fixed view model test passed: runs=${projection.runs.records.length}`)
