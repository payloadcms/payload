import type { Field, Payload, SanitizedGlobalConfig } from 'payload'

import mongoose from 'mongoose'
import { afterEach, describe, expect, it } from 'vitest'

import type { MongooseAdapter } from '../index.js'

import { buildGlobalModel } from './buildGlobalModel.js'
import { createMongoSchemaBuildContext } from './schemaBuildContext.js'

const connections: mongoose.Connection[] = []

const buildModel = ({
  fields = [],
  globals = 2,
  hasDrafts = true,
  isStatusIndexed = true,
  isStatusUnique = false,
  locales = [],
}: {
  fields?: Field[]
  globals?: number
  hasDrafts?: boolean
  isStatusIndexed?: boolean
  isStatusUnique?: boolean
  locales?: string[]
} = {}) => {
  const connection = mongoose.createConnection()

  connections.push(connection)

  const payload = {
    config: {
      globals: Array.from({ length: globals }, (_, index) => ({
        slug: `global-${index}`,
        fields: [
          {
            name: '_status',
            type: 'select',
            index: isStatusIndexed,
            localized: locales.length > 0,
            options: ['draft', 'published'],
            unique: isStatusUnique,
          },
          ...fields,
        ],
        versions: hasDrafts ? { drafts: {} } : false,
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

  return buildGlobalModel({
    adapter: { connection, payload } as MongooseAdapter,
    schemaBuildContext: createMongoSchemaBuildContext({ connection }),
  })!
}

afterEach(async () => {
  await Promise.all(connections.map((connection) => connection.close()))
  connections.length = 0
})

describe('global status indexes', () => {
  it('should share one nonunique compound index across draft globals', () => {
    const model = buildModel()

    expect(model.schema.indexes()).toEqual([
      [{ globalType: 1, _status: 1 }, expect.not.objectContaining({ unique: true })],
    ])
    expect(Object.keys(model.schema.indexes()[0]![0])).toEqual(['globalType', '_status'])

    for (const discriminator of Object.values(model.discriminators!)) {
      expect(discriminator.schema.indexes()).toEqual([])
    }
  })

  it('should keep the status index count independent of the number of globals', () => {
    const model = buildModel({ globals: 70 })

    expect(model.schema.indexes()).toHaveLength(1)
    expect(Object.keys(model.discriminators!)).toHaveLength(70)
  })

  it('should share one compound index per localized status path', () => {
    const model = buildModel({ globals: 4, locales: ['en', 'de', 'fr'] })

    expect(model.schema.indexes().map(([keys]) => keys)).toEqual([
      { globalType: 1, '_status.en': 1 },
      { globalType: 1, '_status.de': 1 },
      { globalType: 1, '_status.fr': 1 },
    ])

    for (const discriminator of Object.values(model.discriminators!)) {
      expect(discriminator.schema.indexes()).toEqual([])
    }
  })

  it('should preserve custom field indexes and uniqueness', () => {
    const model = buildModel({
      fields: [{ name: 'custom', type: 'text', unique: true }],
    })

    for (const discriminator of Object.values(model.discriminators!)) {
      expect(discriminator.schema.indexes()).toEqual([
        [{ custom: 1 }, expect.objectContaining({ sparse: true, unique: true })],
      ])
    }
  })

  it('should respect an explicitly disabled status index', () => {
    const model = buildModel({ isStatusIndexed: false })

    expect(model.schema.indexes()).toEqual([])
  })

  it('should preserve custom unique status indexes', () => {
    const model = buildModel({ isStatusUnique: true })

    expect(model.schema.indexes()).toEqual([])
    expect(model.discriminators!['global-0']!.schema.indexes()).toEqual([
      [{ _status: 1 }, expect.objectContaining({ unique: true })],
    ])
  })

  it('should not transform status fields on globals without drafts', () => {
    const model = buildModel({ hasDrafts: false })

    expect(model.schema.indexes()).toEqual([])
    expect(model.discriminators!['global-0']!.schema.indexes()).toEqual([
      [{ _status: 1 }, expect.any(Object)],
    ])
  })
})
