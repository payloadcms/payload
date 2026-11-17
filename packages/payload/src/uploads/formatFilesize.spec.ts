import { describe, expect, it } from 'vitest'

import { formatFilesize } from './formatFilesize.js'

describe('formatFilesize', () => {
  it('should show one decimal place by default only when needed', () => {
    expect(formatFilesize(1024)).toBe('1KB')
    expect(formatFilesize(1126)).toBe('1.1KB')
    expect(formatFilesize(1536)).toBe('1.5KB')
    expect(formatFilesize(2048)).toBe('2KB')
  })

  it('should allow callers to request whole-number rounding', () => {
    expect(formatFilesize(1536, 0)).toBe('2KB')
  })
})
