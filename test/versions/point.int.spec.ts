import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { pointVersionsCollectionSlug } from './slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload

describe('Versions - point field', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should save a version when updating a document with a point field', async () => {
    const doc = await payload.create({
      collection: pointVersionsCollectionSlug,
      data: { point: [11, 1], title: 'original' },
    })

    const updated = await payload.update({
      id: doc.id,
      collection: pointVersionsCollectionSlug,
      data: { title: 'updated' },
    })

    expect(updated.point).toStrictEqual([11, 1])

    const { docs: versions } = await payload.findVersions({
      collection: pointVersionsCollectionSlug,
      sort: '-createdAt',
      where: { parent: { equals: doc.id } },
    })

    expect(versions).toHaveLength(2)
    expect(versions[0]?.version.title).toBe('updated')
    expect(versions[0]?.version.point).toStrictEqual([11, 1])

    await payload.delete({ id: doc.id, collection: pointVersionsCollectionSlug })
  })
})
