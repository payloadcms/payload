import { describe, expect, it } from 'vitest'

import { getBranchEntityKey } from '../compareBranchEntities.js'
import { getBranchKey, getBranchStorageKey } from './branchStorage.js'
import { registerBranchStorage } from './registerBranchStorage.js'

describe('branch storage index keys', () => {
  it('should retain typed and unambiguous coordinate boundaries', () => {
    const keys = [
      [1, 'staging', 'locale:en'],
      ['1', 'staging', 'locale:en'],
      [null, '1:staging', 'locale:en'],
      [null, '1', 'staging:locale:en'],
    ].map((coordinates) => getBranchStorageKey({ coordinates }))

    expect(new Set(keys).size).toBe(keys.length)
  })

  it('should keep internal unique indexes fixed width for existing wide identities', () => {
    expect(
      getBranchStorageKey({ coordinates: ['x'.repeat(2640), 'staging', 'shared'] }),
    ).toHaveLength(64)
    expect(getBranchStorageKey({ coordinates: [123, 'root'.repeat(1000)] })).toHaveLength(64)
  })
  it('should keep wide identity coordinates out of compound unique indexes', () => {
    const registered = registerBranchStorage({
      collections: [
        {
          slug: 'articles',
          fields: [{ name: 'id', type: 'text', required: true }],
          versions: { drafts: true },
        },
      ],
      globals: [],
      versionIDType: 'text',
    })
    const heads = registered.collections.find(({ slug }) => slug === 'collection-articles-heads')!
    const pins = registered.collections.find(({ slug }) => slug === 'collection-articles-pins')!
    const identities = registered.collections.find(
      ({ slug }) => slug === 'collection-articles-identities',
    )!

    expect(heads.indexes?.filter(({ unique }) => unique)).toEqual([
      { fields: ['coordinateKey'], unique: true },
    ])
    expect(pins.indexes?.filter(({ unique }) => unique)).toEqual([
      { fields: ['referenceKey'], unique: true },
    ])
    expect(identities.indexes?.filter(({ unique }) => unique)).toEqual([
      { fields: ['parent'], unique: true },
    ])
  })
  it('should preserve finite fractional logical identities independently of version generations', () => {
    expect(getBranchKey({ branchID: 1.5 })).toBe('number:1.5')
    expect(
      getBranchEntityKey({ entity: { type: 'collection', collection: 'articles', id: 1.5 } }),
    ).toBe('["collection","articles",1.5]')
    expect(
      getBranchEntityKey({ entity: { type: 'collection', collection: 'articles', id: 1.5 } }),
    ).not.toBe(
      getBranchEntityKey({ entity: { type: 'collection', collection: 'articles', id: '1.5' } }),
    )
    expect(() => getBranchKey({ branchID: Infinity })).toThrow()
    expect(() =>
      getBranchEntityKey({ entity: { type: 'collection', collection: 'articles', id: NaN } }),
    ).toThrow()
  })
})
