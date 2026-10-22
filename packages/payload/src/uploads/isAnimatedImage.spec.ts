import { describe, expect, it } from 'vitest'

import { isAnimatedImage } from './isAnimatedImage.js'

describe('isAnimatedImage', () => {
  it('returns true for the formats sharp documents as supporting its animated option', () => {
    expect(isAnimatedImage('image/gif')).toBe(true)
    expect(isAnimatedImage('image/webp')).toBe(true)
    expect(isAnimatedImage('image/tiff')).toBe(true)
  })

  it('returns false for avif, since sharp does not read or write multi-frame avif sequences', () => {
    expect(isAnimatedImage('image/avif')).toBe(false)
  })

  it('returns false for static-only image formats', () => {
    expect(isAnimatedImage('image/png')).toBe(false)
    expect(isAnimatedImage('image/jpeg')).toBe(false)
    expect(isAnimatedImage('image/svg+xml')).toBe(false)
  })
})
