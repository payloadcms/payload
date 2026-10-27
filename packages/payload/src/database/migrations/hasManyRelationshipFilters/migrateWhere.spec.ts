import type { SanitizedConfig } from '../../../config/types.js'
import type { Field } from '../../../fields/config/types.js'
import type { Where } from '../../../types/index.js'

import { describe, expect, it } from 'vitest'

import { flattenAllFields } from '../../../utilities/flattenAllFields.js'
import { migrateWhere } from './migrateWhere.js'

const fields = flattenAllFields({
  fields: [
    { name: 'related', type: 'relationship', hasMany: true, relationTo: 'pages' },
    { name: 'upload', type: 'upload', hasMany: true, relationTo: 'media' },
    { name: 'single', type: 'relationship', relationTo: 'pages' },
    { name: 'poly', type: 'relationship', hasMany: true, relationTo: ['pages', 'posts'] },
    { name: 'polyUpload', type: 'upload', hasMany: true, relationTo: ['media', 'videos'] },
    { name: 'text', type: 'text', hasMany: true },
    { name: 'json', type: 'json' },
    {
      name: 'group',
      type: 'group',
      fields: [{ name: 'related', type: 'relationship', hasMany: true, relationTo: 'pages' }],
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'named',
          fields: [{ name: 'related', type: 'relationship', hasMany: true, relationTo: 'pages' }],
        },
      ],
    },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'links',
          fields: [{ name: 'related', type: 'relationship', hasMany: true, relationTo: 'pages' }],
        },
      ],
    },
  ] satisfies Field[],
})

describe('migrateWhere for hasMany relationship filters', () => {
  it.each([
    ['equals', 'in'],
    ['not_equals', 'not_in'],
  ])('should migrate %s to %s without losing selected IDs', (previous, next) => {
    const where: Where = { related: { [previous]: ['one', 2, 'three'] } }

    expect(migrateWhere({ fields, where })).toEqual({ related: { [next]: ['one', 2, 'three'] } })
    expect(where).toEqual({ related: { [previous]: ['one', 2, 'three'] } })
  })

  it('should wrap a scalar ID without converting its type', () => {
    expect(migrateWhere({ fields, where: { related: { not_equals: 0 } } })).toEqual({
      related: { not_in: [0] },
    })
  })

  it('should migrate upload fields', () => {
    expect(migrateWhere({ fields, where: { upload: { equals: ['image'] } } })).toEqual({
      upload: { in: ['image'] },
    })
  })

  it('should traverse boolean groups and nested schema paths', () => {
    const where: Where = {
      or: [
        {
          and: [{ 'group.related': { equals: ['a'] } }, { 'named.related': { not_equals: ['b'] } }],
        },
        { 'blocks.links.related': { equals: ['c'] } },
      ],
    }

    expect(migrateWhere({ fields, where })).toEqual({
      or: [
        { and: [{ 'group.related': { in: ['a'] } }, { 'named.related': { not_in: ['b'] } }] },
        { 'blocks.links.related': { in: ['c'] } },
      ],
    })
  })

  it('should resolve relationship paths used by virtual relationship filters', () => {
    const config = {
      collections: [
        {
          slug: 'pages',
          flattenedFields: flattenAllFields({
            fields: [
              { name: 'nestedRelated', type: 'relationship', hasMany: true, relationTo: 'posts' },
            ],
          }),
        },
      ],
    } as SanitizedConfig
    const where: Where = { 'single.nestedRelated': { not_equals: ['a', 'b'] } }

    expect(migrateWhere({ config, fields, where })).toEqual({
      'single.nestedRelated': { not_in: ['a', 'b'] },
    })
  })

  it('should leave polymorphic, single-value, unknown and unrelated fields intact', () => {
    const where: Where = {
      poly: { equals: [{ relationTo: 'pages', value: 'a' }] },
      polyUpload: { not_equals: [{ relationTo: 'media', value: 'b' }] },
      single: { equals: 'c' },
      text: { equals: ['d'] },
      missing: { equals: ['e'] },
      json: { equals: { related: { equals: ['f'] } } },
    }

    expect(migrateWhere({ fields, where })).toBe(where)
  })

  it('should retain other constraints on a migrated field', () => {
    expect(
      migrateWhere({
        fields,
        where: { related: { equals: ['a'], exists: true, not_equals: ['b'] } },
      }),
    ).toEqual({ related: { in: ['a'], exists: true, not_in: ['b'] } })
  })

  it('should preserve empty arrays and null values', () => {
    expect(migrateWhere({ fields, where: { related: { equals: [], not_equals: null } } })).toEqual({
      related: { in: [], not_in: [null] },
    })
  })

  it.each([
    ['equals', 'in'],
    ['not_equals', 'not_in'],
  ])('should refuse to overwrite an existing %s/%s constraint', (previous, next) => {
    expect(() =>
      migrateWhere({ fields, where: { related: { [previous]: ['a'], [next]: ['b'] } } }),
    ).toThrow(/related/)
  })

  it('should be idempotent', () => {
    const migrated = migrateWhere({ fields, where: { related: { not_equals: ['a', 'b'] } } })

    expect(migrateWhere({ fields, where: migrated })).toBe(migrated)
  })
})
