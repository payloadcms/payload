import { describe, expect, it } from 'vitest'

import { parseDynamicTransform } from './parseDynamicTransform.js'

const limits = { maxHeight: 4096, maxPixels: 16_777_216, maxWidth: 4096 }

const parse = (query: string) =>
  parseDynamicTransform({ limits, searchParams: new URLSearchParams(query) })

describe('parseDynamicTransform', () => {
  it('should not route an ordinary read', () => {
    expect(parse('depth=1&draft=true&prefix=media')).toStrictEqual({ isRouted: false })
  })

  it('should parse width and height', () => {
    expect(parse('width=400&height=300')).toStrictEqual({
      height: 300,
      isRouted: true,
      valid: true,
      width: 400,
      withoutEnlargement: undefined,
    })
  })

  it('should parse withoutEnlargement', () => {
    expect(parse('width=400&withoutEnlargement=true')).toMatchObject({
      valid: true,
      withoutEnlargement: true,
    })
  })

  it.each([
    ['width=abc', '`width` must be a positive integer.'],
    ['width=0', '`width` must be a positive integer.'],
    ['height=-1', '`height` must be a positive integer.'],
    ['width=400&width=500', '`width` may only be specified once.'],
    ['height=1&height=2', '`height` may only be specified once.'],
    [
      'withoutEnlargement=true&withoutEnlargement=false',
      '`withoutEnlargement` may only be specified once.',
    ],
    ['withoutEnlargement=true', 'At least one of `width` or `height` is required to resize.'],
    ['width=400&withoutEnlargement=yes', '`withoutEnlargement` must be "true" or "false".'],
    ['width=9999', '`width` exceeds the configured maximum of 4096.'],
    ['height=9999', '`height` exceeds the configured maximum of 4096.'],
  ])('should reject %s', (query, error) => {
    expect(parse(query)).toStrictEqual({ error, isRouted: true, valid: false })
  })

  it('should reject dimensions over the pixel budget', () => {
    expect(
      parseDynamicTransform({
        limits: { maxHeight: 4096, maxPixels: 1000, maxWidth: 4096 },
        searchParams: new URLSearchParams('width=100&height=100'),
      }),
    ).toStrictEqual({
      error: 'Requested dimensions exceed the configured maximum of 1000 pixels.',
      isRouted: true,
      valid: false,
    })
  })
})
