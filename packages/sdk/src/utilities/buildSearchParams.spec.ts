import { describe, expect, it } from 'vitest'

import { buildSearchParams } from './buildSearchParams.js'

describe('buildSearchParams', () => {
  it('should pass a fallbackLocale string as fallback-locale', () => {
    expect(buildSearchParams({ fallbackLocale: 'en', locale: 'es' })).toBe(
      '?fallback-locale=en&locale=es',
    )
  })

  it('should pass fallbackLocale: false as fallback-locale=false', () => {
    expect(buildSearchParams({ fallbackLocale: false, locale: 'es' })).toBe(
      '?fallback-locale=false&locale=es',
    )
  })
})
