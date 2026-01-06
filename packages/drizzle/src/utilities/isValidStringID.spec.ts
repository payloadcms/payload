import { describe, it, expect } from 'vitest'
import { isValidStringID } from './isValidStringID.js'

describe('isValidStringID', () => {
  it('should pass', () => {
    expect(isValidStringID('1')).toBe(true)
    expect(isValidStringID('a_b_c')).toBe(true)
    expect(isValidStringID('8cc2df6d-6e07-4da4-be48-5fa747c3b92b')).toBe(true)
  })

  it('should not pass', () => {
    expect(isValidStringID('1 2 3')).toBe(false)
    expect(isValidStringID('1@')).toBe(false)
  })
})
