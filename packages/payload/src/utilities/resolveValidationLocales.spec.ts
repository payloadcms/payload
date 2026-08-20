import { describe, expect, it } from 'vitest'

import type { SanitizedLocalizationConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { TypedLocale } from '../index.js'

import {
  cloneValidationRequest,
  resolveValidationLocales,
  runValidationLocalePasses,
} from './resolveValidationLocales.js'

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

describe('runValidationLocalePasses - concurrency', () => {
  const tenLocales = Array.from({ length: 10 }, (_, index) => `locale-${index}`) as TypedLocale[]

  it('should run locale passes concurrently by default, allowing overlap', async () => {
    let activeCount = 0
    let maxObservedActiveCount = 0

    await runValidationLocalePasses({
      locales: tenLocales,
      validate: async (locale) => {
        activeCount += 1
        maxObservedActiveCount = Math.max(maxObservedActiveCount, activeCount)

        await new Promise((resolve) => setTimeout(resolve, 5))

        activeCount -= 1
        return locale
      },
    })

    expect(maxObservedActiveCount).toBeGreaterThan(1)
  })

  it('should never run more than one locale pass at a time across 10 locales when concurrency is 1', async () => {
    let activeCount = 0
    let maxObservedActiveCount = 0

    const results = await runValidationLocalePasses({
      concurrency: 1,
      locales: tenLocales,
      validate: async (locale) => {
        activeCount += 1
        maxObservedActiveCount = Math.max(maxObservedActiveCount, activeCount)

        if (activeCount > 1) {
          throw new Error(`Locale pass for "${String(locale)}" overlapped with another pass`)
        }

        await new Promise((resolve) => setTimeout(resolve, 5))

        activeCount -= 1
        return locale
      },
    })

    expect(maxObservedActiveCount).toBe(1)
    expect(results).toEqual(tenLocales)
  })

  it('should preserve input locale order in the results regardless of concurrency', async () => {
    const results = await runValidationLocalePasses({
      concurrency: 4,
      locales: tenLocales,
      validate: async (locale) => {
        const delayMs = tenLocales.indexOf(locale) % 2 === 0 ? 1 : 10

        await new Promise((resolve) => setTimeout(resolve, delayMs))

        return locale
      },
    })

    expect(results).toEqual(tenLocales)
  })

  it('should clamp concurrency to the number of locales', async () => {
    let maxObservedActiveCount = 0
    let activeCount = 0

    await runValidationLocalePasses({
      concurrency: 100,
      locales: tenLocales,
      validate: async (locale) => {
        activeCount += 1
        maxObservedActiveCount = Math.max(maxObservedActiveCount, activeCount)

        await new Promise((resolve) => setTimeout(resolve, 5))

        activeCount -= 1
        return locale
      },
    })

    expect(maxObservedActiveCount).toBe(tenLocales.length)
  })
})

describe('cloneValidationRequest', () => {
  it('should return an empty object for an undefined request', () => {
    expect(cloneValidationRequest(undefined)).toEqual({})
  })

  it('should clone headers into a new instance while sharing the abort signal', () => {
    const request = new Request('https://example.com/api/posts', {
      headers: { 'x-test': 'value' },
      method: 'POST',
    }) as unknown as PayloadRequest

    const cloned = cloneValidationRequest(request)

    expect(cloned.url).toBe('https://example.com/api/posts')
    expect(cloned.method).toBe('POST')
    // `Request` derives its own `.signal` rather than exposing the one passed to its constructor
    // by reference, so this compares against the request's own signal, not a controller's.
    expect(cloned.signal).toBe(request.signal)
    expect(cloned.headers).not.toBe(request.headers)
    expect((cloned.headers as unknown as Headers).get('x-test')).toBe('value')
  })

  it('should clone own enumerable properties independently of the source request', () => {
    const request = {
      context: { marker: 'original' },
    } as unknown as PayloadRequest

    const cloned = cloneValidationRequest(request)

    expect(cloned.context).toEqual({ marker: 'original' })
    expect(cloned.context).not.toBe(request.context)
  })

  it('should default context, query, and routeParams to empty objects when absent from the source request', () => {
    const request = {} as unknown as PayloadRequest

    const cloned = cloneValidationRequest(request)

    expect(cloned.context).toEqual({})
    expect(cloned.query).toEqual({})
    expect(cloned.routeParams).toEqual({})
  })

  it('should share, not clone, the properties reused across validation locale passes', () => {
    const payload = {}
    const request = {
      payload,
      transactionID: 'txn-1',
    } as unknown as PayloadRequest

    const cloned = cloneValidationRequest(request)

    expect(cloned.payload).toBe(payload)
    expect(cloned.transactionID).toBe('txn-1')
  })
})
