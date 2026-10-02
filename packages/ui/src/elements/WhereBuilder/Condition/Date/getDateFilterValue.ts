import type { Operator } from 'payload'

import { getDateOnlyBounds } from 'payload/shared'

const dateFilterDayOffset: Partial<Record<Operator, 0 | 1>> = {
  greater_than: 1,
  greater_than_equal: 0,
  less_than: 0,
  less_than_equal: 1,
}

export const getDateFilterValue = ({
  date,
  operator,
  timezone,
}: {
  date: Date
  operator: Operator
  timezone: string
}): Date => {
  const dayOffset = dateFilterDayOffset[operator]

  if (dayOffset === undefined) {
    return date
  }

  const { startOfDay, startOfNextDay } = getDateOnlyBounds({ date, timezone })

  return dayOffset ? new Date(startOfNextDay.getTime() - 1) : startOfDay
}
