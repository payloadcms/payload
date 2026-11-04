import { getDateOnlyComparison } from './getDateOnlyComparison.js'

const isoDatePattern = /^\d{4}-\d{2}-\d{2}/

export const getDateOnlyBounds = ({
  date,
  timezone,
}: {
  date: Date | string
  timezone: string
}): { startOfDay: Date; startOfNextDay: Date } => {
  const calendarDate =
    typeof date === 'string' && isoDatePattern.test(date)
      ? date.slice(0, 10)
      : new Date(date).toISOString().slice(0, 10)
  const comparison = getDateOnlyComparison({
    date: calendarDate,
    operator: 'equals',
    timezone,
  })

  if (!comparison) {
    throw new Error(`Could not resolve date-only bounds for ${calendarDate}.`)
  }

  return {
    startOfDay: comparison.constraints[0]!.value,
    startOfNextDay: comparison.constraints[1]!.value,
  }
}
