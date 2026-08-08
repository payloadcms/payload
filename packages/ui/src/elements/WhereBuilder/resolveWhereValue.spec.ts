import { describe, expect, it } from 'vitest'

import { resolveWhereValue } from './resolveWhereValue.js'

describe('resolveWhereValue', () => {
  it('keeps 0 and false', () => {
    expect(resolveWhereValue(0)).toBe(0)
    expect(resolveWhereValue(false)).toBe(false)
    expect(resolveWhereValue('')).toBe('')
  })

  it('turns null/undefined into undefined', () => {
    expect(resolveWhereValue(null)).toBeUndefined()
    expect(resolveWhereValue(undefined)).toBeUndefined()
  })
})
