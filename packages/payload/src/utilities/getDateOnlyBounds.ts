import { TZDateMini as TZDate } from '@date-fns/tz/date/mini'

const isoDatePattern = /^\d{4}-\d{2}-\d{2}/

export const getDateOnlyBounds = ({
  date,
  timezone,
}: {
  date: Date | string
  timezone: string
}): { startOfDay: Date; startOfNextDay: Date } => {
  const calendarDate =
    typeof date === 'string'
      ? isoDatePattern.test(date)
        ? date
        : new Date(date).toISOString()
      : date.toISOString()
  const year = Number(calendarDate.slice(0, 4))
  const month = Number(calendarDate.slice(5, 7)) - 1
  const day = Number(calendarDate.slice(8, 10))
  const getBoundary = (dayOffset: number) =>
    new Date(TZDate.tz(timezone, year, month, day + dayOffset).getTime())

  return {
    startOfDay: getBoundary(0),
    startOfNextDay: getBoundary(1),
  }
}
