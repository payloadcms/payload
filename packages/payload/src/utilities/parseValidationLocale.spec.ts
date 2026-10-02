import { describe, expect, it } from 'vitest'

import {
  assertValidationData,
  parseValidationLocale,
  parseValidationLocaleSelector,
} from './parseValidationLocale.js'

describe('parseValidationLocale', () => {
  it.each([
    ['a single locale', 'en', { locale: 'en', type: 'single' }],
    ['all locales', 'all', { type: 'all' }],
    ['multiple locales', ['en', 'es'], { locales: ['en', 'es'], type: 'multiple' }],
  ])('should parse %s', (_description, input, expected) => {
    expect(parseValidationLocale(input)).toEqual(expected)
  })

  it.each([
    ['an empty string', ''],
    ['an empty array', []],
    ['an array containing an empty string', ['en', '']],
    ['a mixed-type array', ['en', 1]],
    ['undefined', undefined],
    ['a non-string, non-array value', { locale: 'en' }],
  ])('should reject %s', (_description, input) => {
    expect(() => parseValidationLocale(input)).toThrow(/requires a locale/i)
  })
})

describe('parseValidationLocaleSelector', () => {
  it.each([
    ['all', 'all', 'all'],
    ['a single locale', 'en', 'en'],
    ['repeated locale values', ['en', 'es'], ['en', 'es']],
  ])('should return %s', (_description, input, expected) => {
    expect(parseValidationLocaleSelector(input)).toEqual(expected)
  })
})

describe('assertValidationData', () => {
  it('should accept a plain object', () => {
    expect(() => assertValidationData({ title: 'Hello' })).not.toThrow()
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['an array', []],
    ['a primitive', 'title'],
  ])('should reject %s', (_description, input) => {
    expect(() => assertValidationData(input)).toThrow(/must be an object/i)
  })
})
