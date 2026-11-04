import type { Operator } from '../types/index.js'

import { APIError } from '../errors/APIError.js'

export type DateOnlyValue = {
  day: number
  month: number
  year: number
}

export type DateFilterInput =
  | { kind: 'calendarDay'; serialized: string; value: DateOnlyValue }
  | { kind: 'instant'; value: Date | string }
  | { kind: 'unsupported' }

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/
const dateTimePattern = /^(\d{4}-\d{2}-\d{2})T/
const dateOnlyOperators = new Set<string>([
  'equals',
  'greater_than',
  'greater_than_equal',
  'less_than',
  'less_than_equal',
  'not_equals',
] satisfies Operator[])

export const classifyDateFilterInput = ({
  operator,
  value,
}: {
  operator: string
  value: unknown
}): DateFilterInput => {
  if (!dateOnlyOperators.has(operator)) {
    return { kind: 'unsupported' }
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? { kind: 'unsupported' } : { kind: 'instant', value }
  }

  if (typeof value !== 'string') {
    return { kind: 'unsupported' }
  }

  const dateOnlyValue = getDateOnlyValue({ value })

  if (dateOnlyValue) {
    if (!isValidDateOnlyValue({ value: dateOnlyValue })) {
      throw new APIError(`Invalid calendar date "${value}".`, 400)
    }

    return { kind: 'calendarDay', serialized: value, value: dateOnlyValue }
  }

  return Number.isNaN(Date.parse(value)) ? { kind: 'unsupported' } : { kind: 'instant', value }
}

export const getDateOnlyValue = ({ value }: { value: unknown }): DateOnlyValue | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  const match = value.match(dateOnlyPattern)

  if (!match) {
    return undefined
  }

  return {
    day: Number(match[3]),
    month: Number(match[2]),
    year: Number(match[1]),
  }
}

export const isDateOnlyFilter = ({
  operator,
  pickerAppearance = 'default',
}: {
  operator: string
  pickerAppearance?: string
}): boolean => isDateOnlyPickerAppearance({ pickerAppearance }) && dateOnlyOperators.has(operator)

export const isDateOnlyPickerAppearance = ({
  pickerAppearance = 'default',
}: {
  pickerAppearance?: string
}): boolean => pickerAppearance === 'dayOnly' || pickerAppearance === 'default'

export const isValidDateFilterValue = ({ value }: { value: unknown }): boolean => {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime())
  }

  if (typeof value !== 'string') {
    return false
  }

  const dateOnlyValue = getDateOnlyValue({ value })

  if (!dateOnlyValue) {
    const dateTimeMatch = value.match(dateTimePattern)
    const dateTimeValue = dateTimeMatch ? getDateOnlyValue({ value: dateTimeMatch[1] }) : undefined

    return Boolean(
      dateTimeValue &&
        isValidDateOnlyValue({ value: dateTimeValue }) &&
        !Number.isNaN(Date.parse(value)),
    )
  }

  return isValidDateOnlyValue({ value: dateOnlyValue })
}

const isValidDateOnlyValue = ({ value }: { value: DateOnlyValue }): boolean => {
  const { day, month, year } = value

  const date = new Date(0)

  date.setUTCHours(0, 0, 0, 0)
  date.setUTCFullYear(year, month - 1, day)

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  )
}
