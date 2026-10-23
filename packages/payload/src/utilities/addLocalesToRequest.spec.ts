import type { SanitizedConfig } from '../config/types.js'

import { describe, expect, it } from 'vitest'

import { sanitizeLocales } from './addLocalesToRequest.js'

const buildLocalization = (fallback: boolean): SanitizedConfig['localization'] =>
  ({
    defaultLocale: 'de',
    fallback,
    localeCodes: ['de', 'en'],
    locales: [
      { code: 'de', label: 'Deutsch' },
      { code: 'en', label: 'English' },
    ],
  }) as unknown as SanitizedConfig['localization']

describe('sanitizeLocales', () => {
  it('should keep a valid locale', () => {
    const { locale } = sanitizeLocales({
      fallbackLocale: undefined as any,
      locale: 'en',
      localization: buildLocalization(false),
    })

    expect(locale).toBe('en')
  })

  it('should resolve "*" to "all"', () => {
    const { locale } = sanitizeLocales({
      fallbackLocale: undefined as any,
      locale: '*',
      localization: buildLocalization(false),
    })

    expect(locale).toBe('all')
  })

  it('should use the default locale when no locale is sent and fallback is enabled', () => {
    const { locale } = sanitizeLocales({
      fallbackLocale: undefined as any,
      locale: null as any,
      localization: buildLocalization(true),
    })

    expect(locale).toBe('de')
  })

  it('should use the default locale when no locale is sent and fallback is disabled', () => {
    const { locale } = sanitizeLocales({
      fallbackLocale: undefined as any,
      locale: null as any,
      localization: buildLocalization(false),
    })

    expect(locale).toBe('de')
  })

  it('should use the default locale for an unknown locale when fallback is disabled', () => {
    const { locale } = sanitizeLocales({
      fallbackLocale: undefined as any,
      locale: 'xx',
      localization: buildLocalization(false),
    })

    expect(locale).toBe('de')
  })
})
