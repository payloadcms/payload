import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { formatAbsoluteURL } from './formatAbsoluteURL.js'

describe('formatAbsoluteURL', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: { origin: 'https://admin.example.com' },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    ['/preview', 'https://admin.example.com/preview'],
    ['preview?draft=true', 'https://admin.example.com/preview?draft=true'],
    ['../preview', 'https://admin.example.com/preview'],
    ['?draft=true', 'https://admin.example.com/?draft=true'],
    ['#preview', 'https://admin.example.com/#preview'],
    ['//preview.example.com/page', 'https://preview.example.com/page'],
    ['', 'https://admin.example.com/'],
  ])('should resolve relative URL %s against the admin origin', (input, expected) => {
    expect(formatAbsoluteURL(input)).toBe(expected)
  })

  it.each([
    'http://preview.example.com',
    'https://preview.example.com',
    'https://preview.example.com:443/one/../two?draft=true#preview',
  ])('should preserve absolute HTTP(S) URL %s', (input) => {
    expect(formatAbsoluteURL(input)).toBe(input)
  })

  it.each(['mailto:editor@example.com', 'file:///preview.html'])(
    'should return undefined for unsupported URL %s',
    (input) => {
      expect(formatAbsoluteURL(input)).toBeUndefined()
    },
  )

  it.each(['http://', 'https://', 'https://[invalid'])(
    'should return undefined for invalid URL %s',
    (input) => {
      expect(formatAbsoluteURL(input)).toBeUndefined()
    },
  )
})
