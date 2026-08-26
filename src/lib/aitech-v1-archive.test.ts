// @ts-expect-error Node's strip-types runner requires the explicit extension.
import { formatAitechArchiveDate, groupAitechV1Archive } from './aitech-v1-archive.ts'

const entries = [
  { date: '2026-08-26', title: '최신 기사' },
  { date: '2026-08-25', title: '이전 기사' },
  { date: '2026-07-31', title: '7월 기사' },
]

const groups = groupAitechV1Archive(entries)
if (groups.length !== 2) throw new Error(`expected 2 month groups, got ${groups.length}`)
if (groups[0].key !== '2026-08' || groups[0].entries.length !== 2) throw new Error('August archive grouping mismatch')
if (groups[1].label !== '2026년 7월') throw new Error('July archive label mismatch')
if (formatAitechArchiveDate('2026-08-26') !== '2026년 8월 26일') throw new Error('archive date formatting mismatch')
if (formatAitechArchiveDate('invalid') !== '발행일 미기록') throw new Error('invalid archive date fallback mismatch')

console.log('AI Tech v1 archive grouping tests passed')
