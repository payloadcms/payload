import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { isHttpURL } from './isHttpURL.js'

describe('isHttpURL', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: { origin: 'https://admin.example.com' },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    ['https://preview.example.com', true],
    ['mailto:editor@example.com', false],
  ] as const)('should validate parsed URL %s without the client environment', (input, expected) => {
    vi.stubGlobal('window', undefined)

    expect(isHttpURL(new URL(input))).toBe(expected)
  })

  it.each([
    'http://preview.example.com',
    'https://preview.example.com',
    '/preview',
    'preview?draft=true',
    '../preview',
    '?draft=true',
    '#preview',
    '//preview.example.com/page',
  ])('should accept HTTP(S) or relative URL %s', (input) => {
    expect(isHttpURL(input)).toBe(true)
  })

  it.each([
    undefined,
    '',
    'mailto:editor@example.com',
    'file:///preview.html',
    'https://[invalid',
    'http://',
  ])('should reject absent, unsupported, or invalid URL %s', (input) => {
    expect(isHttpURL(input)).toBe(false)
  })
})
