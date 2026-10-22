import { describe, expect, it } from 'vitest'

import type { PayloadRequest } from '../../../types/index.js'

import { encodeBranchProjectionID } from './branchProjectionCodec.js'
import {
  collectBranchQueryLocales,
  compileBranchProjectionSort,
  compileBranchProjectionWhere,
} from './compileBranchProjectionWhere.js'

const setup = () => {
  const fields = [
    { name: 'id', type: 'number' },
    { name: 'title', type: 'text', localized: true },
    { name: 'fr', type: 'text' },
    { name: 'metadata', type: 'json' },
    { name: 'related', type: 'relationship', relationTo: 'articles', hasMany: true },
    { name: 'poly', type: 'relationship', relationTo: ['articles', 'ordinary'], hasMany: true },
    { name: 'ordinary', type: 'relationship', relationTo: 'ordinary' },
    { name: 'details', type: 'group', flattenedFields: [{ name: 'id', type: 'text' }] },
    { name: 'rows', type: 'array', flattenedFields: [{ name: 'id', type: 'text' }] },
  ]
  const req = {
    payload: {
      config: { localization: { localeCodes: ['en', 'fr'] } },
      collections: {
        articles: {
          config: {
            slug: 'articles',
            timestamps: false,
            flattenedFields: fields,
            custom: { branchQueryStorage: { projection: 'cache' } },
          },
        },
        ordinary: {
          config: { slug: 'ordinary', flattenedFields: [{ name: 'id', type: 'number' }] },
        },
      },
    },
  } as unknown as PayloadRequest

  return { branchID: 'drafts', collection: 'articles', req }
}

describe('Logical branch predicate compilation', () => {
  it('should reject an ordinary collection globalType path even with a stray global source marker', () => {
    const args = setup()
    args.req.payload.db = { name: 'mongoose' } as PayloadRequest['payload']['db']
    args.req.payload.globals = {
      config: [{ slug: 'settings', fields: [], flattenedFields: [] }],
    } as unknown as PayloadRequest['payload']['globals']
    const config = args.req.payload.collections.ordinary!.config
    config.custom = { branchQueryGlobalSource: 'settings' }
    expect(() =>
      compileBranchProjectionWhere({
        ...args,
        collection: 'ordinary',
        where: { globalType: { equals: 'settings' } },
      }),
    ).toThrow('Unknown branch query field')
  })

  it('should preserve has-many exact array equality while encoding only declared cache references', () => {
    const args = setup()
    const values = [1, 1.5, 2].map((logicalID) =>
      encodeBranchProjectionID({ branchID: args.branchID, logicalID }),
    )
    expect(
      compileBranchProjectionWhere({ ...args, where: { related: { equals: [1, 1.5, 2] } } }),
    ).toEqual({ related: { equals: values } })
    expect(
      compileBranchProjectionWhere({ ...args, where: { related: { not_equals: [1, 2] } } }),
    ).toEqual({ related: { not_equals: [values[0], values[2]] } })
  })

  it('should preserve polymorphic literal and literal-array operator shapes', () => {
    const args = setup()
    const literal = { relationTo: 'articles', value: 1 }
    const encoded = {
      relationTo: 'cache',
      value: encodeBranchProjectionID({ branchID: args.branchID, logicalID: 1 }),
    }
    expect(compileBranchProjectionWhere({ ...args, where: { poly: { equals: literal } } })).toEqual(
      { poly: { equals: encoded } },
    )
    expect(
      compileBranchProjectionWhere({
        ...args,
        where: { poly: { equals: [literal, { relationTo: 'ordinary', value: 4 }] } },
      }),
    ).toEqual({ poly: { equals: [encoded, { relationTo: 'ordinary', value: 4 }] } })
  })

  it('should route range/sort/distinct paths to actual typed logical ID columns', () => {
    const args = setup()
    expect(
      compileBranchProjectionWhere({
        ...args,
        where: { related: { greater_than: 1 }, 'poly.value': { less_than: 10 }, id: { equals: 1 } },
      }),
    ).toEqual({
      'related._branchProjection.logicalID': { greater_than: 1 },
      'poly.value': { less_than: 10 },
      '_branchProjection.logicalID': { equals: 1 },
    })
    expect(
      compileBranchProjectionSort({ ...args, sort: ['related', '-poly.value', 'ordinary.id'] }),
    ).toEqual([
      'related._branchProjection.logicalID',
      '-poly.value',
      'ordinary.id',
      '_branchProjection.logicalID',
    ])
  })

  it('should discover only schema-qualified locales in predicates, access expressions and sorts', () => {
    const args = setup()
    expect(
      collectBranchQueryLocales({
        ...args,
        where: { or: [{ fr: { equals: 'shared' } }, { title: { equals: 'word.fr' } }] },
        sort: 'fr',
      }),
    ).toEqual([])
    expect(
      collectBranchQueryLocales({
        ...args,
        where: { 'related.title.fr': { equals: 'French' } },
        sort: 'title.en',
      }),
    ).toEqual(['fr', 'en'])
  })

  it('should preserve opaque JSON keys that happen to use the private schema namespace', () => {
    const args = setup()
    const where = { 'metadata._branchProjection.title': { equals: 'opaque' } }
    expect(compileBranchProjectionWhere({ ...args, where })).toEqual(where)
    expect(() =>
      compileBranchProjectionWhere({
        ...args,
        where: { 'rows._branchProjection.logicalID': { equals: 1 } },
      }),
    ).toThrow('private')
  })

  it('should distinguish user group IDs from private row/document identities and explicit locales', () => {
    const args = setup()
    expect(
      compileBranchProjectionWhere({
        ...args,
        where: {
          'details.id': { equals: 'group' },
          'rows.id': { equals: 'row' },
          'title.fr': { equals: 'Bonjour' },
        },
      }),
    ).toEqual({
      'details.id': { equals: 'group' },
      'rows._branchProjection.logicalID': { equals: 'row' },
      'title.fr': { equals: 'Bonjour' },
    })
    expect(() =>
      compileBranchProjectionWhere({
        ...args,
        where: { '_branchProjection.logicalID': { equals: 1 } },
      }),
    ).toThrow('private')
  })
})
