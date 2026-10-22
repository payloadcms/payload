import type { CollationOptions } from 'mongodb'

import mongoose from 'mongoose'
import { afterEach, describe, expect, test } from 'vitest'

import type { MongooseAdapter } from '../index.js'

import { buildGlobalModel } from './buildGlobalModel.js'
import { createMongoSchemaBuildContext } from './schemaBuildContext.js'

const connections: mongoose.Connection[] = []

afterEach(async () => {
  await Promise.all(connections.splice(0).map((connection) => connection.destroy()))
})

describe('Canonical global geospatial query indexes', () => {
  test('should retain canonical unique declarations under configured collation', () => {
    const indexes = createIndexes({
      collation: { strength: 2 },
      isLocalized: false,
      isUnique: true,
    })

    expect(indexes).toEqual([[{ location: '2dsphere' }, { unique: true, sparse: true }]])
  })

  test('should retain ten canonical localized sphere declarations without a locale cross product', () => {
    for (const collation of [
      undefined,
      { locale: 'simple' },
      { strength: 2 },
      { locale: 'de', strength: 2 },
    ]) {
      const indexes = createIndexes({ collation, isLocalized: true, isUnique: false })

      expect(indexes).toHaveLength(10)
      for (const [keys, options] of indexes) {
        expect(Object.values(keys)).toEqual(['2dsphere'])
        expect(options).toEqual({ partialFilterExpression: { globalType: 'settings' } })
      }
    }
  })
})

const createIndexes = ({
  collation,
  isLocalized,
  isUnique,
}: {
  collation?: CollationOptions
  isLocalized: boolean
  isUnique: boolean
}) => {
  const instance = new mongoose.Mongoose({ createInitialConnection: false })
  const connection = instance.createConnection()
  const localeCodes = ['en', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'sv', 'pl', 'fi']

  connections.push(connection)
  const adapter = {
    collation,
    connection,
    payload: {
      config: {
        globals: [
          {
            slug: 'settings',
            fields: [{ name: 'location', type: 'point', localized: isLocalized, unique: isUnique }],
          },
        ],
        localization: { localeCodes, locales: localeCodes.map((code) => ({ code })) },
      },
      db: {},
    },
  } as unknown as MongooseAdapter
  const model = buildGlobalModel({
    adapter,
    schemaBuildContext: createMongoSchemaBuildContext({ connection }),
  })!

  return model.discriminators!.settings!.schema.indexes()
}
