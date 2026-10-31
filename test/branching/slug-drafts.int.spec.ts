import type { MongooseAdapter } from '@payloadcms/db-mongodb'

import { mkdtemp, rm } from 'node:fs/promises'
import path from 'node:path'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { slugDraftsSlug } from './shared.js'

test.suite('Branching: unique fields in drafts', { config: './config.ts' }, () => {
  test.options(
    'should replace a stale global slug index before autosaving a published page on a branch',
    { db: 'mongo' },
    async ({ payload }) => {
      const doc = await payload.create({
        collection: slugDraftsSlug,
        data: { _status: 'published', slug: 'legacy-published-page', title: 'Published page' },
        locale: 'en',
        overrideAccess: true,
      })
      const adapter = payload.db as MongooseAdapter
      const model = adapter.collections[slugDraftsSlug]!
      const indexName = 'legacy_slug_unique'
      const originalMigrationDir = adapter.migrationDir
      const migrationDir = await mkdtemp(
        path.resolve(process.cwd(), 'packages/db-mongodb/.tmp-branching-migration-'),
      )

      const autosave = () =>
        payload.update({
          id: doc.id,
          autosave: true,
          branch: 'halloween-updates',
          collection: slugDraftsSlug,
          data: { slug: 'legacy-published-page', title: 'Branch edit' },
          draft: true,
          locale: 'en',
          overrideAccess: true,
        })

      try {
        await model.collection.createIndex(
          { slug: 1 },
          { name: indexName, sparse: true, unique: true },
        )

        await expect(autosave()).rejects.toMatchObject({
          data: {
            collection: slugDraftsSlug,
            errors: [{ message: 'Value must be unique', path: 'slug' }],
          },
        })

        adapter.migrationDir = migrationDir

        await adapter.createMigration({
          file: '@payloadcms/db-mongodb/branching',
          migrationName: 'sync_native_slug_indexes',
          payload,
        })
        await adapter.migrate()

        const updated = await autosave()

        expect(updated).toMatchObject({
          id: doc.id,
          slug: 'legacy-published-page',
          title: 'Branch edit',
        })

        const main = await payload.findByID({
          id: doc.id,
          branch: 'main',
          collection: slugDraftsSlug,
          locale: 'en',
          overrideAccess: true,
        })

        expect(main).toMatchObject({ _status: 'published', title: 'Published page' })
      } finally {
        adapter.migrationDir = originalMigrationDir
        await rm(migrationDir, { force: true, recursive: true })

        const indexes = await model.collection.indexes()

        if (indexes.some(({ name }) => name === indexName)) {
          await model.collection.dropIndex(indexName)
        }
      }
    },
  )

  test('should autosave a published main page on a branch without conflicting with its slug', async ({
    payload,
  }) => {
    const doc = await payload.create({
      branch: 'main',
      collection: slugDraftsSlug,
      data: { _status: 'published', slug: 'published-page', title: 'Published page' },
      locale: 'en',
      overrideAccess: true,
    })

    for (const title of ['First branch edit', 'Second branch edit']) {
      const updated = await payload.update({
        id: doc.id,
        autosave: true,
        branch: 'halloween-updates',
        collection: slugDraftsSlug,
        data: { _status: 'draft', slug: 'published-page', title },
        draft: true,
        locale: 'en',
        overrideAccess: true,
      })

      expect(updated).toMatchObject({ id: doc.id, slug: 'published-page', title })
    }

    const main = await payload.findByID({
      id: doc.id,
      branch: 'main',
      collection: slugDraftsSlug,
      draft: false,
      locale: 'en',
      overrideAccess: true,
    })

    expect(main).toMatchObject({
      _status: 'published',
      slug: 'published-page',
      title: 'Published page',
    })
  })

  for (const field of ['slug', 'code'] as const) {
    test(`should reject another document with the same unique ${field} on a branch`, async ({
      payload,
    }) => {
      await payload.create({
        branch: 'halloween-updates',
        collection: slugDraftsSlug,
        data: { [field]: 'taken', title: 'First document' },
        overrideAccess: true,
      })

      await expect(
        payload.create({
          branch: 'halloween-updates',
          collection: slugDraftsSlug,
          data: { [field]: 'taken', title: 'Second document' },
          overrideAccess: true,
        }),
      ).rejects.toMatchObject({
        data: { errors: expect.arrayContaining([expect.objectContaining({ path: field })]) },
      })
    })
  }

  test('should validate both locales of a branch-only draft with a native slug', async ({
    payload,
  }) => {
    const doc = await payload.create({
      branch: 'halloween-updates',
      collection: slugDraftsSlug,
      data: { slug: 'branch-only-slug', title: 'English title' },
      draft: true,
      locale: 'en',
      overrideAccess: true,
    })

    await payload.update({
      id: doc.id,
      branch: 'halloween-updates',
      collection: slugDraftsSlug,
      data: { title: 'Spanish title' },
      draft: true,
      locale: 'es',
      overrideAccess: true,
    })

    const result = await payload.validate({
      id: doc.id,
      collection: slugDraftsSlug,
      data: { _status: 'published', slug: 'branch-only-slug' },
      draft: true,
      locale: ['en', 'es'],
      overrideAccess: true,
      req: { branch: 'halloween-updates' },
    })

    expect(result).toMatchObject({ errors: [], valid: true })
  })

  test('should publish an existing main document without conflicting with its own slug', async ({
    payload,
  }) => {
    const doc = await payload.create({
      branch: 'main',
      collection: slugDraftsSlug,
      data: { _status: 'published', code: 'main-code', slug: 'main-slug', title: 'Original title' },
      overrideAccess: true,
    })

    const updated = await payload.update({
      id: doc.id,
      branch: 'main',
      collection: slugDraftsSlug,
      data: { _status: 'published', code: 'main-code', slug: 'main-slug', title: 'Updated title' },
      overrideAccess: true,
    })

    expect(updated).toMatchObject({ code: 'main-code', slug: 'main-slug', title: 'Updated title' })
  })

  test('should save a new main draft version without conflicting with its own unique fields', async ({
    payload,
  }) => {
    const doc = await payload.create({
      branch: 'main',
      collection: slugDraftsSlug,
      data: { code: 'main-code', slug: 'main-slug', title: 'Original title' },
      overrideAccess: true,
    })

    const updated = await payload.update({
      id: doc.id,
      branch: 'main',
      collection: slugDraftsSlug,
      data: { title: 'Updated title' },
      autosave: true,
      draft: true,
      overrideAccess: true,
    })

    expect(updated).toMatchObject({ code: 'main-code', slug: 'main-slug', title: 'Updated title' })
  })

  test('should fork a versioned document with a native slug onto a branch', async ({ payload }) => {
    const doc = await payload.create({
      collection: slugDraftsSlug,
      data: { slug: 'shared-slug', title: 'Original title' },
      overrideAccess: true,
    })

    const updated = await payload.update({
      id: doc.id,
      branch: 'halloween-updates',
      collection: slugDraftsSlug,
      data: { title: 'Branch title' },
      draft: true,
      overrideAccess: true,
    })

    expect(updated).toMatchObject({ id: doc.id, slug: 'shared-slug', title: 'Branch title' })
  })
})
