const relativeTimeDivisions: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'seconds' },
  { amount: 60, unit: 'minutes' },
  { amount: 24, unit: 'hours' },
  { amount: 7, unit: 'days' },
  { amount: 4.34524, unit: 'weeks' },
  { amount: 12, unit: 'months' },
  { amount: Number.POSITIVE_INFINITY, unit: 'years' },
]

/**
 * Returns an `Intl.RelativeTimeFormat` for the given language, falling back to English on
 * unsupported locales. Create it once and reuse it across rows. Shared by dashboard widgets so
 * their relative timestamps render identically.
 */
export function getRelativeTimeFormat(language: string): Intl.RelativeTimeFormat {
  try {
    return new Intl.RelativeTimeFormat(language, { numeric: 'auto', style: 'narrow' })
  } catch {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'narrow' })
  }
}

/**
 * Formats an ISO date string as a locale-aware relative time (e.g. "5m ago", "in 2d"). Returns the
 * original value unchanged when it is not a parseable date.
 */
export function formatRelativeDate({
  relativeTimeFormat,
  value,
}: {
  relativeTimeFormat: Intl.RelativeTimeFormat
  value: string
}): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  let duration = (date.getTime() - Date.now()) / 1000

  for (const division of relativeTimeDivisions) {
    if (Math.abs(duration) < division.amount) {
      return relativeTimeFormat.format(Math.round(duration), division.unit)
    }

    duration /= division.amount
  }

  return relativeTimeFormat.format(Math.round(duration), 'years')
}
