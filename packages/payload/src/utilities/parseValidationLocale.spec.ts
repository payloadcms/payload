import { describe, expect, it } from 'vitest'

import {
  assertValidationData,
  parseValidationLocale,
  parseValidationLocaleSelector,
} from './parseValidationLocale.js'

describe('parseValidationLocale', () => {
  it('should parse a single locale string', () => {
    expect(parseValidationLocale('en')).toEqual({ locale: 'en', type: 'single' })
  })

  it('should parse "all" as the all type', () => {
    expect(parseValidationLocale('all')).toEqual({ type: 'all' })
  })

  it('should parse an array of locale strings', () => {
    expect(parseValidationLocale(['en', 'es'])).toEqual({ locales: ['en', 'es'], type: 'multiple' })
  })

  it('should reject an empty string', () => {
    expect(() => parseValidationLocale('')).toThrow(/requires a locale/i)
  })

  it('should reject an empty array', () => {
    expect(() => parseValidationLocale([])).toThrow(/requires a locale/i)
  })

  it('should reject an array containing an empty string', () => {
    expect(() => parseValidationLocale(['en', ''])).toThrow(/requires a locale/i)
  })

  it('should reject a mixed-type array', () => {
    expect(() => parseValidationLocale(['en', 1])).toThrow(/requires a locale/i)
  })

  it('should reject undefined', () => {
    expect(() => parseValidationLocale(undefined)).toThrow(/requires a locale/i)
  })

  it('should reject a non-string, non-array value', () => {
    expect(() => parseValidationLocale({ locale: 'en' })).toThrow(/requires a locale/i)
  })
})

describe('parseValidationLocaleSelector', () => {
  it('should return "all" for the all type', () => {
    expect(parseValidationLocaleSelector('all')).toBe('all')
  })

  it('should return a single locale string', () => {
    expect(parseValidationLocaleSelector('en')).toBe('en')
  })

  it('should return a locale array for repeated values', () => {
    expect(parseValidationLocaleSelector(['en', 'es'])).toEqual(['en', 'es'])
  })
})

describe('assertValidationData', () => {
  it('should accept a plain object', () => {
    expect(() => assertValidationData({ title: 'Hello' })).not.toThrow()
  })

  it('should reject null', () => {
    expect(() => assertValidationData(null)).toThrow(/must be an object/i)
  })

  it('should reject undefined', () => {
    expect(() => assertValidationData(undefined)).toThrow(/must be an object/i)
  })

  it('should reject an array', () => {
    expect(() => assertValidationData([])).toThrow(/must be an object/i)
  })

  it('should reject a primitive', () => {
    expect(() => assertValidationData('title')).toThrow(/must be an object/i)
  })
})
