import { describe, expect, it } from 'vitest'

import { matchesMimeType } from './matchesMimeType.js'

describe('matchesMimeType', () => {
  it.each([
    ['image/png', 'image/png', true],
    ['image/jpeg', 'image/png', false],
    ['image/png', 'image/*', true],
    ['image/jpeg', 'image/*', true],
    ['video/mp4', 'image/*', false],
    ['video/mp4', '*/*', true],
    ['application/pdf', '*/*', true],
    // Case and surrounding whitespace are normalized before comparing.
    ['IMAGE/PNG', 'image/png', true],
    ['image/png', 'IMAGE/*', true],
    ['  image/png  ', ' image/png ', true],
    // Malformed patterns and MIME types never match.
    ['image/png', 'image', false],
    ['image/png', '*/png', false],
    ['image/png', '', false],
    ['notamimetype', 'image/*', false],
    [undefined, 'image/*', false],
    ['image/png', undefined, false],
  ])('should match %j against the pattern %j as %s', (mimeType, pattern, expected) => {
    expect(matchesMimeType({ mimeType: mimeType as string, pattern: pattern as string })).toBe(
      expected,
    )
  })
})
