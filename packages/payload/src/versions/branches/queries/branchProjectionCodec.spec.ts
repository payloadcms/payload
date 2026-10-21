import { describe, expect, it } from 'vitest'

import type { Field } from '../../../fields/config/types.js'

import {
  decodeBranchProjectionDocument,
  decodeBranchProjectionID,
  encodeBranchProjectionDocument,
  encodeBranchProjectionID,
} from './branchProjectionCodec.js'

const projectionSlugs = { articles: 'collection-articles-projection' }
const fields: Field[] = [
  { name: 'related', type: 'relationship', relationTo: 'articles', hasMany: true },
  { name: 'polymorphic', type: 'relationship', relationTo: ['articles', 'media'], hasMany: true },
  { name: 'localized', type: 'relationship', relationTo: 'articles', localized: true },
  {
    name: 'rows',
    type: 'array',
    fields: [
      { name: 'target', type: 'relationship', relationTo: 'articles' },
      {
        name: 'nested',
        type: 'array',
        fields: [
          { name: 'id', type: 'number' },
          { name: 'value', type: 'text' },
        ],
      },
    ],
  },
  {
    type: 'tabs',
    tabs: [
      {
        name: 'details',
        localized: true,
        fields: [{ name: 'target', type: 'relationship', relationTo: 'articles' }],
      },
      {
        label: 'Transparent',
        fields: [{ name: 'plain', type: 'relationship', relationTo: 'media' }],
      },
    ],
  },
  {
    name: 'content',
    type: 'blocks',
    blocks: [
      {
        slug: 'callout',
        fields: [
          { name: 'id', type: 'number' },
          { name: 'target', type: 'relationship', relationTo: 'articles' },
        ],
      },
    ],
  },
  { name: 'opaque', type: 'json' },
]

describe('Private branch projection codec', () => {
  it('should treat negative numeric zero as the existing zero identity', () => {
    expect(encodeBranchProjectionID({ branchID: 'drafts', logicalID: -0 })).toBe(
      encodeBranchProjectionID({ branchID: 'drafts', logicalID: 0 }),
    )
  })

  it('should treat localized descendants as values inside an already localized container', () => {
    const nestedFields: Field[] = [
      {
        name: 'details',
        type: 'group',
        localized: true,
        fields: [
          {
            name: 'target',
            type: 'relationship',
            localized: true,
            relationTo: ['articles', 'media'],
          },
          {
            name: 'nested',
            type: 'group',
            localized: true,
            fields: [{ name: 'target', type: 'relationship', relationTo: 'articles' }],
          },
        ],
      },
    ]
    const data = {
      id: 1,
      details: {
        en: { target: { relationTo: 'articles', value: 2 }, nested: { target: 3 } },
        fr: { target: { relationTo: 'media', value: 'm' }, nested: { target: 4 } },
      },
    }
    const options = { branchID: 'drafts', fields: nestedFields, projectionSlugs }
    const encoded = encodeBranchProjectionDocument({ ...options, data })

    expect(encoded.details).toEqual({
      en: {
        target: {
          relationTo: projectionSlugs.articles,
          value: encodeBranchProjectionID({ branchID: 'drafts', logicalID: 2 }),
        },
        nested: { target: encodeBranchProjectionID({ branchID: 'drafts', logicalID: 3 }) },
      },
      fr: {
        target: { relationTo: 'media', value: 'm' },
        nested: { target: encodeBranchProjectionID({ branchID: 'drafts', logicalID: 4 }) },
      },
    })
    expect(decodeBranchProjectionDocument({ ...options, data: encoded })).toEqual(data)
  })
  it('should bound physical keys independently of valid logical ID lengths and reject corrupt decoding metadata', () => {
    const logicalID = 'x'.repeat(2690)
    const options = { branchID: 'drafts', fields, projectionSlugs }
    const data = { id: logicalID, related: [logicalID] }
    const encoded = encodeBranchProjectionDocument({ ...options, data })

    expect(encoded.id).toHaveLength(47)
    expect((encoded.related as string[])[0]).toHaveLength(47)
    expect(decodeBranchProjectionDocument({ ...options, data: encoded })).toEqual(data)
    ;(encoded._branchProjection as Record<string, unknown>).relationships = {}
    expect(() => decodeBranchProjectionDocument({ ...options, data: encoded })).toThrow(
      'relationship metadata',
    )
  })

  it('should preserve typed IDs with delimiter and Unicode values injectively', () => {
    const identities = [1, '1', 'a:b|💡', 'bp1:W10', 1.5]
    const encoded = identities.flatMap((branchID) =>
      identities.map((logicalID) => encodeBranchProjectionID({ branchID, logicalID })),
    )

    expect(new Set(encoded).size).toBe(25)
    expect(decodeBranchProjectionID({ id: encoded[0]!, branchID: 1, logicalID: 1 })).toEqual({
      branchID: 1,
      logicalID: 1,
    })
    expect(
      decodeBranchProjectionID({
        id: encodeBranchProjectionID({ branchID: '💡', logicalID: '1' }),
        branchID: '💡',
        logicalID: '1',
      }),
    ).toEqual({ branchID: '💡', logicalID: '1' })
  })

  it('should reject malformed, noncanonical and invalid scalar identifiers', () => {
    for (const id of [
      '',
      'bp1:?',
      'bp1:W10=',
      'bp1:W10',
      'ordinary',
      'bp1:WyJkb2N1bWVudCIsMSxudWxsXQ',
    ]) {
      expect(() => decodeBranchProjectionID({ id, branchID: 1, logicalID: 1 })).toThrow()
    }
    for (const logicalID of [NaN, Infinity, '']) {
      expect(() => encodeBranchProjectionID({ branchID: 'drafts', logicalID })).toThrow()
    }
  })

  it('should round-trip nested locale content, typed row IDs and forward relationships without changing opaque JSON', () => {
    const data = {
      id: 8,
      related: [1, '1'],
      polymorphic: [
        { relationTo: 'articles', value: 1 },
        { relationTo: 'media', value: '1' },
      ],
      localized: { en: 2, fr: null },
      rows: [{ id: 'same', target: 3, nested: [{ id: 4, value: 'a' }] }],
      details: { en: { target: 5 }, fr: { target: 6 } },
      plain: 'ordinary-media',
      content: [{ id: 7, blockType: 'callout', target: 9 }],
      opaque: { id: 'same', relationTo: 'articles', value: 10 },
    }
    const encoded = encodeBranchProjectionDocument({
      branchID: 'drafts',
      data,
      fields,
      projectionSlugs,
    })
    const decoded = decodeBranchProjectionDocument({
      branchID: 'drafts',
      data: encoded,
      fields,
      projectionSlugs,
    })

    expect(decoded).toEqual(data)
    expect(encoded.related).toEqual(
      [1, '1'].map((logicalID) => encodeBranchProjectionID({ branchID: 'drafts', logicalID })),
    )
    expect(encoded.polymorphic).toEqual([
      {
        relationTo: 'collection-articles-projection',
        value: encodeBranchProjectionID({ branchID: 'drafts', logicalID: 1 }),
      },
      { relationTo: 'media', value: '1' },
    ])
    expect(encoded.opaque).toEqual(data.opaque)
    expect(data.rows[0]!.id).toBe('same')
    expect(encoded).not.toBe(data)
    expect(decoded).not.toHaveProperty('_branchProjection')
  })

  it('should isolate physical row IDs by branch, root document, typed row ID and nesting path', () => {
    const options = { fields, projectionSlugs }
    const documents = [
      encodeBranchProjectionDocument({
        ...options,
        branchID: 'drafts',
        data: { id: 1, rows: [{ id: '1' }] },
      }),
      encodeBranchProjectionDocument({
        ...options,
        branchID: 'staging',
        data: { id: 1, rows: [{ id: '1' }] },
      }),
      encodeBranchProjectionDocument({
        ...options,
        branchID: 'drafts',
        data: { id: 2, rows: [{ id: '1' }] },
      }),
      encodeBranchProjectionDocument({
        ...options,
        fields: [{ name: 'rows', type: 'array', fields: [{ name: 'id', type: 'number' }] }],
        branchID: 'drafts',
        data: { id: 1, rows: [{ id: 1 }] },
      }),
    ]
    const rowIDs = documents.flatMap(({ rows }) => (rows as { id: string }[]).map(({ id }) => id))

    expect(new Set(rowIDs).size).toBe(4)
  })

  it('should reject cross-branch relationship IDs and mismatched root metadata', () => {
    const options = { branchID: 'drafts', fields, projectionSlugs }
    const encoded = encodeBranchProjectionDocument({ ...options, data: { id: 1, related: [2] } })

    expect(() =>
      decodeBranchProjectionDocument({
        ...options,
        data: {
          ...encoded,
          related: [encodeBranchProjectionID({ branchID: 'staging', logicalID: 2 })],
        },
      }),
    ).toThrow('relationship metadata')
    expect(() =>
      decodeBranchProjectionDocument({ ...options, branchID: 'staging', data: encoded }),
    ).toThrow('private branch projection')
    expect(() =>
      decodeBranchProjectionDocument({
        ...options,
        data: { ...encoded, _branchProjection: { logicalID: 2 } },
      }),
    ).toThrow('private branch projection')
  })

  it('should reject duplicate, missing and transplanted row identities', () => {
    const options = { branchID: 'drafts', fields, projectionSlugs }

    expect(() =>
      encodeBranchProjectionDocument({
        ...options,
        data: { id: 1, rows: [{ id: 'a' }, { id: 'a' }] },
      }),
    ).toThrow('Duplicate')
    expect(() =>
      encodeBranchProjectionDocument({ ...options, data: { id: 1, rows: [{}] } }),
    ).toThrow('IDs')
    const encoded = encodeBranchProjectionDocument({
      ...options,
      data: { id: 1, rows: [{ id: 'a' }] },
    })
    const other = encodeBranchProjectionDocument({
      ...options,
      data: { id: 2, rows: [{ id: 'a' }] },
    })

    expect(() =>
      decodeBranchProjectionDocument({ ...options, data: { ...encoded, rows: other.rows } }),
    ).toThrow('row ID')
  })

  it('should fail closed on unsupported blocks and unpopulated-only relationship inputs', () => {
    const options = { branchID: 'drafts', fields, projectionSlugs }

    expect(() =>
      encodeBranchProjectionDocument({
        ...options,
        data: { id: 1, content: [{ id: 'a', blockType: 'unknown' }] },
      }),
    ).toThrow('Unknown block')
    expect(() =>
      encodeBranchProjectionDocument({ ...options, data: { id: 1, related: [{ id: 2 }] } }),
    ).toThrow('IDs')
    expect(() =>
      encodeBranchProjectionDocument({
        ...options,
        data: { id: 1, polymorphic: [{ relationTo: 'unknown', value: 2 }] },
      }),
    ).toThrow('target')
    expect(() =>
      encodeBranchProjectionDocument({ ...options, data: { id: 1, _branchProjection: {} } }),
    ).toThrow('collides')
  })
  it('should persist typed logical row IDs for query predicates and validate their metadata before decoding', () => {
    const options = { branchID: 'drafts', fields, projectionSlugs }
    const encoded = encodeBranchProjectionDocument({
      ...options,
      data: { id: 1, rows: [{ id: 'a', nested: [{ id: 2 }] }] },
    })
    const rows = encoded.rows as Record<string, unknown>[]
    const nested = rows[0]!.nested as Record<string, unknown>[]

    expect(rows[0]!._branchProjection).toEqual({ logicalID: 'a' })
    expect(nested[0]!._branchProjection).toEqual({ logicalID: 2 })
    nested[0]!._branchProjection = { logicalID: '2' }
    expect(() => decodeBranchProjectionDocument({ ...options, data: encoded })).toThrow('row ID')
    expect(() =>
      encodeBranchProjectionDocument({ ...options, data: { id: 1, rows: [{ id: 2 }] } }),
    ).toThrow('type')
    expect(() =>
      encodeBranchProjectionDocument({
        ...options,
        data: { id: 1, rows: [{ id: 'a', _branchProjection: {} }] },
      }),
    ).toThrow('collides')
  })
})
