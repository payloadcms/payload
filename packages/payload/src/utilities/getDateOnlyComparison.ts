import type { Operator } from '../types/index.js'
import type { DateOnlyValue } from './dateOnlyFilter.js'

import { getDateOnlyValue, isDateOnlyFilter, isValidDateFilterValue } from './dateOnlyFilter.js'

export type DateOnlyConstraint = {
  operator: 'greater_than_equal' | 'less_than'
  value: Date
}

type DateOnlyConstraintGroup = {
  combination: 'and' | 'or'
  constraints: DateOnlyConstraint[]
}

export type DateOnlyComparison = {
  includesNull?: true
  repeated: { quantifier: 'none' | 'some' } & DateOnlyConstraintGroup
  targetCombination: 'and' | 'or'
} & DateOnlyConstraintGroup

const fixedOffsetPattern = /^([+-])(\d{2}):(\d{2})$/

/**
 * Converts a calendar-day filter into timezone-aware, half-open instant constraints.
 * Directional operators use the start of the selected day or the start of the next day.
 */
export const getDateOnlyComparison = ({
  date,
  operator,
  timezone,
}: {
  date: unknown
  operator: Operator
  timezone: string
}): DateOnlyComparison | undefined => {
  if (typeof date !== 'string') {
    return undefined
  }

  const dateOnlyValue = getDateOnlyValue({ value: date })

  if (
    !dateOnlyValue ||
    !isDateOnlyFilter({ operator }) ||
    !isValidDateFilterValue({ value: date })
  ) {
    return undefined
  }

  const { day, month, year } = dateOnlyValue
  const calendarDate = getUTCCalendarDate({ day, month, year })

  const startOfDay = getZonedMidnight({ day, month, timezone, year })
  calendarDate.setUTCDate(calendarDate.getUTCDate() + 1)
  const startOfNextDay = getZonedMidnight({
    day: calendarDate.getUTCDate(),
    month: calendarDate.getUTCMonth() + 1,
    timezone,
    year: calendarDate.getUTCFullYear(),
  })
  const atOrAfterStart = { operator: 'greater_than_equal', value: startOfDay } as const
  const atOrAfterNextDay = { operator: 'greater_than_equal', value: startOfNextDay } as const
  const beforeStart = { operator: 'less_than', value: startOfDay } as const
  const beforeNextDay = { operator: 'less_than', value: startOfNextDay } as const
  const dayRange: DateOnlyConstraintGroup = {
    combination: 'and',
    constraints: [atOrAfterStart, beforeNextDay],
  }
  const withLogicalSemantics = (
    comparison: { includesNull?: true } & DateOnlyConstraintGroup,
  ): DateOnlyComparison => ({
    ...comparison,
    repeated:
      operator === 'not_equals'
        ? { ...dayRange, quantifier: 'none' }
        : { ...comparison, quantifier: 'some' },
    targetCombination: operator === 'not_equals' ? 'and' : 'or',
  })

  switch (operator) {
    case 'equals':
      return withLogicalSemantics(dayRange)
    case 'greater_than':
      return withLogicalSemantics({ combination: 'and', constraints: [atOrAfterNextDay] })
    case 'greater_than_equal':
      return withLogicalSemantics({ combination: 'and', constraints: [atOrAfterStart] })
    case 'less_than':
      return withLogicalSemantics({ combination: 'and', constraints: [beforeStart] })
    case 'less_than_equal':
      return withLogicalSemantics({ combination: 'and', constraints: [beforeNextDay] })
    case 'not_equals':
      return withLogicalSemantics({
        combination: 'or',
        constraints: [beforeStart, atOrAfterNextDay],
        includesNull: true,
      })
  }
}

const getUTCCalendarDate = ({
  day,
  month,
  year,
}: {
  day: number
  month: number
  year: number
}): Date => {
  const date = new Date(0)

  date.setUTCHours(0, 0, 0, 0)
  date.setUTCFullYear(year, month - 1, day)

  return date
}

const getZonedMidnight = ({
  day,
  month,
  timezone,
  year,
}: {
  day: number
  month: number
  timezone: string
  year: number
}): Date => {
  const utcMidnight = getUTCCalendarDate({ day, month, year }).getTime()
  const fixedOffset = timezone.match(fixedOffsetPattern)

  if (fixedOffset) {
    const direction = fixedOffset[1] === '+' ? 1 : -1
    const offsetMinutes = direction * (Number(fixedOffset[2]) * 60 + Number(fixedOffset[3]))

    return new Date(utcMidnight - offsetMinutes * 60_000)
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    era: 'short',
    month: '2-digit',
    timeZone: timezone,
    year: 'numeric',
  })
  const target = { day, month, year }
  let instantBeforeDate = utcMidnight - 72 * 60 * 60 * 1000
  let firstInstantInDate = utcMidnight + 72 * 60 * 60 * 1000

  if (
    compareCalendarDateAtInstant({ formatter, instant: instantBeforeDate, target }) >= 0 ||
    compareCalendarDateAtInstant({ formatter, instant: firstInstantInDate, target }) < 0
  ) {
    throw new Error(
      `Could not resolve the first instant of ${year}-${month}-${day} in ${timezone}.`,
    )
  }

  while (firstInstantInDate - instantBeforeDate > 1) {
    const midpoint = Math.floor((instantBeforeDate + firstInstantInDate) / 2)

    if (compareCalendarDateAtInstant({ formatter, instant: midpoint, target }) >= 0) {
      firstInstantInDate = midpoint
    } else {
      instantBeforeDate = midpoint
    }
  }

  return new Date(firstInstantInDate)
}

const compareCalendarDateAtInstant = ({
  formatter,
  instant,
  target,
}: {
  formatter: Intl.DateTimeFormat
  instant: number
  target: DateOnlyValue
}): number => {
  const parts = Object.fromEntries(
    formatter
      .formatToParts(instant)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value]),
  ) as Record<'day' | 'era' | 'month' | 'year', string>
  const yearOfEra = Number(parts.year)
  const dateAtInstant = {
    day: Number(parts.day),
    month: Number(parts.month),
    year: parts.era === 'BC' ? 1 - yearOfEra : yearOfEra,
  }

  return (
    dateAtInstant.year - target.year ||
    dateAtInstant.month - target.month ||
    dateAtInstant.day - target.day
  )
}
