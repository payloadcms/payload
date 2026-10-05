/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Integration tests use the shared fixture wrapper. */
import type { ImportDoc } from '@payloadcms/plugin-import-export/types'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { createImportBatchProcessor } from '../../packages/plugin-import-export/src/import/batchProcessor.js'
import { test } from '../__helpers/int/vitest.js'
import { localizedPostsSlug as collection, plainLocalizedPostsSlug } from './slugs.js'

test.suite('Version selector import consumers', { config: './config.ts' }, () => {
  for (const importMode of ['update', 'upsert'] as const) {
    test(`should publish every supplied locale of an existing match in ${importMode} mode`, async ({
      payload,
    }) => {
      const existing = await payload.create({
        collection,
        data: { summary: 'Match', title: { en: 'Pending English', fr: 'Français en attente' } },
        locale: 'all',
      })
      const result = await createImportBatchProcessor().processImport({
        collectionSlug: collection,
        docs: [
          {
            id: existing.id,
            _status: 'published',
            title: { en: 'Imported English', fr: 'Français importé' },
          },
        ],
        importDoc: {} as ImportDoc,
        importMode,
        matchField: 'id',
        req: await createPayloadRequest({ payload }),
      })
      const published = await payload.findByID({ id: existing.id, collection, locale: 'all' })

      expect(result).toMatchObject({ errors: [], imported: 0, updated: 1 })
      expect(published._status).toEqual({ en: 'published', fr: 'published' })
      expect(published.title).toEqual({ en: 'Imported English', fr: 'Français importé' })
    })
  }

  for (const defaultVersionStatus of ['draft', 'published'] as const) {
    test(`should import every locale without drafts when the requested status is ${defaultVersionStatus}`, async ({
      payload,
    }) => {
      const result = await createImportBatchProcessor({ defaultVersionStatus }).processImport({
        collectionSlug: plainLocalizedPostsSlug,
        docs: [{ title: { en: 'English', fr: 'Français' } }],
        importDoc: {} as ImportDoc,
        importMode: 'create',
        req: await createPayloadRequest({ payload }),
      })
      const documents = await payload.find({ collection: plainLocalizedPostsSlug, locale: 'all' })

      expect(result).toMatchObject({ errors: [], imported: 1, updated: 0 })
      expect(documents.docs[0].title).toEqual({ en: 'English', fr: 'Français' })
      expect(documents.docs[0]).not.toHaveProperty('_status')
    })
  }

  test('should report denied follow-up locale access as a failed import', async ({ payload }) => {
    const access = payload.collections[collection].config.access
    const previousUpdate = access.update

    access.update = ({ req }) => req.locale !== 'fr'
    try {
      const result = await createImportBatchProcessor().processImport({
        collectionSlug: collection,
        docs: [{ title: { en: 'English', fr: 'Français' } }],
        importDoc: {} as ImportDoc,
        importMode: 'create',
        req: await createPayloadRequest({ payload }),
      })

      expect(result).toMatchObject({ imported: 0, updated: 0 })
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toMatch(/fr/)
    } finally {
      access.update = previousUpdate
    }
  })

  for (const importMode of ['upsert', 'update'] as const) {
    test(`should match an existing draft-only document in ${importMode} mode`, async ({
      payload,
    }) => {
      const created = await payload.create({
        collection,
        data: { summary: 'Draft match', title: 'Original draft' },
      })
      const result = await createImportBatchProcessor({
        defaultVersionStatus: 'draft',
      }).processImport({
        collectionSlug: collection,
        docs: [{ summary: 'Draft match', title: 'Updated draft' }],
        importDoc: {} as ImportDoc,
        importMode,
        matchField: 'summary',
        req: await createPayloadRequest({ payload }),
      })
      const documents = await payload.find({ collection, version: 'latest' })

      expect(result).toMatchObject({ errors: [], imported: 0, updated: 1 })
      expect(documents.docs).toHaveLength(1)
      expect(documents.docs[0]).toMatchObject({
        id: created.id,
        _status: 'draft',
        title: 'Updated draft',
      })
    })
  }

  test('should match a pending value that differs from the published copy', async ({ payload }) => {
    const created = await payload.create({
      collection,
      data: { summary: 'Live match', title: 'Live title' },
      version: 'published',
    })

    await payload.update({
      id: created.id,
      collection,
      data: { summary: 'Pending match', title: 'Pending title' },
    })
    const result = await createImportBatchProcessor().processImport({
      collectionSlug: collection,
      docs: [{ summary: 'Pending match', title: 'Updated pending' }],
      importDoc: {} as ImportDoc,
      importMode: 'upsert',
      matchField: 'summary',
      req: await createPayloadRequest({ payload }),
    })

    expect(result).toMatchObject({ errors: [], imported: 0, updated: 1 })
    expect((await payload.find({ collection, version: 'latest' })).totalDocs).toBe(1)
    expect((await payload.findByID({ id: created.id, collection })).title).toBe('Live title')
  })

  test('should report denied match access instead of creating an unrestricted duplicate', async ({
    payload,
  }) => {
    await payload.create({ collection, data: { summary: 'Private match', title: 'Private draft' } })
    const access = payload.collections[collection].config.access
    const previousRead = access.read

    access.read = () => false
    try {
      const result = await createImportBatchProcessor().processImport({
        collectionSlug: collection,
        docs: [{ summary: 'Private match', title: 'Replacement' }],
        importDoc: {} as ImportDoc,
        importMode: 'upsert',
        matchField: 'summary',
        req: await createPayloadRequest({ payload }),
      })

      expect(result.imported).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(
        (await payload.find({ collection, overrideAccess: true, version: 'latest' })).totalDocs,
      ).toBe(1)
    } finally {
      access.read = previousRead
    }
  })

  for (const defaultVersionStatus of ['draft', 'published'] as const) {
    test(`should import every locale of a new ${defaultVersionStatus} upsert`, async ({
      payload,
    }) => {
      const processor = createImportBatchProcessor({ defaultVersionStatus })
      const result = await processor.processImport({
        collectionSlug: collection,
        docs: [{ summary: 'Match key', title: { en: 'English', fr: 'Français' } }],
        importDoc: {} as ImportDoc,
        importMode: 'upsert',
        matchField: 'summary',
        req: await createPayloadRequest({ payload }),
      })
      const documents = await payload.find({ collection, locale: 'all', version: 'latest' })

      expect(result).toMatchObject({ errors: [], imported: 1, updated: 0 })
      expect(documents.docs).toHaveLength(1)
      expect(documents.docs[0].title).toEqual({ en: 'English', fr: 'Français' })
      expect((await payload.find({ collection })).totalDocs).toBe(
        defaultVersionStatus === 'draft' ? 0 : 1,
      )
    })
  }

  for (const importMode of ['create', 'upsert', 'update'] as const) {
    test(`should report a later locale failure and continue the next row in ${importMode} mode`, async ({
      payload,
    }) => {
      const title = payload.collections[collection].config.fields.find(
        (field) => 'name' in field && field.name === 'title',
      )!
      const previousHooks = title.hooks

      title.hooks = {
        ...previousHooks,
        beforeValidate: [
          ...(previousHooks?.beforeValidate ?? []),
          ({ req, value }) => {
            if (req.locale === 'fr' && value === 'Rejected French') {
              throw new Error('Rejected French locale')
            }
            return value
          },
        ],
      }
      try {
        if (importMode === 'update') {
          for (const summary of ['Rejected row', 'Valid row']) {
            await payload.create({ collection, data: { summary, title: 'Original' } })
          }
        }
        const result = await createImportBatchProcessor().processImport({
          collectionSlug: collection,
          docs: [
            { summary: 'Rejected row', title: { en: 'Partial English', fr: 'Rejected French' } },
            { summary: 'Valid row', title: { en: 'Valid English', fr: 'Français valide' } },
          ],
          importDoc: {} as ImportDoc,
          importMode,
          matchField: 'summary',
          req: await createPayloadRequest({ payload }),
        })
        const documents = await payload.find({
          collection,
          locale: 'all',
          sort: 'id',
          version: 'latest',
        })

        expect(result).toMatchObject({
          imported: importMode === 'update' ? 0 : 1,
          total: 2,
          updated: importMode === 'update' ? 1 : 0,
        })
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0]).toMatchObject({
          error: expect.stringMatching(/fr.*Rejected French locale/),
          index: 0,
        })
        expect(documents.docs).toHaveLength(2)
        expect(documents.docs[0].title.en).toBe('Partial English')
        expect(documents.docs[0].title.fr).toBeFalsy()
        expect(documents.docs[1].title).toEqual({ en: 'Valid English', fr: 'Français valide' })
      } finally {
        title.hooks = previousHooks
      }
    })
  }
})
