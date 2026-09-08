// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { stockpulseV1ExternalReports } from './stockpulse-migration.ts'

const LEGACY_PUBLICATION_ROOT = 'https://gdevsnack-ai-labs.github.io/stockpulse-publication/'
const invalid = stockpulseV1ExternalReports.filter(report => !report.external_url.startsWith(LEGACY_PUBLICATION_ROOT))

if (invalid.length > 0) {
  throw new Error(`Historical V1 reports must use the legacy publication root: ${invalid.map(report => report.old_slug).join(', ')}`)
}

console.log(`StockPulse historical publication link test passed: ${stockpulseV1ExternalReports.length} reports`)
