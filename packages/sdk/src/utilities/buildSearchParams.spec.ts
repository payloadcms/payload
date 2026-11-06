import { buildSearchParams } from './buildSearchParams.js'
import { describe, expect, it } from 'vitest'

describe('buildSearchParams', () => {
  it('should send fallbackLocale: false so the server disables the fallback', () => {
    expect(buildSearchParams({ fallbackLocale: false })).toBe('?fallback-locale=false')
  })

  it('should send a fallbackLocale locale code', () => {
    expect(buildSearchParams({ fallbackLocale: 'fr' })).toBe('?fallback-locale=fr')
  })

  it('should omit fallbackLocale when it is not set', () => {
    expect(buildSearchParams({})).toBe('')
  })
})
