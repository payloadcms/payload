import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { Payload } from 'payload'

import { expect, vi } from 'vitest'

import { migrateBranching } from '../../packages/db-mongodb/src/predefinedMigrations/migrateBranching.js'
import { test } from '../__helpers/int/vitest.js'
import { pagesSlug, settingsSlug, uploadsSlug } from './shared.js'

test.suite('MongoDB branching index migration', { config: './config.ts', db: 'mongo' }, () => {
  test.afterEach(async ({ payload }) => {
    vi.restoreAllMocks()

    const adapter = payload.db as MongooseAdapter

    // The shared fixture clears documents; these tests also change the index catalog.
    for (const model of [
      adapter.collections[pagesSlug]!,
      adapter.collections[uploadsSlug]!,
      adapter.versions[pagesSlug]!,
      adapter.versions[settingsSlug]!,
      adapter.globals,
    ]) {
      await model.collection.dropIndexes().catch((error: unknown) => {
        if (!(error instanceof Error && 'code' in error && error.code === 26)) {
          throw error
        }
      })
    }
  })

  test('should replace a legacy constraint and preserve unrelated unique and lookup indexes', async ({
    payload,
  }) => {
    const model = (payload.db as MongooseAdapter).collections[pagesSlug]!

    await seedLegacyPage({ payload })
    await model.collection.createIndex(
      { externalID: 1 },
      { name: 'custom_unique', unique: true, sparse: true },
    )
    await model.collection.createIndex({ title: -1 }, { name: 'custom_lookup' })
    await migrateBranching({ payload })

    const indexes = await model.collection.indexes()

    expect(indexes.map(({ name }) => name)).toEqual(
      expect.arrayContaining(['custom_unique', 'custom_lookup', 'slug_1__branch_1']),
    )
    expect(indexes.some(({ name }) => name === 'legacy_slug')).toBe(false)
    await expect(
      model.collection.insertOne({ slug: 'launch', _branch: 'campaign' }),
    ).resolves.toBeDefined()
    await expect(
      model.collection.insertOne({ slug: 'launch', _branch: 'main' }),
    ).rejects.toMatchObject({ code: 11000, keyPattern: { slug: 1, _branch: 1 } })
    await model.collection.insertOne({
      externalID: 'external',
      slug: 'one',
      _branch: 'external-one',
    })
    await expect(
      model.collection.insertOne({ externalID: 'external', slug: 'two', _branch: 'external-two' }),
    ).rejects.toMatchObject({ code: 11000, keyPattern: { externalID: 1 } })
  })

  test('should preserve custom partial, sparse compound, collation, and hidden constraints on matching keys', async ({
    payload,
  }) => {
    const model = (payload.db as MongooseAdapter).collections[pagesSlug]!

    await model.collection.createIndex(
      { slug: 1 },
      {
        name: 'custom_partial',
        unique: true,
        partialFilterExpression: { title: { $exists: true } },
      },
    )
    await model.collection.createIndex(
      { 'code.en': 1, 'code.de': 1, region: 1 },
      { name: 'custom_sparse', unique: true, sparse: true },
    )
    await model.collection.createIndex(
      { slug: 1 },
      { name: 'custom_collation', unique: true, collation: { locale: 'en', strength: 2 } },
    )
    await model.collection.createIndex(
      { 'localizedSlug.en': 1 },
      { name: 'custom_hidden', unique: true, hidden: true },
    )
    await migrateBranching({ payload })

    expect((await model.collection.indexes()).map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        'custom_partial',
        'custom_sparse',
        'custom_collation',
        'custom_hidden',
      ]),
    )
  })

  test('should replace localized field and compound constraints after creating all locale indexes', async ({
    payload,
  }) => {
    const model = (payload.db as MongooseAdapter).collections[pagesSlug]!

    await model.collection.insertOne({
      localizedSlug: { en: 'launch', de: 'start' },
      code: { en: 'A', de: 'B' },
      region: 'eu',
    })
    await model.collection.createIndex(
      { 'localizedSlug.en': 1 },
      { name: 'legacy_localized_en', unique: true, sparse: true },
    )
    await model.collection.createIndex(
      { 'localizedSlug.de': 1 },
      { name: 'legacy_localized_de', unique: true, sparse: true },
    )
    await model.collection.createIndex(
      { 'code.en': 1, 'code.de': 1, region: 1 },
      { name: 'legacy_localized_compound', unique: true },
    )
    await migrateBranching({ payload })

    expect((await model.collection.indexes()).some(({ name }) => name?.startsWith('legacy_'))).toBe(
      false,
    )
    await expect(
      model.collection.insertOne({
        localizedSlug: { en: 'launch', de: 'start' },
        code: { en: 'A', de: 'B' },
        region: 'eu',
        _branch: 'campaign',
      }),
    ).resolves.toBeDefined()
    await expect(
      model.collection.insertOne({ localizedSlug: { en: 'launch' }, _branch: 'campaign' }),
    ).rejects.toMatchObject({ code: 11000, keyPattern: { 'localizedSlug.en': 1, _branch: 1 } })
    await expect(
      model.collection.insertOne({
        code: { en: 'A', de: 'other' },
        region: 'eu',
        _branch: 'campaign',
      }),
    ).rejects.toMatchObject({ code: 11000, keyPattern: { 'code.en': 1, region: 1, _branch: 1 } })
  })

  test('should replace the upload filename constraint', async ({ payload }) => {
    const model = (payload.db as MongooseAdapter).collections[uploadsSlug]!

    await model.collection.insertOne({ filename: 'image.png' })
    await model.collection.createIndex({ filename: 1 }, { name: 'legacy_filename', unique: true })
    await migrateBranching({ payload })

    await expect(
      model.collection.insertOne({ filename: 'image.png', _branch: 'campaign' }),
    ).resolves.toBeDefined()
    await expect(
      model.collection.insertOne({ filename: 'image.png', _branch: 'main' }),
    ).rejects.toMatchObject({ code: 11000, keyPattern: { filename: 1, _branch: 1 } })
  })

  test('should backfill content, versions, and globals and create indexes with autoIndex disabled', async ({
    payload,
  }) => {
    const adapter = payload.db as MongooseAdapter

    expect(adapter.connectOptions?.autoIndex).toBe(false)
    expect(adapter.ensureIndexes).toBe(false)
    await adapter.collections[pagesSlug]!.collection.insertOne({ title: 'legacy' })
    await adapter.versions[pagesSlug]!.collection.insertOne({
      version: { title: 'legacy' },
      _branch: null,
    })
    await adapter.globals.collection.insertOne({ globalType: settingsSlug })
    await adapter.versions[settingsSlug]!.collection.insertOne({ version: {}, _branch: null })
    await migrateBranching({ payload })

    expect(
      await adapter.collections[pagesSlug]!.collection.findOne({ title: 'legacy' }),
    ).toMatchObject({ _branch: 'main' })
    expect(
      await adapter.versions[pagesSlug]!.collection.findOne({ 'version.title': 'legacy' }),
    ).toMatchObject({ _branch: 'main' })
    expect(await adapter.versions[settingsSlug]!.collection.findOne({})).toMatchObject({
      _branch: 'main',
    })
    expect(await adapter.globals.collection.findOne({ globalType: settingsSlug })).toMatchObject({
      _branch: 'main',
    })
    expect(
      (await adapter.collections[pagesSlug]!.collection.indexes()).some(
        ({ name }) => name === 'slug_1__branch_1',
      ),
    ).toBe(true)
    expect(
      (await adapter.globals.collection.indexes()).some(({ key, unique }) => key._branch && unique),
    ).toBe(true)
  })

  test('should keep all legacy constraints if creation fails in a later collection and succeed on retry', async ({
    payload,
  }) => {
    const adapter = payload.db as MongooseAdapter
    const uploads = adapter.collections[uploadsSlug]!

    await seedLegacyPage({ payload })
    await uploads.collection.insertMany([
      { filename: 'duplicate.png' },
      { filename: 'duplicate.png' },
    ])
    await expect(migrateBranching({ payload })).rejects.toMatchObject({ code: 11000 })
    expect(
      (await adapter.collections[pagesSlug]!.collection.indexes()).some(
        ({ name }) => name === 'legacy_slug',
      ),
    ).toBe(true)
    await uploads.collection.deleteOne({ filename: 'duplicate.png' })
    await migrateBranching({ payload })

    expect(
      (await adapter.collections[pagesSlug]!.collection.indexes()).some(
        ({ name }) => name === 'legacy_slug',
      ),
    ).toBe(false)
  })

  test('should preserve indexes on shared globals and version collections', async ({ payload }) => {
    const adapter = payload.db as MongooseAdapter

    for (const model of [
      adapter.globals,
      adapter.versions[pagesSlug]!,
      adapter.versions[settingsSlug]!,
    ]) {
      await model.collection.createIndex(
        { marker: 1 },
        { name: 'custom_marker', unique: true, sparse: true },
      )
    }

    await migrateBranching({ payload })

    for (const model of [
      adapter.globals,
      adapter.versions[pagesSlug]!,
      adapter.versions[settingsSlug]!,
    ]) {
      expect((await model.collection.indexes()).some(({ name }) => name === 'custom_marker')).toBe(
        true,
      )
    }
  })

  test('should leave legacy constraints intact when the branch backfill fails', async ({
    payload,
  }) => {
    const adapter = payload.db as MongooseAdapter
    const pages = adapter.collections[pagesSlug]!
    const uploads = adapter.collections[uploadsSlug]!

    await pages.collection.insertMany([
      { slug: 'duplicate', _branch: 'main' },
      { slug: 'duplicate' },
    ])
    await pages.collection.createIndex({ slug: 1, _branch: 1 }, { unique: true })
    await uploads.collection.createIndex({ filename: 1 }, { name: 'legacy_filename', unique: true })
    await expect(migrateBranching({ payload })).rejects.toMatchObject({ code: 11000 })

    expect(
      (await uploads.collection.indexes()).some(({ name }) => name === 'legacy_filename'),
    ).toBe(true)
  })

  test('should preserve a conflicting index name instead of dropping it to create a replacement', async ({
    payload,
  }) => {
    const model = (payload.db as MongooseAdapter).collections[pagesSlug]!

    await seedLegacyPage({ payload })
    await model.collection.createIndex({ title: 1 }, { name: 'slug_1__branch_1' })
    await expect(migrateBranching({ payload })).rejects.toMatchObject({ code: 86 })

    expect(
      (await model.collection.indexes()).find(({ name }) => name === 'slug_1__branch_1')?.key,
    ).toEqual({ title: 1 })
    expect((await model.collection.indexes()).some(({ name }) => name === 'legacy_slug')).toBe(true)
  })

  test('should resume after a drop failure and support rerunning a completed migration', async ({
    payload,
  }) => {
    const model = (payload.db as MongooseAdapter).collections[pagesSlug]!

    await seedLegacyPage({ payload })
    await model.collection.createIndex(
      { 'localizedSlug.en': 1 },
      { name: 'legacy_localized', unique: true, sparse: true },
    )
    const dropIndex = model.collection.dropIndex.bind(model.collection)
    const drop = vi
      .spyOn(model.collection, 'dropIndex')
      .mockImplementationOnce((name) => dropIndex(name))
      .mockRejectedValueOnce(new Error('drop unavailable'))

    await expect(migrateBranching({ payload })).rejects.toThrow('drop unavailable')
    expect((await model.collection.indexes()).some(({ name }) => name === 'legacy_slug')).toBe(
      false,
    )
    expect((await model.collection.indexes()).some(({ name }) => name === 'legacy_localized')).toBe(
      true,
    )
    expect((await model.collection.indexes()).some(({ name }) => name === 'slug_1__branch_1')).toBe(
      true,
    )
    drop.mockRestore()
    await migrateBranching({ payload })
    await migrateBranching({ payload })

    expect((await model.collection.indexes()).some(({ name }) => name === 'legacy_slug')).toBe(
      false,
    )
  })
})

const seedLegacyPage = async ({ payload }: { payload: Payload }) => {
  const model = (payload.db as MongooseAdapter).collections[pagesSlug]!

  await model.collection.insertOne({ slug: 'launch' })
  await model.collection.createIndex(
    { slug: 1 },
    { name: 'legacy_slug', unique: true, sparse: true },
  )
}
