/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  publishSharedCollectionLocales,
  publishSharedGlobalLocales,
} from './helpers/publishLocales.js'
import {
  allFieldsLocalizedSlug,
  defaultLocale,
  localizedStatusSharedGlobalSlug,
  publicationFieldAccessGlobalSlug,
  publicationFieldAccessSlug,
  spanishLocale,
  spanishTitle,
} from './shared.js'

test.suite('Localized draft preservation', { config: './config.ts' }, () => {
  test('should preserve other published collection locales when unpublishing with a pending draft', async ({
    payload,
  }) => {
    const doc = await publishSharedCollectionLocales({ payload })

    await payload.update({
      overrideAccess: true,
      collection: allFieldsLocalizedSlug,
      id: doc.id,
      locale: spanishLocale,
      draft: true,
      data: { _status: 'draft', text: 'Spanish draft' },
    })

    await payload.update({
      overrideAccess: true,
      collection: allFieldsLocalizedSlug,
      id: doc.id,
      locale: defaultLocale,
      data: { _status: 'draft', text: 'English unpublished' },
    })

    const stored = await payload.db.findOne({
      collection: allFieldsLocalizedSlug,
      locale: 'all',
      where: { id: { equals: doc.id } },
    })

    expect(stored.text.es).toBe('spanish published')
    expect(stored._status.es).toBe('published')
  })

  test('should preserve other published global locales when unpublishing with a pending draft', async ({
    payload,
  }) => {
    await publishSharedGlobalLocales({ payload })

    await payload.updateGlobal({
      overrideAccess: true,
      slug: localizedStatusSharedGlobalSlug,
      locale: spanishLocale,
      draft: true,
      data: { _status: 'draft', localizedText: 'Spanish draft' },
    })

    await payload.updateGlobal({
      overrideAccess: true,
      slug: localizedStatusSharedGlobalSlug,
      locale: defaultLocale,
      data: { _status: 'draft', localizedText: 'English unpublished' },
    })

    const stored = await payload.db.findGlobal({
      slug: localizedStatusSharedGlobalSlug,
      locale: 'all',
    })

    expect(stored.localizedText.es).toBe(spanishTitle)
    expect(stored._status.es).toBe('published')
  })

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
    expect(payload.collections[allFieldsLocalizedSlug].config.versions).toMatchObject({
      drafts: { localizeStatus: true },
    })

    const doc = await publishSharedCollectionLocales({
      payload,
      data: { nonLocalizedArray: [{ localizedItem: 'Published row' }] },
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

  for (const field of ['sharedRows', 'sharedBlocks'] as const) {
    test(`should preserve other global locale statuses when only a localized ${field} child changes`, async ({
      payload,
    }) => {
      const row = {
        ...(field === 'sharedBlocks' ? { blockType: 'sharedTextBlock' as const } : {}),
        localizedText: 'English published',
        sharedText: 'Shared published',
      }
      const english = await payload.updateGlobal({
        slug: localizedStatusSharedGlobalSlug,
        data: { _status: 'published', [field]: [row] },
        locale: defaultLocale,
        overrideAccess: true,
      })
      const rowID = english[field]![0]!.id

      await payload.updateGlobal({
        slug: localizedStatusSharedGlobalSlug,
        data: {
          _status: 'published',
          [field]: [{ ...row, id: rowID, localizedText: 'Spanish published' }],
        },
        locale: spanishLocale,
        overrideAccess: true,
      })
      await payload.updateGlobal({
        slug: localizedStatusSharedGlobalSlug,
        data: {
          _status: 'draft',
          [field]: [
            {
              id: rowID,
              ...(field === 'sharedBlocks' ? { blockType: 'sharedTextBlock' } : {}),
              localizedText: 'English draft',
            },
          ],
        },
        draft: true,
        locale: defaultLocale,
        overrideAccess: true,
      })

      const draft = await payload.findGlobal({
        slug: localizedStatusSharedGlobalSlug,
        draft: true,
        locale: 'all',
        overrideAccess: true,
      })

      expect(draft[field]![0]!.sharedText).toBe('Shared published')
      expect(draft._status!.en).toBe('draft')
      expect(draft._status!.es).toBe('published')
    })
  }
})
