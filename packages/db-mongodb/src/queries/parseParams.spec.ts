import type { FlattenedField, Payload } from 'payload'

import { describe, expect, it } from 'vitest'

import { parseParams } from './parseParams.js'

const fields = [
  { name: 'title', type: 'text' },
  { name: 'count', type: 'number' },
  { name: 'owner', type: 'relationship', relationTo: ['users', 'teams'] },
] as FlattenedField[]

const payload = {
  collections: {},
  config: {},
  globals: {},
} as Payload

// The adapter matches a polymorphic value stored with either key order.
const ownerConditions = [
  { owner: { $eq: { relationTo: 'users', value: 'u1' } } },
  { owner: { $eq: { relationTo: 'users', value: 'u1' } } },
]

const parse = (where: Parameters<typeof parseParams>[0]['where']) =>
  parseParams({ fields, parentIsLocalized: false, payload, where })

describe('parseParams', () => {
  it('should keep a multi-operator path when a sibling and follows it', async () => {
    const result = await parse({
      and: [{ count: { equals: 1 } }],
      title: { equals: 'a', not_equals: 'b' },
    })
    const reordered = await parse({
      title: { equals: 'a', not_equals: 'b' },
      and: [{ count: { equals: 1 } }],
    })

    expect(reordered.$and).toEqual(expect.arrayContaining(result.$and as unknown[]))
    expect(reordered.$and).toHaveLength(3)
  })

  it('should keep a polymorphic relationship condition when a sibling or follows it', async () => {
    const result = await parse({
      owner: { equals: { relationTo: 'users', value: 'u1' } },
      or: [{ title: { equals: 'a' } }, { title: { equals: 'b' } }],
    })

    expect(result).toEqual({
      $and: [{ $or: [{ title: { $eq: 'a' } }, { title: { $eq: 'b' } }] }],
      $or: ownerConditions,
    })
  })

  it('should not merge a sibling or into a polymorphic relationship condition that follows it', async () => {
    const result = await parse({
      or: [{ title: { equals: 'a' } }, { title: { equals: 'b' } }],
      owner: { equals: { relationTo: 'users', value: 'u1' } },
    })

    expect(result).toEqual({
      $and: [{ $or: ownerConditions }],
      $or: [{ title: { $eq: 'a' } }, { title: { $eq: 'b' } }],
    })
  })
})
