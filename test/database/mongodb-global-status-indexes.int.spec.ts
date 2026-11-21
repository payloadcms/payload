import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { Payload, SanitizedGlobalConfig } from 'payload'

import mongoose from 'mongoose'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { expect } from 'vitest'

import { buildGlobalModel } from '../../packages/db-mongodb/src/models/buildGlobalModel.js'
import { createMongoSchemaBuildContext } from '../../packages/db-mongodb/src/models/schemaBuildContext.js'
import { test } from '../__helpers/int/vitest.js'

const mongoURL =
  process.env.MONGODB_URL ||
  process.env.DATABASE_URL ||
  'mongodb://payload:payload@localhost:27018/payload?authSource=admin&directConnection=true&replicaSet=rs0'
const connections = new Set<mongoose.Connection>()

const initializeModel = async ({
  databaseName,
  globals = 2,
  locales = [],
}: {
  databaseName: string
  globals?: number
  locales?: string[]
}) => {
  const connection = mongoose.createConnection()

  connections.add(connection)

  const payload = {
    config: {
      globals: Array.from({ length: globals }, (_, index) => ({
        slug: `status-global-${index}`,
        fields: [
          {
            name: '_status',
            type: 'select',
            index: true,
            localized: locales.length > 0,
            options: ['draft', 'published'],
          },
          { name: 'title', type: 'text', localized: locales.length > 0 },
        ],
        versions: { drafts: {} },
      })) as SanitizedGlobalConfig[],
      localization: locales.length
        ? {
            defaultLocale: locales[0],
            fallback: true,
            localeCodes: locales,
            locales: locales.map((code) => ({ code, label: code })),
          }
        : false,
    },
    db: { useBigIntForNumberIDs: false },
  } as unknown as Payload
  const model = buildGlobalModel({
    adapter: { connection, payload } as MongooseAdapter,
    schemaBuildContext: createMongoSchemaBuildContext({ connection }),
  })!

  await connection.openUri(mongoURL, {
    dbName: databaseName,
    serverSelectionTimeoutMS: 10000,
  })
  // Await every discriminator: a connected base model alone does not prove indexing succeeded.
  await Promise.all(Object.values(connection.models).map((compiledModel) => compiledModel.init()))

  return { connection, model }
}

const restartModel = async ({
  connection,
  ...args
}: { connection: mongoose.Connection } & Parameters<typeof initializeModel>[0]) => {
  await connection.close()
  connections.delete(connection)

  return initializeModel(args)
}

const getIndexes = async ({ model }: Awaited<ReturnType<typeof initializeModel>>) => {
  const indexes = await model.collection.listIndexes().toArray()

  return indexes.sort((first, second) => first.name!.localeCompare(second.name))
}

test.suite('MongoDB global status indexes', { db: (adapter) => adapter === 'mongodb' }, () => {
  test.afterEach(async () => {
    for (const connection of connections) {
      assert.match(connection.db!.databaseName, /^payload_global_status_[a-f0-9]{32}$/)
      await Promise.allSettled(Object.values(connection.models).map((model) => model.init()))
      await connection.db!.dropDatabase()
      await connection.close()
    }

    connections.clear()
  })

  test('should create one shared status index and preserve documents across restarts', async () => {
    const args = { databaseName: `payload_global_status_${randomUUID().replaceAll('-', '')}` }
    let database = await initializeModel(args)
    const indexes = await getIndexes(database)

    expect(indexes.map(({ key }) => key)).toEqual([{ _id: 1 }, { globalType: 1, _status: 1 }])
    expect(Object.keys(indexes[1]!.key)).toEqual(['globalType', '_status'])
    expect(indexes[1]).not.toHaveProperty('partialFilterExpression')
    expect(indexes[1]?.unique).not.toBe(true)

    await database.model.collection.insertMany([
      { globalType: 'status-global-0', _status: 'published', title: 'Alpha' },
      { globalType: 'status-global-1', _status: 'draft', title: 'Beta' },
    ])

    const documents = await database.model.collection.find().sort({ globalType: 1 }).toArray()

    for (let restart = 0; restart < 3; restart++) {
      database = await restartModel({ ...args, connection: database.connection })

      expect(await getIndexes(database)).toEqual(indexes)
      expect(await database.model.collection.find().sort({ globalType: 1 }).toArray()).toEqual(
        documents,
      )
    }
  })

  test.each([
    {
      documents: [
        {
          globalType: 'status-global-0',
          legacyOnly: 1,
          _status: 'published',
          title: 'Existing alpha',
        },
        { globalType: 'status-global-1', legacyOnly: 2, _status: 'draft', title: 'Existing beta' },
      ],
      label: 'scalar',
      locales: [],
      statusPaths: ['_status'],
    },
    {
      documents: [
        {
          globalType: 'status-global-0',
          legacyOnly: 1,
          _status: { en: 'published', de: 'draft' },
          title: { en: 'Existing alpha', de: 'Existing German alpha' },
        },
        {
          globalType: 'status-global-1',
          legacyOnly: 2,
          _status: { en: 'draft', de: 'published' },
          title: { en: 'Existing beta', de: 'Existing German beta' },
        },
      ],
      label: 'localized',
      locales: ['en', 'de'],
      statusPaths: ['_status.en', '_status.de'],
    },
  ])(
    'should preserve existing $label documents and legacy indexes across upgrades and restarts',
    async ({ documents, locales, statusPaths }) => {
      const args = {
        databaseName: `payload_global_status_${randomUUID().replaceAll('-', '')}`,
        locales,
      }
      const seedConnection = await mongoose
        .createConnection(mongoURL, { dbName: args.databaseName, serverSelectionTimeoutMS: 10000 })
        .asPromise()

      connections.add(seedConnection)

      const collection = seedConnection.collection('globals')

      for (const [index, statusPath] of statusPaths.entries()) {
        await collection.createIndex(
          { [statusPath]: 1 },
          { partialFilterExpression: { globalType: `status-global-${index}` } },
        )
      }

      await collection.createIndex({ legacyOnly: 1 }, { name: 'keep_legacy_custom', sparse: true })
      await collection.insertMany(documents)

      const originalDocuments = await collection.find().sort({ globalType: 1 }).toArray()
      const originalIndexes = await collection.listIndexes().toArray()
      let database = await initializeModel(args)
      const indexes = await getIndexes(database)

      expect(indexes).toHaveLength(originalIndexes.length + statusPaths.length)
      expect(indexes).toEqual(expect.arrayContaining(originalIndexes))

      for (let restart = 0; restart < 3; restart++) {
        database = await restartModel({ ...args, connection: database.connection })

        expect(await getIndexes(database)).toEqual(indexes)
        expect(await collection.find().sort({ globalType: 1 }).toArray()).toEqual(originalDocuments)
      }
    },
  )

  test('should preserve localized status values and shared indexes across restarts', async () => {
    const args = {
      databaseName: `payload_global_status_${randomUUID().replaceAll('-', '')}`,
      locales: ['en', 'de'],
    }
    let database = await initializeModel(args)
    const indexes = await getIndexes(database)

    expect(indexes).toHaveLength(3)

    for (const locale of args.locales) {
      const index = indexes.find(({ key }) => key[`_status.${locale}`] === 1)

      expect(Object.keys(index!.key)).toEqual(['globalType', `_status.${locale}`])
      expect(index).not.toHaveProperty('partialFilterExpression')
      expect(index?.unique).not.toBe(true)
    }

    await database.model.collection.insertOne({
      globalType: 'status-global-0',
      _status: { en: 'published', de: 'draft' },
      title: { en: 'Published English', de: 'German draft' },
    })

    const documents = await database.model.collection.find().toArray()

    for (let restart = 0; restart < 3; restart++) {
      database = await restartModel({ ...args, connection: database.connection })

      expect(await getIndexes(database)).toEqual(indexes)
      expect(await database.model.collection.find().toArray()).toEqual(documents)
    }
  })

  test('should create only one status index per locale for many globals', async () => {
    const locales = [
      'en',
      'de',
      'fr',
      'it',
      'es',
      'pt',
      'nl',
      'pl',
      'cs',
      'hu',
      'ro',
      'da',
      'sv',
      'no',
      'fi',
      'el',
      'tr',
      'ja',
      'ko',
      'id',
    ]
    const database = await initializeModel({
      databaseName: `payload_global_status_${randomUUID().replaceAll('-', '')}`,
      globals: 4,
      locales,
    })
    const indexes = await getIndexes(database)

    expect(indexes).toHaveLength(21)

    for (const locale of locales) {
      const index = indexes.find(({ key }) => key[`_status.${locale}`] === 1)

      expect(Object.keys(index!.key)).toEqual(['globalType', `_status.${locale}`])
    }
  })
})
