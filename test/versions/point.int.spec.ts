import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { pointVersionsCollectionSlug } from './slugs.js'

test.suite('Versions - point field', { config: './config.ts' }, () => {
  test('should save a version when updating a document with a point field', async ({ payload }) => {
    const doc = await payload.create({
      collection: pointVersionsCollectionSlug,
      data: { point: [11, 1], title: 'original' },
      overrideAccess: true,
    })

    const updated = await payload.update({
      id: doc.id,
      collection: pointVersionsCollectionSlug,
      data: { title: 'updated' },
      overrideAccess: true,
    })

    expect(updated.point).toStrictEqual([11, 1])

    const { docs: versions } = await payload.findVersions({
      collection: pointVersionsCollectionSlug,
      overrideAccess: true,
      sort: '-createdAt',
      where: { parent: { equals: doc.id } },
    })

    expect(versions).toHaveLength(2)
    expect(versions[0]?.version.title).toBe('updated')
    expect(versions[0]?.version.point).toStrictEqual([11, 1])
  })
})
