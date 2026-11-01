/** A calendar day, without a time zone */
export type Day = { day: number; month: number; year: number }

/** The day's midnight in UTC, as milliseconds */
export function dayNumber({ day, month, year }: Day) {
  return Date.UTC(year, month - 1, day)
}

/** Midnight of `date` in `timeZone`, as a UTC ISO string */
export function zonedMidnight(date: Day, timeZone: string) {
  const guess = dayNumber(date)
  const first = guess - offsetAt(guess, timeZone)
  // Correct once in case the offset differs at midnight local time (daylight saving)
  return new Date(guess - offsetAt(first, timeZone)).toISOString()
}

/** How far `timeZone` is ahead of UTC at `time`, in milliseconds */
export function offsetAt(time: number, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      hour: 'numeric',
      hourCycle: 'h23',
      minute: 'numeric',
      month: 'numeric',
      second: 'numeric',
      timeZone,
      year: 'numeric',
    })
      .formatToParts(time)
      .map(({ type, value }) => [type, Number(value)]),
  )
  const local = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )
  return local - Math.floor(time / 1000) * 1000
}

/** The day `time` falls on in `timeZone`, written YYYY-MM-DD */
export function localDay(time: Date | number | string, timeZone: string) {
  // Canada writes dates as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  }).format(new Date(time))
}

/** Whether Intl knows `value` as a time zone, e.g. "Asia/Hong_Kong" */
export function isTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return true
  } catch {
    return false
  }
}
