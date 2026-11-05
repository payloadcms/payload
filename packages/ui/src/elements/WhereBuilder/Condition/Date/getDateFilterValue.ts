import type { DateFieldClient, Operator } from 'payload'

import { isDateOnlyFilter } from 'payload/shared'

const calendarDayPattern = /^(\d{4})-(\d{2})-(\d{2})$/

export const getDateFilterValue = ({
  date,
  field,
  operator,
}: {
  date: Date
  field: DateFieldClient
  operator: Operator
}): Date | string => {
  if (!isDateOnlyFilter({ field, operator })) {
    return date
  }

  return date.toISOString().slice(0, 10)
}

export const getDateFilterPickerValue = ({
  field,
  operator,
  value,
}: {
  field: DateFieldClient
  operator: Operator
  value: Date | string
}): Date | string => {
  if (typeof value !== 'string' || !isDateOnlyFilter({ field, operator })) {
    return value
  }

  const match = calendarDayPattern.exec(value)

  if (!match) {
    return value
  }

  const date = new Date(0)

  date.setFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  date.setHours(0, 0, 0, 0)

  return date
}
