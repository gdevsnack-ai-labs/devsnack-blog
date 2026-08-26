export interface AitechV1ArchiveEntry {
  date: string
  title: string
}

export interface AitechV1ArchiveMonth {
  key: string
  label: string
  entries: AitechV1ArchiveEntry[]
}

function monthKey(date: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.slice(0, 7) : 'undated'
}

function monthLabel(key: string): string {
  if (key === 'undated') return '발행일 미기록'
  const [year, month] = key.split('-').map(Number)
  return `${year}년 ${month}월`
}

export function formatAitechArchiveDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return '발행일 미기록'
  const [year, month, day] = date.split('-').map(Number)
  return `${year}년 ${month}월 ${day}일`
}

export function groupAitechV1Archive(entries: AitechV1ArchiveEntry[]): AitechV1ArchiveMonth[] {
  const groups = new Map<string, AitechV1ArchiveEntry[]>()
  for (const entry of entries) {
    const key = monthKey(entry.date)
    const current = groups.get(key) || []
    current.push(entry)
    groups.set(key, current)
  }

  return [...groups.entries()].map(([key, groupedEntries]) => ({
    key,
    label: monthLabel(key),
    entries: groupedEntries,
  }))
}
