import { describe, expect, it } from 'vitest'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'

import { buildVersionCollectionFields } from './buildCollectionFields.js'

const makeCollection = (slug: string, drafts = true): SanitizedCollectionConfig =>
  ({
    slug,
    fields: [
      { name: 'id', type: 'text' },
      { name: 'title', type: 'text' },
    ],
    flattenedFields: [
      { name: 'id', type: 'text' },
      { name: 'title', type: 'text' },
    ],
    versions: { drafts },
  }) as unknown as SanitizedCollectionConfig

const config = { localization: false } as unknown as SanitizedConfig

describe('buildVersionCollectionFields', () => {
  it('returns a referentially stable array across calls for the same collection', () => {
    const collection = makeCollection('posts')
    const first = buildVersionCollectionFields(config, collection, true)
    const second = buildVersionCollectionFields(config, collection, true)
    // Same reference: the schema is built once and memoized, so identity-keyed
    // downstream caches (flattenedFieldsCache) hit instead of growing per call.
    expect(second).toBe(first)
  })

  it('caches flattened and unflattened variants separately', () => {
    const collection = makeCollection('pages')
    const flattened = buildVersionCollectionFields(config, collection, true)
    const unflattened = buildVersionCollectionFields(config, collection, false)
    expect(flattened).not.toBe(unflattened)
    expect(buildVersionCollectionFields(config, collection, true)).toBe(flattened)
    expect(buildVersionCollectionFields(config, collection, false)).toBe(unflattened)
  })

  it('memoizes per collection (distinct references for distinct collections)', () => {
    const a = buildVersionCollectionFields(config, makeCollection('a'), true)
    const b = buildVersionCollectionFields(config, makeCollection('b'), true)
    expect(a).not.toBe(b)
  })

  it('still produces the expected version schema', () => {
    const fields = buildVersionCollectionFields(config, makeCollection('shape'), true)
    const names = fields.map((field) => ('name' in field ? field.name : undefined))
    expect(names).toEqual(expect.arrayContaining(['parent', 'version', 'createdAt', 'updatedAt', 'latest']))
    const version = fields.find((field) => 'name' in field && field.name === 'version') as {
      fields: { name?: string }[]
    }
    // the `version` group mirrors the collection fields but drops the base `id`
    expect(version.fields.some((field) => field.name === 'id')).toBe(false)
    expect(version.fields.some((field) => field.name === 'title')).toBe(true)
  })
})
