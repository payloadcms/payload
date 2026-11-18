import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  noFallbackDefaultLocale,
  noFallbackOtherLocale,
  noFallbackPagesSlug,
} from './noFallback.config.js'

const defaultLocaleTitle = 'german title'
const otherLocaleTitle = 'english title'

test.suite({ config: './noFallback.config.ts' })('Localization - fallback disabled', () => {
  test.beforeEach(async ({ payload }) => {
    const page = await payload.create({
      collection: noFallbackPagesSlug,
      data: {
        title: defaultLocaleTitle,
      },
      locale: noFallbackDefaultLocale,
    })

    await payload.update({
      id: page.id,
      collection: noFallbackPagesSlug,
      data: {
        title: otherLocaleTitle,
      },
      locale: noFallbackOtherLocale,
    })
  })

  test('should read localized fields in the default locale when no locale is requested', async ({
    restClient,
  }) => {
    const response = await restClient.GET(`/${noFallbackPagesSlug}`)

    expect(response.status).toBe(200)

    const result = await response.json()

    expect(result.docs).toHaveLength(1)
    expect(result.docs[0].title).toBe(defaultLocaleTitle)
  })

  test('should query a localized field against the default locale when no locale is requested', async ({
    restClient,
  }) => {
    const response = await restClient.GET(`/${noFallbackPagesSlug}`, {
      query: {
        where: {
          title: {
            equals: defaultLocaleTitle,
          },
        },
      },
    })

    expect(response.status).toBe(200)

    const result = await response.json()

    expect(result.docs).toHaveLength(1)
    expect(result.docs[0].title).toBe(defaultLocaleTitle)
  })

  test('should not match other locales when querying a localized field with no locale requested', async ({
    restClient,
  }) => {
    const response = await restClient.GET(`/${noFallbackPagesSlug}`, {
      query: {
        where: {
          title: {
            equals: otherLocaleTitle,
          },
        },
      },
    })

    expect(response.status).toBe(200)

    const result = await response.json()

    expect(result.docs).toHaveLength(0)
  })
})
