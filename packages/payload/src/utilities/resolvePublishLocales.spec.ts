import { describe, expect, it } from 'vitest'

import type { SanitizedLocalizationConfig } from '../config/types.js'

import { resolvePublishLocales } from './resolvePublishLocales.js'

const localization = {
  locales: [
    { code: 'en', label: 'English', required: false },
    { code: 'es', label: 'Spanish', required: true },
    { code: 'de', label: 'German', required: false },
    { code: 'fr', label: 'French', required: true },
  ],
} as SanitizedLocalizationConfig

describe('resolvePublishLocales', () => {
  it('should return the current locale followed by configured required locales', () => {
    expect(
      resolvePublishLocales({
        locale: 'de',
        localization,
        publishAllLocales: false,
      }),
    ).toEqual(['de', 'es', 'fr'])
  })

  it('should exclude optional non-current locales and deduplicate required current locale', () => {
    expect(
      resolvePublishLocales({
        locale: 'es',
        localization,
        publishAllLocales: false,
      }),
    ).toEqual(['es', 'fr'])
  })

  it('should return all for explicit publish-all', () => {
    expect(
      resolvePublishLocales({
        locale: 'en',
        localization,
        publishAllLocales: true,
      }),
    ).toBe('all')
  })
})
