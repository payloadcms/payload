import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  slugLocalizedRequiredGroupSlug,
  slugLocalizedRequiredSiblingSlug,
  slugLocalizedRequiredSlug,
} from './slugs.js'

test.suite('Localized slugs with required localized fields', { config: './config.ts' }, () => {
  for (const locale of ['en', 'es'] as const) {
    test(`should create in ${locale} before translating the required title`, async ({
      payload,
    }) => {
      const otherLocale = locale === 'en' ? 'es' : 'en'
      const created = await payload.create({
        collection: slugLocalizedRequiredSlug,
        data: { slug: '', title: 'First translation' },
        locale,
        overrideAccess: true,
      })

      expect(created).toMatchObject({ slug: 'first-translation', title: 'First translation' })

      const untranslated = await payload.findByID({
        id: created.id,
        collection: slugLocalizedRequiredSlug,
        fallbackLocale: false,
        locale: otherLocale,
        overrideAccess: true,
      })

      expect(untranslated.title ?? null).toBeNull()
      expect(untranslated.slug ?? null).toBeNull()

      const translated = await payload.update({
        id: created.id,
        collection: slugLocalizedRequiredSlug,
        data: { title: 'Second translation' },
        fallbackLocale: false,
        locale: otherLocale,
        overrideAccess: true,
      })

      expect(translated).toMatchObject({ slug: 'second-translation', title: 'Second translation' })

      const originalLocale = await payload.findByID({
        id: created.id,
        collection: slugLocalizedRequiredSlug,
        fallbackLocale: false,
        locale,
        overrideAccess: true,
      })

      expect(originalLocale).toMatchObject({
        slug: 'first-translation',
        title: 'First translation',
      })
    })
  }

  for (const locale of ['en', 'es'] as const) {
    test(`should defer shared, optional, and sourceless slugs in ${locale} until a required sibling is translated`, async ({
      payload,
    }) => {
      const otherLocale = locale === 'en' ? 'es' : 'en'
      const created = await payload.create({
        collection: slugLocalizedRequiredSiblingSlug,
        data: { title: 'Shared title', optionalTitle: 'First title', body: 'First body' },
        locale,
        overrideAccess: true,
      })

      expect(created).toMatchObject({ sharedSlug: 'shared-title', optionalSlug: 'first-title' })
      expect(created.fallbackSlug).toBeTruthy()

      const untranslated = await payload.findByID({
        collection: slugLocalizedRequiredSiblingSlug,
        id: created.id,
        locale: otherLocale,
        fallbackLocale: false,
        overrideAccess: true,
      })

      for (const field of ['body', 'sharedSlug', 'optionalSlug', 'fallbackSlug'] as const) {
        expect(untranslated[field] ?? null).toBeNull()
      }

      const translated = await payload.update({
        collection: slugLocalizedRequiredSiblingSlug,
        id: created.id,
        data: { body: 'Second body', optionalTitle: 'Second title' },
        locale: otherLocale,
        fallbackLocale: false,
        overrideAccess: true,
      })

      expect(translated).toMatchObject({ sharedSlug: 'shared-title', optionalSlug: 'second-title' })
      expect(translated.fallbackSlug).toBeTruthy()

      const originalLocale = await payload.findByID({
        collection: slugLocalizedRequiredSiblingSlug,
        id: created.id,
        locale,
        fallbackLocale: false,
        overrideAccess: true,
      })

      expect(originalLocale).toMatchObject({
        body: 'First body',
        sharedSlug: created.sharedSlug,
        optionalSlug: created.optionalSlug,
        fallbackSlug: created.fallbackSlug,
      })
    })

    test(`should defer a slug in ${locale} until a required localized group child is translated`, async ({
      payload,
    }) => {
      const otherLocale = locale === 'en' ? 'es' : 'en'
      const created = await payload.create({
        collection: slugLocalizedRequiredGroupSlug,
        data: { title: 'Shared title', content: { body: 'First body' } },
        locale,
        overrideAccess: true,
      })

      expect(created.slug).toBe('shared-title')

      const untranslated = await payload.findByID({
        collection: slugLocalizedRequiredGroupSlug,
        id: created.id,
        locale: otherLocale,
        fallbackLocale: false,
        overrideAccess: true,
      })

      expect(untranslated.slug ?? null).toBeNull()
      expect(untranslated.content?.body ?? null).toBeNull()

      const translated = await payload.update({
        collection: slugLocalizedRequiredGroupSlug,
        id: created.id,
        data: { content: { body: 'Second body' } },
        locale: otherLocale,
        fallbackLocale: false,
        overrideAccess: true,
      })

      expect(translated).toMatchObject({ slug: 'shared-title', content: { body: 'Second body' } })
    })
  }
})
