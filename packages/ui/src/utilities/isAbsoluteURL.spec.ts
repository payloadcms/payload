import { describe, expect, it } from 'vitest'

import { isAbsoluteURL } from './isAbsoluteURL.js'

describe('isAbsoluteURL', () => {
  it.each([
    'http://example.com',
    'https://example.com/preview',
    'mailto:editor@example.com',
    'file:///preview.html',
    new URL('https://example.com/preview'),
  ])('should accept absolute URL %s', (input) => {
    expect(isAbsoluteURL(input)).toBe(true)
  })

  it.each([
    undefined,
    '',
    '/preview',
    '../preview',
    'preview?draft=true',
    '?draft=true',
    '#preview',
    '//example.com/preview',
    'https://',
    'https://[invalid',
  ])('should reject relative, absent, or invalid URL %s', (input) => {
    expect(isAbsoluteURL(input)).toBe(false)
  })
})
