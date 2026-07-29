import { describe, expect, it } from 'vitest'

import type { TypedLocale } from '../index.js'

import { runValidationLocalePasses } from './resolveValidationLocales.js'

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
