import type { CompoundIndex, Field, Payload } from 'payload'

import { flattenAllFields } from 'payload'
import { describe, expect, test } from 'vitest'

import { sanitizeCompoundIndexes } from '../../../payload/src/collections/config/sanitizeCompoundIndexes.js'
import { buildVersionCompoundIndexes } from '../../../payload/src/versions/buildVersionCompoundIndexes.js'
import { buildSchema } from './buildSchema.js'

const fields: Field[] = [
  { name: 'tenant', type: 'text' },
  { name: 'slug', type: 'text', localized: true },
  { name: 'gate', type: 'text', localized: true },
  { name: 'metadata', type: 'group', fields: [{ name: 'code', type: 'text' }] },
]
const flattenedFields = flattenAllFields({ fields })
const payload = {
  config: {
    localization: {
      defaultLocale: 'en',
      locales: [{ code: 'en' }, { code: 'de' }],
      localeCodes: ['en', 'de'],
    },
  },
  db: {},
} as unknown as Payload

const buildIndexes = ({
  disableUnique,
  index,
}: {
  disableUnique?: boolean
  index: CompoundIndex
}) =>
  buildSchema({
    buildSchemaOptions: { disableUnique },
    compoundIndexes: sanitizeCompoundIndexes({ fields: flattenedFields, indexes: [index] }),
    configFields: fields,
    flattenedFields,
    payload,
  }).indexes()

describe('MongoDB compound existence filters', () => {
  test('should build a partial index requiring every configured path', () => {
    expect(
      buildIndexes({
        index: {
          fields: ['tenant', 'metadata.code'],
          requireExists: ['tenant', 'metadata.code'],
          unique: true,
        },
      }),
    ).toContainEqual([
      { tenant: 1, 'metadata.code': 1 },
      expect.objectContaining({
        partialFilterExpression: { tenant: { $exists: true }, 'metadata.code': { $exists: true } },
        unique: true,
      }),
    ])
  })

  test('should build a separate matching partial index for each locale', () => {
    const indexes = buildIndexes({
      index: {
        fields: ['tenant', 'slug'],
        requireExists: ['slug'],
        unique: true,
      },
    })

    for (const locale of ['en', 'de']) {
      expect(indexes).toContainEqual([
        { tenant: 1, [`slug.${locale}`]: 1 },
        expect.objectContaining({
          partialFilterExpression: { [`slug.${locale}`]: { $exists: true } },
          unique: true,
        }),
      ])
    }
  })

  test('should give filter-only localized indexes distinct names', () => {
    const indexes = buildIndexes({
      index: {
        fields: ['tenant'],
        requireExists: ['gate'],
        unique: true,
      },
    })

    for (const locale of ['en', 'de']) {
      expect(indexes).toContainEqual([
        { tenant: 1 },
        expect.objectContaining({
          name: `tenant_${locale}_require_exists`,
          partialFilterExpression: { [`gate.${locale}`]: { $exists: true } },
        }),
      ])
    }
  })

  test('should preserve the existing localized compound index without requireExists', () => {
    expect(buildIndexes({ index: { fields: ['tenant', 'slug'], unique: true } })).toContainEqual([
      { tenant: 1, 'slug.en': 1, 'slug.de': 1 },
      expect.objectContaining({ unique: true }),
    ])
  })

  test('should not add a filter for an empty requireExists list', () => {
    const indexes = buildIndexes({ index: { fields: ['tenant'], requireExists: [], unique: true } })

    expect(indexes[0]?.[1]).not.toHaveProperty('partialFilterExpression')
  })

  test('should respect disableUnique while retaining the filter', () => {
    expect(
      buildIndexes({
        disableUnique: true,
        index: {
          fields: ['tenant'],
          requireExists: ['tenant'],
          unique: true,
        },
      }),
    ).toContainEqual([
      { tenant: 1 },
      expect.objectContaining({
        unique: false,
        partialFilterExpression: { tenant: { $exists: true } },
      }),
    ])
  })

  test('should prefix existence filters on version indexes and disable uniqueness', () => {
    const indexes = sanitizeCompoundIndexes({
      fields: flattenedFields,
      indexes: [
        {
          fields: ['tenant', 'slug'],
          requireExists: ['slug'],
          unique: true,
        },
      ],
    })

    expect(buildVersionCompoundIndexes({ indexes })[0]).toMatchObject({
      requireExists: [
        { localizedPath: 'version.slug.<locale>', path: 'version.slug', pathHasLocalized: true },
      ],
      unique: false,
    })
  })
})
