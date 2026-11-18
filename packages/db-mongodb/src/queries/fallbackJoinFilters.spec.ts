import { Types } from 'mongoose'
import { expect, it } from 'vitest'

import { resolveWhereForCollection } from '../utilities/resolveWhereForCollection.js'

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
