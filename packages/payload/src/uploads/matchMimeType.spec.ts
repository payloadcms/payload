import { describe, expect, it } from 'vitest'

import { matchMimeType } from './matchMimeType.js'

describe('matchMimeType', () => {
  it('should return the exact match when present', () => {
    const map = { 'image/png': 'PngComponent', '*': 'FallbackComponent' }
    expect(matchMimeType(map, 'image/png')).toBe('PngComponent')
  })

  it('should fall back to the category wildcard when no exact match exists', () => {
    const map = { 'image/*': 'ImageComponent', '*': 'FallbackComponent' }
    expect(matchMimeType(map, 'image/png')).toBe('ImageComponent')
  })

  it('should fall back to the universal wildcard when no exact or category match exists', () => {
    const map = { 'video/*': 'VideoComponent', '*': 'FallbackComponent' }
    expect(matchMimeType(map, 'image/png')).toBe('FallbackComponent')
  })

  it('should return undefined when no entry matches', () => {
    const map = { 'video/*': 'VideoComponent' }
    expect(matchMimeType(map, 'image/png')).toBeUndefined()
  })

  it('should honor an explicit `false` exact match and not fall through to the wildcard', () => {
    const map = { 'image/png': false as const, '*': 'FallbackComponent' }
    expect(matchMimeType(map, 'image/png')).toBe(false)
  })

  it('should honor an explicit `false` category wildcard and not fall through to the universal wildcard', () => {
    const map = { 'image/*': false as const, '*': 'FallbackComponent' }
    expect(matchMimeType(map, 'image/png')).toBe(false)
  })

  it('should handle an empty-string mime type by falling back to the universal wildcard', () => {
    const map = { '*': 'FallbackComponent' }
    expect(matchMimeType(map, '')).toBe('FallbackComponent')
  })

  it('should handle a mime type without a slash', () => {
    const map = { 'image/*': 'ImageComponent', '*': 'FallbackComponent' }
    expect(matchMimeType(map, 'notamimetype')).toBe('FallbackComponent')
  })

  it('should match case-sensitively', () => {
    const map = { 'image/png': 'PngComponent' }
    expect(matchMimeType(map, 'IMAGE/PNG')).toBeUndefined()
  })
})
