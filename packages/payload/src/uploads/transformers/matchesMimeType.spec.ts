import { describe, expect, it } from 'vitest'

import { matchesMimeType } from './matchesMimeType.js'

describe('matchesMimeType', () => {
  it('should match an exact MIME type', () => {
    expect(matchesMimeType({ mimeType: 'image/png', pattern: 'image/png' })).toBe(true)
  })

  it('should not match a different exact MIME type', () => {
    expect(matchesMimeType({ mimeType: 'image/jpeg', pattern: 'image/png' })).toBe(false)
  })

  it('should match a category wildcard pattern against any subtype of that category', () => {
    expect(matchesMimeType({ mimeType: 'image/png', pattern: 'image/*' })).toBe(true)
    expect(matchesMimeType({ mimeType: 'image/jpeg', pattern: 'image/*' })).toBe(true)
  })

  it('should not match a category wildcard pattern against a different category', () => {
    expect(matchesMimeType({ mimeType: 'video/mp4', pattern: 'image/*' })).toBe(false)
  })

  it('should match the universal wildcard against any well-formed MIME type', () => {
    expect(matchesMimeType({ mimeType: 'video/mp4', pattern: '*/*' })).toBe(true)
    expect(matchesMimeType({ mimeType: 'application/pdf', pattern: '*/*' })).toBe(true)
  })

  it('should normalize case before comparing', () => {
    expect(matchesMimeType({ mimeType: 'IMAGE/PNG', pattern: 'image/png' })).toBe(true)
    expect(matchesMimeType({ mimeType: 'image/png', pattern: 'IMAGE/*' })).toBe(true)
  })

  it('should normalize surrounding whitespace before comparing', () => {
    expect(matchesMimeType({ mimeType: '  image/png  ', pattern: ' image/png ' })).toBe(true)
  })

  it('should return false for a pattern with no slash', () => {
    expect(matchesMimeType({ mimeType: 'image/png', pattern: 'image' })).toBe(false)
  })

  it('should return false for a subtype-only wildcard pattern (wildcard type with a concrete subtype)', () => {
    expect(matchesMimeType({ mimeType: 'image/png', pattern: '*/png' })).toBe(false)
  })

  it('should return false for an empty pattern', () => {
    expect(matchesMimeType({ mimeType: 'image/png', pattern: '' })).toBe(false)
  })

  it('should return false when the MIME type has no slash and the pattern is not the universal wildcard', () => {
    expect(matchesMimeType({ mimeType: 'notamimetype', pattern: 'image/*' })).toBe(false)
  })

  it('should defensively return false rather than throw for non-string input', () => {
    expect(matchesMimeType({ mimeType: undefined as unknown as string, pattern: 'image/*' })).toBe(
      false,
    )
    expect(
      matchesMimeType({ mimeType: 'image/png', pattern: undefined as unknown as string }),
    ).toBe(false)
  })
})
