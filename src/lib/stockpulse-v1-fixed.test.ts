import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
// @ts-expect-error Node's strip-types runner requires the explicit extension.
import {
  getAvailableStockpulsePublications,
  getLatestAvailableStockpulsePublication,
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

const latestPublication = getLatestAvailableStockpulsePublication(projection)
const fixedPublications = getAvailableStockpulsePublications(projection)
const expectedAvailableCount = projection.runs.records.reduce((count, run) => count + [run.publications.morning, run.publications.evening].filter(publication => publication.status === 'available' && Boolean(publication.path)).length, 0)
expect(projection.runs.records.length >= 5, 'current projection must retain the recovered multi-date run history')
expect(fixedPublications.length === expectedAvailableCount, 'current projection must expose every available publication in its history')
expect(fixedPublications.length >= 9, 'current recovered projection must retain the September publication history')
const latestRun = projection.runs.records[0]
expect(fixedPublications[0]?.date === latestRun.trading_date, 'current publication history must start with the latest run date')
const latestStage = latestRun.publications.evening.status === 'available' && Boolean(latestRun.publications.evening.path) ? 'evening' : 'morning'
const latestRunPublication = latestRun.publications[latestStage]
expect(fixedPublications[0]?.stage === latestStage, 'latest available publication must prefer the same-date Evening when it exists')
expect(fixedPublications.some(item => item.date === '2026-09-02' && item.stage === 'morning'), 'current publication history must retain the oldest recovered Morning report')
expect(fixedPublications.every(item => item.status === 'available'), 'current publication list must contain available records only')
expect(latestPublication?.stage === latestStage, 'latest available publication must follow the latest run availability')
expect(latestPublication?.date === latestRun.trading_date, 'latest publication must use the latest trading date')
expect(latestPublication?.title === `${latestStage === 'morning' ? 'Morning' : 'Evening'} report · ${latestRun.trading_date} · StockPulse V1 Fixed`, 'latest publication title must identify the actual report')
expect(latestPublication?.href === `${STOCKPULSE_V1_FIXED_PUBLICATION_ROOT}/${latestRunPublication.path?.replace(/^\/+/, '')}`, 'latest publication must use the supplied publication path')

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
const eveningFixture = JSON.parse(JSON.stringify(projection)) as StockpulseFixedProjection
eveningFixture.runs.records[0].publications = {
  morning: { status: 'available', path: 'reports/2026-09-08/morning/' },
  evening: { status: 'available', path: 'reports/2026-09-08/evening/' },
}
const latestEvening = getLatestAvailableStockpulsePublication(eveningFixture)
expect(latestEvening?.stage === 'evening', 'same-date Evening must be preferred when it is available')
const historyFixture = JSON.parse(JSON.stringify({
  ...projection,
  runs: {
    ...projection.runs,
    records: [{
      ...projection.runs.records[0],
      run_id: 'live-shadow-2026-09-08-01',
      trading_date: '2026-09-08',
      publications: {
        morning: { status: 'available', path: 'reports/2026-09-08/morning/' },
        evening: { status: 'not_started', path: null },
      },
    }],
  },
})) as StockpulseFixedProjection
const baseRun = historyFixture.runs.records[0]
historyFixture.runs.records.push(
  {
    ...baseRun,
    run_id: 'live-shadow-2026-09-07-01',
    trading_date: '2026-09-07',
    publications: {
      morning: { status: 'available', path: 'reports/2026-09-07/morning/' },
      evening: { status: 'available', path: 'reports/2026-09-07/evening/' },
    },
  },
  {
    ...baseRun,
    run_id: 'live-shadow-2026-08-31-01',
    trading_date: '2026-08-31',
    publications: {
      morning: { status: 'available', path: 'reports/2026-08-31/morning/' },
      evening: { status: 'not_started', path: null },
    },
  },
)
const historyPublications = getAvailableStockpulsePublications(historyFixture)
expect(historyPublications.length === 3, 'fixed feed history must filter out dates before September and pending publications')
expect(historyPublications.map(item => `${item.date}:${item.stage}`).join(',') === '2026-09-08:morning,2026-09-07:evening,2026-09-07:morning', 'fixed feed history must sort newest date and Evening before Morning')
expect(!/2026-09-0\d/.test(componentSource), 'component must not hardcode a publication date')
expect(!componentSource.includes('<Link href={view.publication.'), 'component must not pass a nullable pending href directly to Link')
expect(!componentSource.includes('Evidence detail'), 'public Lab must not expose raw evidence detail')
expect(!componentSource.includes('Runtime evidence'), 'public Lab must not expose runtime evidence')
expect(!componentSource.includes('Read-only snapshot'), 'public Lab must not expose operator snapshot wording')
expect(!componentSource.includes('Day 1'), 'public Lab must not hardcode Day 1 wording')
expect(componentSource.includes('5개 거래 세션 후 확인'), 'public ML status must explain evaluation maturity')
expect(componentSource.includes('이날의 판단과 결과'), 'Run detail must use reader-facing wording')
expect(fixtureView.publicSecurityHits.length === 0, 'public security scan failed for the projection')

console.log(`StockPulse V1 Fixed view model test passed: runs=${projection.runs.records.length}`)
