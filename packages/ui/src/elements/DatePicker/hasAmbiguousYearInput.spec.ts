import { describe, expect, it } from 'vitest'

import { hasAmbiguousYearInput } from './hasAmbiguousYearInput.js'

describe('hasAmbiguousYearInput', () => {
  it('returns false when date is null or not a Date instance (e.g. range tuple)', () => {
    expect(
      hasAmbiguousYearInput({
        date: null,
        dateFormat: 'MM/dd/yyyy',
        inputValue: '01/01/25',
      }),
    ).toBe(false)

    expect(
      hasAmbiguousYearInput({
        date: [new Date(25, 0, 1), null],
        dateFormat: 'MM/dd/yyyy',
        inputValue: '01/01/25',
      }),
    ).toBe(false)
  })

  it('returns true when a two-digit year was parsed into a first-century Date without matching the full format', () => {
    expect(
      hasAmbiguousYearInput({
        date: new Date(25, 0, 1),
        dateFormat: 'MM/dd/yyyy',
        inputValue: '01/01/25',
      }),
    ).toBe(true)
  })

  it('returns false for four-digit years', () => {
    expect(
      hasAmbiguousYearInput({
        date: new Date(2025, 0, 1),
        dateFormat: 'MM/dd/yyyy',
        inputValue: '01/01/2025',
      }),
    ).toBe(false)
  })
})
