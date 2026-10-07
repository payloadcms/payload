import { describe, expect, it } from 'vitest'

import type { SanitizedLocalizationConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { TypedLocale } from '../index.js'

import { resolveValidationLocales } from './resolveValidationLocales.js'

function createReq(localization: false | SanitizedLocalizationConfig): PayloadRequest {
  return {
    payload: {
      config: {
        localization,
      },
    },
  } as unknown as PayloadRequest
}

describe('resolveValidationLocales', () => {
  const localization = {
    defaultLocale: 'en',
    localeCodes: ['en', 'es', 'de'],
    locales: [
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Spanish' },
      { code: 'de', label: 'German' },
    ],
  } as SanitizedLocalizationConfig

  it('should return a single requested locale as an array', async () => {
    await expect(
      resolveValidationLocales({ locale: 'es', req: createReq(localization) }),
    ).resolves.toEqual(['es'])
  })

  it('should deduplicate requested locales while preserving order', async () => {
    await expect(
      resolveValidationLocales({ locale: ['es', 'en', 'es'], req: createReq(localization) }),
    ).resolves.toEqual(['es', 'en'])
  })

  it('should resolve "all" to every configured locale when no filter is configured', async () => {
    await expect(
      resolveValidationLocales({ locale: 'all', req: createReq(localization) }),
    ).resolves.toEqual(['en', 'es', 'de'])
  })

  it('should resolve "all" through filterAvailableLocales when configured', async () => {
    const filteredLocalization = {
      ...localization,
      filterAvailableLocales: () => [{ code: 'en', label: 'English' }],
    } as SanitizedLocalizationConfig

    await expect(
      resolveValidationLocales({ locale: 'all', req: createReq(filteredLocalization) }),
    ).resolves.toEqual(['en'])
  })

  it('should reject a locale excluded by filterAvailableLocales as unavailable', async () => {
    const filteredLocalization = {
      ...localization,
      filterAvailableLocales: () => [{ code: 'en', label: 'English' }],
    } as SanitizedLocalizationConfig

    await expect(
      resolveValidationLocales({ locale: 'de', req: createReq(filteredLocalization) }),
    ).rejects.toThrow(/not available/i)
  })

  it('should reject a locale that is not configured at all', async () => {
    await expect(
      resolveValidationLocales({ locale: 'fr', req: createReq(localization) }),
    ).rejects.toThrow(/not configured/i)
  })

  it('should reject an empty locale array', async () => {
    await expect(
      resolveValidationLocales({
        locale: [] as unknown as TypedLocale,
        req: createReq(localization),
      }),
    ).rejects.toThrow(/requires a locale/i)
  })

  it('should return [null] for "all" when localization is not configured', async () => {
    await expect(
      resolveValidationLocales({ locale: 'all', req: createReq(false) }),
    ).resolves.toEqual([null])
  })

  it('should return [null] for a null locale when localization is not configured', async () => {
    await expect(
      resolveValidationLocales({ locale: null as unknown as TypedLocale, req: createReq(false) }),
    ).resolves.toEqual([null])
  })

  it('should reject a non-null locale when localization is not configured', async () => {
    await expect(resolveValidationLocales({ locale: 'en', req: createReq(false) })).rejects.toThrow(
      /requires a locale/i,
    )
  })
})
