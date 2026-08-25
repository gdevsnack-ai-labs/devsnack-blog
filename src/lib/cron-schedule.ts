import type { CronJob } from './operations-types'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

interface CronParts {
  minute: string
  hour: string
  dayOfMonth: string
  month: string
  dayOfWeek: string
}

function parseCronParts(schedule: string): CronParts | null {
  const fields = schedule.trim().split(/\s+/)
  if (fields.length !== 5) return null

  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields
  return { minute, hour, dayOfMonth, month, dayOfWeek }
}

function parseFieldValues(field: string, minimum: number, maximum: number): number[] {
  const values = new Set<number>()

  for (const token of field.split(',')) {
    const [range, stepText] = token.split('/')
    const step = stepText ? Number(stepText) : 1
    if (!Number.isInteger(step) || step < 1) continue

    let start = minimum
    let end = maximum
    if (range !== '*') {
      const rangeParts = range.split('-').map(Number)
      if (rangeParts.some(value => !Number.isInteger(value))) continue
      start = rangeParts[0]
      end = rangeParts.length > 1 ? rangeParts[1] : start
    }

    for (let value = start; value <= end; value += step) {
      if (value >= minimum && value <= maximum) values.add(value)
    }
  }

  return [...values].sort((a, b) => a - b)
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function formatWeekday(field: string): string {
  if (field === '*') return '매일'
  if (field === '1-5') return '평일'

  const values = parseFieldValues(field, 0, 7).map(value => value === 7 ? 0 : value)
  const uniqueValues = [...new Set(values)]
  if (uniqueValues.length === 0) return ''

  if (uniqueValues.length === 1) {
    return `매주 ${WEEKDAY_LABELS[uniqueValues[0]]}요일`
  }

  return `매주 ${uniqueValues.map(value => WEEKDAY_LABELS[value]).join('·')}`
}

function formatDateTimeOnce(schedule: string): string | null {
  const match = schedule.trim().match(/^once at\s+(.+)$/i)
  return match ? `1회 · ${match[1]}` : null
}

export function isOneTimeSchedule(schedule: string | null | undefined): boolean {
  return /^once at\s+/i.test(String(schedule ?? '').trim())
}

export function formatCronSchedule(schedule: string | null | undefined): string {
  const normalized = String(schedule ?? '').trim()
  if (!normalized) return '표현 없음'

  const once = formatDateTimeOnce(normalized)
  if (once) return once

  const parts = parseCronParts(normalized)
  if (!parts) return '해석할 수 없는 스케줄'

  const dayLabel = formatWeekday(parts.dayOfWeek)
  const minuteStep = parts.minute.match(/^\/(\d+)$/) ?? parts.minute.match(/^\*\/(\d+)$/)
  const hourStep = parts.hour.match(/^\/(\d+)$/) ?? parts.hour.match(/^\*\/(\d+)$/)

  if (minuteStep && (parts.hour === '*' || /^\d+-\d+$/.test(parts.hour))) {
    const prefix = parts.hour === '*' ? '' : `${dayLabel} `
    return `${prefix}${minuteStep[1]}분마다`
  }

  if (parts.minute === '0' && parts.hour === '*') {
    return `${dayLabel === '매일' ? '' : `${dayLabel} `}매시간 정각`
  }

  if (parts.minute === '0' && hourStep) {
    return `${hourStep[1]}시간마다 정각`
  }

  const minutes = parseFieldValues(parts.minute, 0, 59)
  const hours = parseFieldValues(parts.hour, 0, 23)
  if (minutes.length === 0 || hours.length === 0) return '해석할 수 없는 스케줄'

  const times = hours.flatMap(hour => minutes.map(minute => formatTime(hour, minute)))
  const timeLabel = times.length <= 6 ? times.join(' · ') : `${times[0]}부터 ${times[times.length - 1]}까지`

  if (parts.dayOfMonth !== '*' || parts.month !== '*') {
    return `${dayLabel === '매일' ? '지정된 날짜' : dayLabel} ${timeLabel}`
  }

  return `${dayLabel} ${timeLabel}`
}

function extractTimeOfDay(value: string | null | undefined): number | null {
  if (!value) return null
  const match = value.match(/(?:T|\s)(\d{1,2}):(\d{2})/)
  if (!match) return null

  const hour = Number(match[1])
  const minute = Number(match[2])
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 ? hour * 60 + minute : null
}

export function cronTimeSortKey(schedule: string | null | undefined, nextRunAt: string | null | undefined): number {
  const normalizedSchedule = String(schedule ?? '').trim()
  const onceTime = extractTimeOfDay(formatDateTimeOnce(normalizedSchedule))
  if (onceTime !== null) return onceTime

  const parts = parseCronParts(normalizedSchedule)
  if (parts) {
    const minutes = parseFieldValues(parts.minute, 0, 59)
    const hours = parseFieldValues(parts.hour, 0, 23)
    if (minutes.length > 0 && hours.length > 0) return hours[0] * 60 + minutes[0]
  }

  return extractTimeOfDay(nextRunAt) ?? Number.MAX_SAFE_INTEGER
}

function oneTimeSortKey(schedule: string | null | undefined, nextRunAt: string | null | undefined): number {
  const normalizedSchedule = String(schedule ?? '').trim()
  const match = normalizedSchedule.match(/^once at\s+(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})$/i)
  if (match) {
    const timestamp = Date.parse(`${match[1]}T${match[2]}:00+09:00`)
    if (!Number.isNaN(timestamp)) return timestamp
  }

  const nextTimestamp = nextRunAt ? Date.parse(nextRunAt) : Number.NaN
  return Number.isNaN(nextTimestamp) ? Number.MAX_SAFE_INTEGER : nextTimestamp
}

export function sortCronJobs(jobs: CronJob[]): CronJob[] {
  return [...jobs].sort((left, right) => {
    const leftIsOneTime = isOneTimeSchedule(left.schedule)
    const rightIsOneTime = isOneTimeSchedule(right.schedule)
    if (leftIsOneTime !== rightIsOneTime) return leftIsOneTime ? -1 : 1

    const leftSortKey = leftIsOneTime
      ? oneTimeSortKey(left.schedule, left.nextRunAt)
      : cronTimeSortKey(left.schedule, left.nextRunAt)
    const rightSortKey = rightIsOneTime
      ? oneTimeSortKey(right.schedule, right.nextRunAt)
      : cronTimeSortKey(right.schedule, right.nextRunAt)
    const timeDifference = leftSortKey - rightSortKey
    if (timeDifference !== 0) return timeDifference

    const enabledDifference = Number(right.enabled) - Number(left.enabled)
    if (enabledDifference !== 0) return enabledDifference

    return (left.name || left.id).localeCompare(right.name || right.id, 'ko')
  })
}