// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { getStockPulseExternalReport, getStockPulseExternalReportUrl, getStockPulseWeeklyExternalNoteUrl, stockpulseV1ExternalReports } from './stockpulse-migration.ts'

function expectEqual(actual: unknown, expected: unknown, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

expectEqual(stockpulseV1ExternalReports.length, 68, 'external migration map must contain all 68 v1 reports')
expectEqual(getStockPulseExternalReport('2026-08-27')?.report_type, 'morning', 'latest morning slug must resolve')
expectEqual(getStockPulseExternalReport('8300-2-9-kospi-8300-breakdown')?.report_date, '2026-07-02', 'legacy slug must resolve by exact old slug')
expectEqual(getStockPulseExternalReportUrl('missing-slug'), null, 'unknown legacy slug must not invent a target')
expectEqual(getStockPulseExternalReport('2026-08-26-6-742pt')?.migration_class, 'duplicate_candidate', 'duplicate candidate metadata must survive')
expectEqual(getStockPulseWeeklyExternalNoteUrl('stockpulse-weekly-2026-08-18'), 'https://gdevsnack-ai-labs.github.io/stockpulse-publication/lab-notes/stockpulse-weekly-2026-08-18/', 'weekly note must have an exact external target')

console.log('StockPulse migration mapping tests passed')
