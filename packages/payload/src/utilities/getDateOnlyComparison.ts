import type { SanitizedConfig } from '../config/types.js'
import type { DateFieldClient, FlattenedField } from '../fields/config/types.js'
import type { Operator } from '../types/constants.js'

export type DateOnlyConstraint = {
  operator: 'greater_than_equal' | 'less_than'
  value: Date
}

export type DateOnlyComparison = {
  constraints: DateOnlyConstraint[]
}

const calendarDayPattern = /^(\d{4})-(\d{2})-(\d{2})$/
const fixedOffsetPattern = /^([+-])(\d{2}):(\d{2})$/
const supportedOperators = new Set<Operator>([
  'equals',
  'greater_than',
  'greater_than_equal',
  'less_than',
  'less_than_equal',
])

export const isDateOnlyFilter = ({
  field,
  operator,
}: {
  field: DateFieldClient | FlattenedField
  operator: Operator
}): boolean => {
  if (field.type !== 'date') {
    return false
  }

  const pickerAppearance = (field.admin?.date as { pickerAppearance?: string } | undefined)
    ?.pickerAppearance

  return (
    supportedOperators.has(operator) &&
    ['dayOnly', 'default'].includes(pickerAppearance ?? 'default')
  )
}

/**
 * Converts a date-only filter value into timestamp constraints in the field's configured timezone.
 * Timestamp values and unsupported operators retain their existing comparison behavior.
 */
export const getDateOnlyComparison = ({
  config,
  field,
  operator,
  value,
}: {
  config: SanitizedConfig
  field: FlattenedField
  operator: Operator
  value: unknown
}): DateOnlyComparison | undefined => {
  if (
    field.type !== 'date' ||
    typeof value !== 'string' ||
    !isDateOnlyFilter({ field, operator })
  ) {
    return undefined
  }

  const match = calendarDayPattern.exec(value)

  if (!match) {
    return undefined
  }

  const date = {
    day: Number(match[3]),
    month: Number(match[2]),
    year: Number(match[1]),
  }

  if (!isValidCalendarDay(date)) {
    return undefined
  }

  const timezone =
    (typeof field.timezone === 'object'
      ? field.timezone.defaultTimezone
      : field.timezone
        ? config.admin.timezones.defaultTimezone
        : undefined) ?? 'UTC'
  const nextDate = addCalendarDay(date)
  const start = getCalendarDayStart({ date, timezone })
  const next = getCalendarDayStart({ date: nextDate, timezone })

  if (operator === 'equals') {
    return {
      constraints: [
        { operator: 'greater_than_equal', value: start },
        { operator: 'less_than', value: next },
      ],
    }
  }

  if (operator === 'greater_than' || operator === 'greater_than_equal') {
    return {
      constraints: [
        {
          operator: 'greater_than_equal',
          value: operator === 'greater_than' ? next : start,
        },
      ],
    }
  }

  return {
    constraints: [
      {
        operator: 'less_than',
        value: operator === 'less_than' ? start : next,
      },
    ],
  }
}

type CalendarDay = {
  day: number
  month: number
  year: number
}

const addCalendarDay = ({ day, month, year }: CalendarDay): CalendarDay => {
  const next = new Date(Date.UTC(year, month - 1, day + 1))

  return {
    day: next.getUTCDate(),
    month: next.getUTCMonth() + 1,
    year: next.getUTCFullYear(),
  }
}

const getCalendarDayStart = ({ date, timezone }: { date: CalendarDay; timezone: string }): Date => {
  const utcMidnight = Date.UTC(date.year, date.month - 1, date.day)
  const fixedOffset = fixedOffsetPattern.exec(timezone)

  if (fixedOffset) {
    const direction = fixedOffset[1] === '+' ? 1 : -1
    const offsetMinutes = direction * (Number(fixedOffset[2]) * 60 + Number(fixedOffset[3]))

    return new Date(utcMidnight - offsetMinutes * 60_000)
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    timeZone: timezone,
    year: 'numeric',
  })
  const target = toCalendarDayNumber(date)
  let low = utcMidnight - 48 * 60 * 60 * 1000
  let high = utcMidnight + 48 * 60 * 60 * 1000

  while (low < high) {
    const midpoint = Math.floor((low + high) / 2)

    if (getFormattedCalendarDayNumber({ formatter, timestamp: midpoint }) < target) {
      low = midpoint + 1
    } else {
      high = midpoint
    }
  }

  return new Date(low)
}

const getFormattedCalendarDayNumber = ({
  formatter,
  timestamp,
}: {
  formatter: Intl.DateTimeFormat
  timestamp: number
}): number => {
  const parts = formatter.formatToParts(timestamp)

  return toCalendarDayNumber({
    day: Number(parts.find(({ type }) => type === 'day')?.value),
    month: Number(parts.find(({ type }) => type === 'month')?.value),
    year: Number(parts.find(({ type }) => type === 'year')?.value),
  })
}

const isValidCalendarDay = ({ day, month, year }: CalendarDay): boolean => {
  const parsed = new Date(Date.UTC(year, month - 1, day))

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}

const toCalendarDayNumber = ({ day, month, year }: CalendarDay): number =>
  year * 10_000 + month * 100 + day
