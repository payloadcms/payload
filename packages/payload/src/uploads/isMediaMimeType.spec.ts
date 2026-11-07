import { describe, expect, it } from 'vitest'

import { getMimeTypeEssence, isMediaMimeType } from './isMediaMimeType.js'

describe('isMediaMimeType', () => {
  it('returns true for image mime types', () => {
    expect(isMediaMimeType('image/jpeg')).toBe(true)
    expect(isMediaMimeType('image/png')).toBe(true)
    expect(isMediaMimeType('image/svg+xml')).toBe(true)
    expect(isMediaMimeType('image/webp')).toBe(true)
  })

  it('returns true for video mime types', () => {
    expect(isMediaMimeType('video/mp4')).toBe(true)
    expect(isMediaMimeType('video/webm')).toBe(true)
    expect(isMediaMimeType('video/quicktime')).toBe(true)
  })

  it('returns true for audio mime types', () => {
    expect(isMediaMimeType('audio/mpeg')).toBe(true)
    expect(isMediaMimeType('audio/wav')).toBe(true)
  })

  it('returns true for PDF mime types', () => {
    expect(isMediaMimeType('application/pdf')).toBe(true)
  })

  it('returns false for non-media mime types', () => {
    expect(isMediaMimeType('application/json')).toBe(false)
    expect(isMediaMimeType('text/html')).toBe(false)
    expect(isMediaMimeType('application/octet-stream')).toBe(false)
  })

  it('returns true for parameterized media mime types', () => {
    expect(isMediaMimeType('audio/webm;codecs=opus')).toBe(true)
  })
})

describe('getMimeTypeEssence', () => {
  it('strips parameters from a mime type', () => {
    expect(getMimeTypeEssence('audio/webm;codecs=opus')).toBe('audio/webm')
    expect(getMimeTypeEssence('text/html; charset=utf-8')).toBe('text/html')
  })

  it('returns the mime type unchanged when it has no parameters', () => {
    expect(getMimeTypeEssence('audio/webm')).toBe('audio/webm')
  })

  it('lowercases the essence so comparisons stay case-insensitive', () => {
    expect(getMimeTypeEssence('Audio/WebM;codecs=opus')).toBe('audio/webm')
    expect(getMimeTypeEssence('  VIDEO/MP4  ')).toBe('video/mp4')
  })

  it('returns an empty string for an empty input', () => {
    expect(getMimeTypeEssence('')).toBe('')
  })
})
