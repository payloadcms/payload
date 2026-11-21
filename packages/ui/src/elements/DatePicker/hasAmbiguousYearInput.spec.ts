import { describe, expect, it } from 'vitest'

import { hasAmbiguousYearInput } from './hasAmbiguousYearInput.js'

const createFirstCenturyDate = (year: number, monthIndex: number, day: number): Date => {
  const date = new Date(0)
  date.setFullYear(year, monthIndex, day)
  date.setHours(0, 0, 0, 0)
  return date
}

describe('hasAmbiguousYearInput', () => {
  it('returns false when date is null or a calendar-selected range tuple without typed input', () => {
    expect(
      hasAmbiguousYearInput({
        date: null,
        dateFormat: 'MM/dd/yyyy',
        inputValue: '01/01/25',
      }),
    ).toBe(false)

    expect(
      hasAmbiguousYearInput({
        date: [new Date(2025, 0, 1), null],
        dateFormat: 'MM/dd/yyyy',
        inputValue: undefined,
      }),
    ).toBe(false)
  })

  it('returns true when a two-digit year was parsed into a first-century Date without matching the full format', () => {
    expect(
      hasAmbiguousYearInput({
        date: createFirstCenturyDate(25, 0, 1),
        dateFormat: 'MM/dd/yyyy',
        inputValue: '01/01/25',
      }),
    ).toBe(true)

    expect(
      hasAmbiguousYearInput({
        date: [createFirstCenturyDate(25, 0, 1), null],
        dateFormat: 'MM/dd/yyyy',
        inputValue: '01/01/25',
      }),
    ).toBe(true)
  })

  it('returns false for four-digit years in scalar and range mode', () => {
    expect(
      hasAmbiguousYearInput({
        date: new Date(2025, 0, 1),
        dateFormat: 'MM/dd/yyyy',
        inputValue: '01/01/2025',
      }),
    ).toBe(false)

    expect(
      hasAmbiguousYearInput({
        date: [new Date(2025, 0, 1), new Date(2025, 0, 10)],
        dateFormat: 'MM/dd/yyyy',
        inputValue: '01/01/2025 - 01/10/2025',
      }),
    ).toBe(false)
  })
})
