import { describe, expect, it } from 'vitest'

import { isSelectFilterOptions } from './isSelectFilterOptions.js'

describe('isSelectFilterOptions', () => {
  it('returns true for an Option array resolved from a select field', () => {
    expect(isSelectFilterOptions([{ label: 'One', value: 'one' }])).toBe(true)
    expect(isSelectFilterOptions([])).toBe(true)
  })

  it('returns false for a Where query resolved from a relationship/upload field', () => {
    expect(isSelectFilterOptions({ posts: { status: { equals: 'published' } } })).toBe(false)
  })

  it('returns false when no filterOptions were resolved', () => {
    expect(isSelectFilterOptions(undefined)).toBe(false)
  })
})
