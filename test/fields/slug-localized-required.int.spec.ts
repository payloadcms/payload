import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { slugLocalizedRequiredSlug } from './slugs.js'

test.suite('Localized slugs with a required source', { config: './config.ts' }, () => {
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
})
