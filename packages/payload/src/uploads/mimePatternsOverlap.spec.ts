import { describe, expect, it } from 'vitest'

import { mimePatternsOverlap } from './mimePatternsOverlap.js'

describe('mimePatternsOverlap', () => {
  it.each([
    ['image/*', 'image/jpeg', true],
    ['image/jpeg', 'image/*', true],
    ['*/*', 'video/mp4', true],
    ['image/png', '*/*', true],
    ['image/*', 'image/*', true],
    ['image/png', 'image/png', true],
    ['IMAGE/PNG', 'image/png', true],
    ['image/*', 'video/*', false],
    ['image/png', 'image/jpeg', false],
    ['video/mp4', 'image/*', false],
  ])('should return %s + %s = %s', (a, b, expected) => {
    expect(mimePatternsOverlap({ a, b })).toBe(expected)
  })
})
