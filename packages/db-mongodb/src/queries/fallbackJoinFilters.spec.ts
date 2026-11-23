import { Types } from 'mongoose'
import { expect, it } from 'vitest'

import { resolveWhereForCollection } from '../utilities/resolveWhereForCollection.js'

it.each(['in', 'not_in'] as const)(
  'normalizes %s operands for the fallback target ID type',
  (operator) => {
    const objectID = new Types.ObjectId().toHexString()
    const idFilter = { id: { [operator]: ['article-a', objectID] } }
    const args = { collectionSlug: 'articles', fieldNames: new Set<string>() }

    expect(
      resolveWhereForCollection({ ...args, usesObjectIDs: false, where: idFilter }),
    ).toMatchObject({ where: idFilter })
    expect(
      resolveWhereForCollection({ ...args, usesObjectIDs: true, where: idFilter }),
    ).toMatchObject({ where: { id: { [operator]: [objectID] } } })
    expect(
      resolveWhereForCollection({
        ...args,
        usesObjectIDs: true,
        where: { id: { [operator]: ['article-a'] } },
      }),
    ).toMatchObject({ where: { id: { [operator]: [] } } })
  },
)
