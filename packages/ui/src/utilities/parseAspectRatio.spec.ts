import { describe, expect, it } from 'vitest'

import { parseAspectRatio } from './parseAspectRatio.js'

describe('parseAspectRatio', () => {
  it('should parse a whole-number ratio', () => {
    expect(parseAspectRatio({ value: '16:9' })).toBe(16 / 9)
  })

  it('should parse a square ratio', () => {
    expect(parseAspectRatio({ value: '1:1' })).toBe(1)
  })

  it('should parse a portrait ratio', () => {
    expect(parseAspectRatio({ value: '3:4' })).toBe(0.75)
  })

  it('should parse decimal values', () => {
    expect(parseAspectRatio({ value: '1.91:1' })).toBe(1.91)
  })

  it('should parse decimal values without a leading zero', () => {
    expect(parseAspectRatio({ value: '.5:1' })).toBe(0.5)
  })

  it('should ignore surrounding and inner whitespace', () => {
    expect(parseAspectRatio({ value: '  4 : 3  ' })).toBe(4 / 3)
  })

  it('should return undefined for an empty string', () => {
    expect(parseAspectRatio({ value: '' })).toBeUndefined()
  })

  it('should return undefined when the colon is missing', () => {
    expect(parseAspectRatio({ value: '169' })).toBeUndefined()
  })

  it('should return undefined when a side is missing', () => {
    expect(parseAspectRatio({ value: '16:' })).toBeUndefined()
    expect(parseAspectRatio({ value: ':9' })).toBeUndefined()
  })

  it('should return undefined when either side is zero', () => {
    expect(parseAspectRatio({ value: '0:9' })).toBeUndefined()
    expect(parseAspectRatio({ value: '16:0' })).toBeUndefined()
  })

  it('should return undefined for negative values', () => {
    expect(parseAspectRatio({ value: '-16:9' })).toBeUndefined()
  })

  it('should return undefined for more than two parts', () => {
    expect(parseAspectRatio({ value: '16:9:4' })).toBeUndefined()
  })

  it('should return undefined for non-numeric input', () => {
    expect(parseAspectRatio({ value: 'abc:def' })).toBeUndefined()
    expect(parseAspectRatio({ value: 'Infinity:1' })).toBeUndefined()
    expect(parseAspectRatio({ value: '0x10:9' })).toBeUndefined()
  })

  it('should return undefined for other separators', () => {
    expect(parseAspectRatio({ value: '16/9' })).toBeUndefined()
    expect(parseAspectRatio({ value: '16x9' })).toBeUndefined()
  })
})
