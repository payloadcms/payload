import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { orderableSlug } from './collections/Orderable/index.js'
import { orderableJoinSlug } from './collections/OrderableJoin/index.js'

test.suite('Orderable: localized join neighbors', { config: './config.ts' }, () => {
  for (const direction of ['greater', 'less'] as const) {
    test(`should use the request locale when finding the ${direction} join neighbor`, async ({
      payload,
      restClient,
    }) => {
      const enParent = await payload.create({
        collection: orderableJoinSlug,
        data: { title: 'English parent' },
        overrideAccess: true,
      })
      const nbParent = await payload.create({
        collection: orderableJoinSlug,
        data: { title: 'Norwegian parent' },
        overrideAccess: true,
      })
      const documents = []

      // No document belongs to nbParent in English: a lookup in the wrong locale misses the neighbor.
      for (const [index, title] of ['A', 'B', 'C'].entries()) {
        const doc = await payload.create({
          collection: orderableSlug,
          data: {
            _orderable_orderableJoinField1_order: `a${index}`,
            orderableField: enParent.id,
            title,
          },
          locale: 'en',
          overrideAccess: true,
        })

        await payload.update({
          id: doc.id,
          collection: orderableSlug,
          data: { orderableField: nbParent.id },
          locale: 'nb',
          overrideAccess: true,
        })
        documents.push(doc)
      }

      const target = direction === 'greater' ? documents[0]! : documents[2]!
      const moved = direction === 'greater' ? documents[2]! : documents[0]!

      await restClient.login({ slug: 'users' })

      const response = await restClient.POST('/reorder?locale=nb', {
        body: JSON.stringify({
          collectionSlug: orderableSlug,
          docsToMove: [moved.id],
          newKeyWillBe: direction,
          orderableFieldName: '_orderable_orderableJoinField1_order',
          target: { id: target.id, key: target._orderable_orderableJoinField1_order },
        }),
      })

      expect(response.status).toBe(200)

      const reordered = await payload.findByID({
        id: moved.id,
        collection: orderableSlug,
        locale: 'nb',
        overrideAccess: true,
      })
      const lowerKey = direction === 'greater' ? 'a0' : 'a1'
      const upperKey = direction === 'greater' ? 'a1' : 'a2'
      const orderKey = reordered._orderable_orderableJoinField1_order
      const expectedDocuments =
        direction === 'greater'
          ? [documents[0]!, documents[2]!, documents[1]!]
          : [documents[1]!, documents[0]!, documents[2]!]

      expect(orderKey).toBeTypeOf('string')
      expect(orderKey! > lowerKey).toBe(true)
      expect(orderKey! < upperKey).toBe(true)

      const parent = await payload.findByID({
        id: nbParent.id,
        collection: orderableJoinSlug,
        depth: 1,
        locale: 'nb',
        overrideAccess: true,
      })

      expect(
        parent.orderableJoinField1?.docs?.map((doc) => (typeof doc === 'object' ? doc.id : doc)),
      ).toEqual(expectedDocuments.map(({ id }) => id))
    })
  }
})
