import { describe, expect, it } from 'vitest'

import { defaultTimezones } from './defaultTimezones.js'

const LABELLED_OFFSET = /^\(UTC([+-]\d{2}:\d{2})\)/

/**
 * The offset the zone is actually on at an instant, as ±HH:mm.
 */
const offsetAt = (timeZone: string, instant: Date): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
  }).formatToParts(instant)
  const name = parts.find((part) => part.type === 'timeZoneName')!.value
  const offset = name.replace('GMT', '')

  return offset === '' ? '+00:00' : offset
}

describe('defaultTimezones', () => {
  it.each(defaultTimezones)('$value is a zone the Intl API knows', ({ value }) => {
    expect(() => new Intl.DateTimeFormat('en-US', { timeZone: value })).not.toThrow()
  })

  // validateTimezones skips anything already in this list, so a wrong entry here
  // is never caught at runtime.
  it.each(defaultTimezones)('$label agrees with an offset $value observes', ({ label, value }) => {
    const labelled = label.match(LABELLED_OFFSET)?.[1]
    expect(labelled, `${label} should start with a (UTC±HH:mm) prefix`).toBeDefined()

    // Sampling both solstices covers the standard and daylight offsets.
    const observed = [
      offsetAt(value, new Date('2026-01-15T12:00:00Z')),
      offsetAt(value, new Date('2026-07-15T12:00:00Z')),
    ]

    expect(observed).toContain(labelled)
  })
})
