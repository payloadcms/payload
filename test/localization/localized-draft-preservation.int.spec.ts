/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  allFieldsLocalizedSlug,
  defaultLocale,
  publicationFieldAccessGlobalSlug,
  publicationFieldAccessSlug,
  spanishLocale,
} from './shared.js'

test.suite('Localized draft preservation', { config: './config.ts' }, () => {
  test('should preserve collection status when field access denies draft status changes', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: publicationFieldAccessSlug,
      data: { _status: 'published', title: 'Published' },
      overrideAccess: true,
    })

    await payload.update({
      id: doc.id,
      collection: publicationFieldAccessSlug,
      data: { _status: 'draft', title: 'Localized draft' },
      draft: true,
      locale: defaultLocale,
      overrideAccess: false,
    })

    const draft = await payload.findByID({
      id: doc.id,
      collection: publicationFieldAccessSlug,
      draft: true,
      locale: defaultLocale,
      overrideAccess: true,
    })

    expect(draft.title).toBe('Localized draft')
    expect(draft._status).toBe('published')
  })

  test('should preserve global status when field access denies draft status changes', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug: publicationFieldAccessGlobalSlug,
      data: { _status: 'published', title: 'Published' },
      overrideAccess: true,
    })

    await payload.updateGlobal({
      slug: publicationFieldAccessGlobalSlug,
      data: { _status: 'draft', title: 'Localized draft' },
      draft: true,
      locale: defaultLocale,
      overrideAccess: false,
    })

    const versions = await payload.findGlobalVersions({
      slug: publicationFieldAccessGlobalSlug,
      limit: 1,
      locale: defaultLocale,
      overrideAccess: true,
      sort: '-updatedAt',
      where: { latest: { equals: true } },
    })

    const draft = versions.docs[0]!.version

    expect(draft.title).toBe('Localized draft')
    expect(draft._status).toBe('published')
  })

  test('should draft all locales when a shared array is cleared with null', async ({ payload }) => {
    const doc = await payload.create({
      collection: allFieldsLocalizedSlug,
      data: {
        _status: 'published',
        nonLocalizedArray: [{ localizedItem: 'Published row' }],
        text: 'English',
      },
      locale: defaultLocale,
      overrideAccess: true,
    })

    await payload.update({
      id: doc.id,
      collection: allFieldsLocalizedSlug,
      data: { _status: 'published', text: 'Spanish' },
      locale: spanishLocale,
      overrideAccess: true,
    })

    await payload.update({
      id: doc.id,
      collection: allFieldsLocalizedSlug,
      data: { _status: 'draft', nonLocalizedArray: null },
      draft: true,
      locale: defaultLocale,
      overrideAccess: true,
    })

    const draft = await payload.findByID({
      id: doc.id,
      collection: allFieldsLocalizedSlug,
      draft: true,
      locale: 'all',
      overrideAccess: true,
    })

    expect(draft.nonLocalizedArray).toEqual([])
    expect(draft._status!.en).toBe('draft')
    expect(draft._status!.es).toBe('draft')
  })
})
