import { describe, expect, it } from 'vitest'

import { parseDynamicResize } from './parseDynamicResize.js'

const DEFAULT_LIMITS = { maxHeight: 4096, maxPixels: 16_777_216, maxWidth: 4096 }

const parse = (query: string) =>
  parseDynamicResize({ limits: DEFAULT_LIMITS, searchParams: new URLSearchParams(query) })

describe('parseDynamicResize', () => {
  it('should treat a request with no recognized parameters as an ordinary read', () => {
    expect(parse('')).toEqual({ isRouted: false })
  })

  it('should ignore unrelated Payload query keys and treat the request as an ordinary read', () => {
    expect(parse('draft=true&depth=1&where[foo][equals]=bar&prefix=tenants/acme')).toEqual({
      isRouted: false,
    })
  })

  it('should route and validate a request with width alone, preserving aspect ratio', () => {
    expect(parse('width=500')).toEqual({
      height: undefined,
      isRouted: true,
      valid: true,
      width: 500,
      withoutEnlargement: undefined,
    })
  })

  it('should route and validate a request with height alone', () => {
    expect(parse('height=300')).toEqual({
      height: 300,
      isRouted: true,
      valid: true,
      width: undefined,
      withoutEnlargement: undefined,
    })
  })

  it('should route and validate a request with both width and height', () => {
    expect(parse('width=500&height=300')).toEqual({
      height: 300,
      isRouted: true,
      valid: true,
      width: 500,
      withoutEnlargement: undefined,
    })
  })

  it('should route a request containing only withoutEnlargement, but reject it as invalid', () => {
    const result = parse('withoutEnlargement=true')
    expect(result.isRouted).toBe(true)
    expect(result).toMatchObject({ valid: false })
  })

  it('should parse a valid withoutEnlargement=true alongside width', () => {
    expect(parse('width=500&withoutEnlargement=true')).toEqual({
      height: undefined,
      isRouted: true,
      valid: true,
      width: 500,
      withoutEnlargement: true,
    })
  })

  it('should parse a valid withoutEnlargement=false alongside width', () => {
    expect(parse('width=500&withoutEnlargement=false')).toEqual({
      height: undefined,
      isRouted: true,
      valid: true,
      width: 500,
      withoutEnlargement: false,
    })
  })

  it('should reject an invalid withoutEnlargement value', () => {
    const result = parse('width=500&withoutEnlargement=yes')
    expect(result).toMatchObject({ isRouted: true, valid: false })
  })

  it('should reject a repeated width parameter', () => {
    const result = parse('width=500&width=600')
    expect(result).toMatchObject({ isRouted: true, valid: false })
  })

  it('should reject a repeated height parameter', () => {
    const result = parse('height=500&height=600')
    expect(result).toMatchObject({ isRouted: true, valid: false })
  })

  it('should reject a repeated withoutEnlargement parameter', () => {
    const result = parse('width=500&withoutEnlargement=true&withoutEnlargement=false')
    expect(result).toMatchObject({ isRouted: true, valid: false })
  })

  it.each(['abc', '12.5', '-5', '0', '', '5px', ' 5'])(
    'should reject a non-positive-integer width: %s',
    (value) => {
      const result = parse(`width=${encodeURIComponent(value)}`)
      expect(result).toMatchObject({ isRouted: true, valid: false })
    },
  )

  it('should reject an unsafe-integer width without throwing', () => {
    const result = parse('width=99999999999999999999999999999999')
    expect(result).toMatchObject({ isRouted: true, valid: false })
  })

  it('should reject a width exceeding the configured maxWidth', () => {
    const result = parse('width=5000')
    expect(result).toMatchObject({ isRouted: true, valid: false })
  })

  it('should reject a height exceeding the configured maxHeight', () => {
    const result = parse('height=5000')
    expect(result).toMatchObject({ isRouted: true, valid: false })
  })

  it('should accept a width exactly at the configured maxWidth', () => {
    expect(parse('width=4096')).toMatchObject({ isRouted: true, valid: true })
  })

  it('should reject a width/height combination whose product exceeds maxPixels even when each dimension is individually within its own limit', () => {
    const result = parseDynamicResize({
      limits: { maxHeight: 4096, maxPixels: 1000, maxWidth: 4096 },
      searchParams: new URLSearchParams('width=100&height=100'),
    })
    expect(result).toMatchObject({ isRouted: true, valid: false })
  })

  it('should accept a width/height combination within the configured maxPixels', () => {
    const result = parseDynamicResize({
      limits: { maxHeight: 4096, maxPixels: 1000, maxWidth: 4096 },
      searchParams: new URLSearchParams('width=10&height=10'),
    })
    expect(result).toMatchObject({ height: 10, isRouted: true, valid: true, width: 10 })
  })
})
