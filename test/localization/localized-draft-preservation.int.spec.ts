/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  allFieldsLocalizedSlug,
  defaultLocale,
  localizedStatusSharedGlobalSlug,
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
    expect(payload.collections[allFieldsLocalizedSlug].config.versions).toMatchObject({
      drafts: { localizeStatus: true },
    })

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
