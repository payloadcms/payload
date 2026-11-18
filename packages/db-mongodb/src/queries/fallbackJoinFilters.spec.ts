import type { FlattenedField, Payload } from 'payload'

import { Types } from 'mongoose'
import { expect, it } from 'vitest'

import { resolveWhereForCollection } from '../utilities/resolveWhereForCollection.js'
import { parseParams } from './parseParams.js'

it('rejects a malformed date in a fallback filter group', async () => {
  await expect(
    parseParams({
      fields: [{ name: 'expires', type: 'date' }] as FlattenedField[],
      parentIsLocalized: false,
      payload: { config: {} } as Payload,
      rejectUntranslatablePredicates: true,
      where: { and: [{ expires: { less_than: 'invalid date' } }] },
    }),
  ).rejects.toThrow('expires.less_than')
})

it('keeps only IDs compatible with the fallback target in an inclusion filter', () => {
  const objectID = new Types.ObjectId().toHexString()
  const idFilter = { id: { in: ['article-a', objectID] } }
  const args = { collectionSlug: 'articles', fieldNames: new Set<string>() }

  expect(
    resolveWhereForCollection({ ...args, usesObjectIDs: false, where: idFilter }),
  ).toMatchObject({ where: idFilter })
  expect(
    resolveWhereForCollection({ ...args, usesObjectIDs: true, where: idFilter }),
  ).toMatchObject({ where: { id: { in: [objectID] } } })
  expect(
    resolveWhereForCollection({
      ...args,
      usesObjectIDs: true,
      where: { id: { in: ['article-a'] } },
    }),
  ).toMatchObject({ where: { id: { in: [] } } })
})
