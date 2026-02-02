import type { CollectionSlug, Payload } from 'payload'

import path from 'path'
import * as qs from 'qs-esm'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../helpers/shared/NextRESTClient.js'
import type { Draft, Orderable, OrderableJoin } from './payload-types.js'

import { initPayloadInt } from '../helpers/shared/initPayloadInt.js'
import { draftsSlug } from './collections/Drafts/index.js'
import { nonUniqueSortSlug } from './collections/NonUniqueSort/index.js'
import { orderableSlug } from './collections/Orderable/index.js'
import { orderableJoinSlug } from './collections/OrderableJoin/index.js'

let payload: Payload
let restClient: NextRESTClient

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Sort', () => {
  beforeAll(async () => {
    // @ts-expect-error: initPayloadInt does not have a proper type definition
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  describe('Local API', () => {
    beforeAll(async () => {
      await createData('posts', [
        { text: 'Post 1', number: 1, number2: 10, group: { number: 100 } },
        { text: 'Post 2', number: 2, number2: 10, group: { number: 200 } },
        { text: 'Post 3', number: 3, number2: 5, group: { number: 150 } },
        { text: 'Post 10', number: 10, number2: 5, group: { number: 200 } },
        { text: 'Post 11', number: 11, number2: 20, group: { number: 150 } },
        { text: 'Post 12', number: 12, number2: 20, group: { number: 100 } },
      ])
      await createData('default-sort', [
        { text: 'Post default-5 b', number: 5 },
        { text: 'Post default-10', number: 10 },
        { text: 'Post default-5 a', number: 5 },
        { text: 'Post default-1', number: 1 },
      ])
    })

    afterAll(async () => {
      await payload.delete({ collection: 'posts', where: {} })
      await payload.delete({ collection: 'default-sort', where: {} })
    })

    describe('Default sort', () => {
      it('should sort posts by default definition in collection', async () => {
        const posts = await payload.find({
          collection: 'default-sort', // 'number,-text'
        })

        expect(posts.docs.map((post) => post.text)).toEqual([
          'Post default-1',
          'Post default-5 b',
          'Post default-5 a',
          'Post default-10',
        ])
      })
    })

    describe('Single sort field', () => {
      it('should sort posts by text field', async () => {
        const posts = await payload.find({
          collection: 'posts',
          sort: 'text',
        })

        expect(posts.docs.map((post) => post.text)).toEqual([
          'Post 1',
          'Post 10',
          'Post 11',
          'Post 12',
          'Post 2',
          'Post 3',
        ])
      })

      it('should sort posts by text field desc', async () => {
        const posts = await payload.find({
          collection: 'posts',
          sort: '-text',
        })

        expect(posts.docs.map((post) => post.text)).toEqual([
          'Post 3',
          'Post 2',
          'Post 12',
          'Post 11',
          'Post 10',
          'Post 1',
        ])
      })

      it('should sort posts by number field', async () => {
        const posts = await payload.find({
          collection: 'posts',
          sort: 'number',
        })

        expect(posts.docs.map((post) => post.text)).toEqual([
          'Post 1',
          'Post 2',
          'Post 3',
          'Post 10',
          'Post 11',
          'Post 12',
        ])
      })

      it('should sort posts by number field desc', async () => {
        const posts = await payload.find({
          collection: 'posts',
          sort: '-number',
        })

        expect(posts.docs.map((post) => post.text)).toEqual([
          'Post 12',
          'Post 11',
          'Post 10',
          'Post 3',
          'Post 2',
          'Post 1',
        ])
      })
    })

    describe('Non-unique sorting', () => {
      // There are situations where the sort order is not guaranteed to be consistent, such as when sorting by a non-unique field in MongoDB which does not keep an internal order of items
      // As a result, every time you fetch, including fetching specific pages, the order of items may change and appear as duplicated to some users.
      it('should always be consistent when sorting', async () => {
        const posts = await payload.find({
          collection: nonUniqueSortSlug,
          sort: 'order',
        })

        const initialMap = posts.docs.map((post) => post.title)

        const dataFetches = await Promise.all(
          Array.from({ length: 3 }).map(() =>
            payload.find({
              collection: nonUniqueSortSlug,
              sort: 'order',
            }),
          ),
        )

        const [fetch1, fetch2, fetch3] = dataFetches.map((fetch) =>
          fetch.docs.map((post) => post.title),
        )

        expect(fetch1).toEqual(initialMap)

        expect(fetch2).toEqual(initialMap)

        expect(fetch3).toEqual(initialMap)
      })

      it('should always be consistent when sorting - with limited pages', async () => {
        const posts = await payload.find({
          collection: nonUniqueSortSlug,
          sort: 'order',
          limit: 5,
          page: 2,
        })

        const initialMap = posts.docs.map((post) => post.title)

        const dataFetches = await Promise.all(
          Array.from({ length: 3 }).map(() =>
            payload.find({
              collection: nonUniqueSortSlug,
              sort: 'order',
              limit: 5,
              page: 2,
            }),
          ),
        )

        const [fetch1, fetch2, fetch3] = dataFetches.map((fetch) =>
          fetch.docs.map((post) => post.title),
        )

        expect(fetch1).toEqual(initialMap)

        expect(fetch2).toEqual(initialMap)

        expect(fetch3).toEqual(initialMap)
      })

      it('should sort by createdAt as fallback', async () => {
        // This is the (reverse - newest first) order that the posts are created in so this should remain consistent as the sort should fallback to '-createdAt'
        const postsInOrder = ['Post 9', 'Post 8', 'Post 7', 'Post 6']

        const dataFetches = await Promise.all(
          Array.from({ length: 3 }).map(() =>
            payload.find({
              collection: nonUniqueSortSlug,
              sort: 'order',
              page: 2,
              limit: 4,
            }),
          ),
        )

        const [fetch1, fetch2, fetch3] = dataFetches.map((fetch) =>
          fetch.docs.map((post) => post.title),
        )

        console.log({ fetch1, fetch2, fetch3 })

        expect(fetch1).toEqual(postsInOrder)

        expect(fetch2).toEqual(postsInOrder)

        expect(fetch3).toEqual(postsInOrder)
      })

      it('should always be consistent without sort params in the query', async () => {
        const posts = await payload.find({
          collection: nonUniqueSortSlug,
        })

        const initialMap = posts.docs.map((post) => post.title)

        const dataFetches = await Promise.all(
          Array.from({ length: 3 }).map(() =>
            payload.find({
              collection: nonUniqueSortSlug,
            }),
          ),
        )

        const [fetch1, fetch2, fetch3] = dataFetches.map((fetch) =>
          fetch.docs.map((post) => post.title),
        )

        expect(fetch1).toEqual(initialMap)

        expect(fetch2).toEqual(initialMap)

        expect(fetch3).toEqual(initialMap)
      })

      it('should always be consistent without sort params in the query - with limited pages', async () => {
        const posts = await payload.find({
          collection: nonUniqueSortSlug,
          page: 2,
          limit: 4,
        })

        const initialMap = posts.docs.map((post) => post.title)

        const dataFetches = await Promise.all(
          Array.from({ length: 3 }).map(() =>
            payload.find({
              collection: nonUniqueSortSlug,
              page: 2,
              limit: 4,
            }),
          ),
        )

        const [fetch1, fetch2, fetch3] = dataFetches.map((fetch) =>
          fetch.docs.map((post) => post.title),
        )

        expect(fetch1).toEqual(initialMap)

        expect(fetch2).toEqual(initialMap)

        expect(fetch3).toEqual(initialMap)
      })
    })

    describe('Sort by multiple fields', () => {
      it('should sort posts by multiple fields', async () => {
        const posts = await payload.find({
          collection: 'posts',
          sort: ['number2', 'number'],
        })

        expect(posts.docs.map((post) => post.text)).toEqual([
          'Post 3', // 5, 3
          'Post 10', // 5, 10
          'Post 1', // 10, 1
          'Post 2', // 10, 2
          'Post 11', // 20, 11
          'Post 12', // 20, 12
        ])
      })

      it('should sort posts by multiple fields asc and desc', async () => {
        const posts = await payload.find({
          collection: 'posts',
          sort: ['number2', '-number'],
        })

        expect(posts.docs.map((post) => post.text)).toEqual([
          'Post 10', // 5, 10
          'Post 3', // 5, 3
          'Post 2', // 10, 2
          'Post 1', // 10, 1
          'Post 12', // 20, 12
          'Post 11', // 20, 11
        ])
      })

      it('should sort posts by multiple fields with group', async () => {
        const posts = await payload.find({
          collection: 'posts',
          sort: ['-group.number', '-number'],
        })

        expect(posts.docs.map((post) => post.text)).toEqual([
          'Post 10', // 200, 10
          'Post 2', // 200, 2
          'Post 11', // 150, 11
          'Post 3', // 150, 3
          'Post 12', // 100, 12
          'Post 1', // 100, 1
        ])
      })
    })

    describe('Sort with drafts', () => {
      beforeAll(async () => {
        const testData1 = await payload.create({
          collection: 'drafts',
          data: { text: 'Post 1 draft', number: 10 },
          draft: true,
        })
        await payload.update({
          collection: 'drafts',
          id: testData1.id,
          data: { text: 'Post 1 draft updated', number: 20 },
          draft: true,
        })
        await payload.update({
          collection: 'drafts',
          id: testData1.id,
          data: { text: 'Post 1 draft updated', number: 30 },
          draft: true,
        })
        await payload.update({
          collection: 'drafts',
          id: testData1.id,
          data: { text: 'Post 1 published', number: 15 },
          draft: false,
        })
        const testData2 = await payload.create({
          collection: 'drafts',
          data: { text: 'Post 2 draft', number: 1 },
          draft: true,
        })
        await payload.update({
          collection: 'drafts',
          id: testData2.id,
          data: { text: 'Post 2 published', number: 2 },
          draft: false,
        })
        await payload.update({
          collection: 'drafts',
          id: testData2.id,
          data: { text: 'Post 2 newdraft', number: 100 },
          draft: true,
        })
        await payload.create({
          collection: 'drafts',
          data: { text: 'Post 3 draft', number: 3 },
          draft: true,
        })
      })

      it('should sort latest without draft', async () => {
        const posts = await payload.find({
          collection: 'drafts',
          sort: 'number',
          draft: false,
        })

        expect(posts.docs.map((post) => post.text)).toEqual([
          'Post 2 published', // 2
          'Post 3 draft', // 3
          'Post 1 published', // 15
        ])
      })

      it('should sort latest with draft', async () => {
        const posts = await payload.find({
          collection: 'drafts',
          sort: 'number',
          draft: true,
        })

        expect(posts.docs.map((post) => post.text)).toEqual([
          'Post 3 draft', // 3
          'Post 1 published', // 15
          'Post 2 newdraft', // 100
        ])
      })

      it('should sort versions', async () => {
        const posts = await payload.findVersions({
          collection: 'drafts',
          sort: 'version.number',
          draft: false,
        })

        expect(posts.docs.map((post) => post.version.text)).toEqual([
          'Post 2 draft', // 1
          'Post 2 published', // 2
          'Post 3 draft', // 3
          'Post 1 draft', // 10
          'Post 1 published', // 15
          'Post 1 draft updated', // 20
          'Post 1 draft updated', // 30
          'Post 2 newdraft', // 100
        ])
      })
    })

    describe('Localized sort', () => {
      beforeAll(async () => {
        const testData1 = await payload.create({
          collection: 'localized',
          data: { text: 'Post 1 english', number: 10 },
          locale: 'en',
        })
        await payload.update({
          collection: 'localized',
          id: testData1.id,
          data: { text: 'Post 1 norsk', number: 20 },
          locale: 'nb',
        })
        const testData2 = await payload.create({
          collection: 'localized',
          data: { text: 'Post 2 english', number: 25 },
          locale: 'en',
        })
        await payload.update({
          collection: 'localized',
          id: testData2.id,
          data: { text: 'Post 2 norsk', number: 5 },
          locale: 'nb',
        })
      })

      it('should sort localized field', async () => {
        const englishPosts = await payload.find({
          collection: 'localized',
          sort: 'number',
          locale: 'en',
        })

        expect(englishPosts.docs.map((post) => post.text)).toEqual([
          'Post 1 english', // 10
          'Post 2 english', // 20
        ])

        const norwegianPosts = await payload.find({
          collection: 'localized',
          sort: 'number',
          locale: 'nb',
        })

        expect(norwegianPosts.docs.map((post) => post.text)).toEqual([
          'Post 2 norsk', // 5
          'Post 1 norsk', // 25
        ])
      })
    })

    describe('Orderable', () => {
      let orderable1: Orderable
      let orderable2: Orderable
      let orderableDraft1: Draft
      let orderableDraft2: Draft
      beforeAll(async () => {
        orderable1 = await payload.create({
          collection: orderableSlug,
          data: {
            title: 'Orderable 1',
          },
        })
        orderable2 = await payload.create({
          collection: orderableSlug,
          data: {
            title: 'Orderable 2',
          },
        })
        orderableDraft1 = await payload.create({
          collection: draftsSlug,
          data: {
            text: 'Orderable 1',
            _status: 'draft',
          },
        })
        orderableDraft2 = await payload.create({
          collection: draftsSlug,
          data: {
            text: 'Orderable 2',
            _status: 'draft',
          },
        })
      })

      it('should set order by default', async () => {
        const ordered = await payload.find({
          collection: orderableSlug,
          where: {
            title: {
              contains: 'Orderable ',
            },
          },
        })

        expect(orderable1._order).toBeDefined()
        expect(orderable2._order).toBeDefined()
        expect(parseInt(orderable1._order, 36)).toBeLessThan(parseInt(orderable2._order, 36))
        expect(ordered.docs[0].id).toStrictEqual(orderable1.id)
        expect(ordered.docs[1].id).toStrictEqual(orderable2.id)
      })

      it('should allow reordering with REST API', async () => {
        const res = await restClient.POST('/reorder', {
          body: JSON.stringify({
            collectionSlug: orderableSlug,
            docsToMove: [orderable1.id],
            newKeyWillBe: 'greater',
            orderableFieldName: '_order',
            target: {
              id: orderable2.id,
              key: orderable2._order,
            },
          }),
        })

        expect(res.status).toStrictEqual(200)

        const ordered = await payload.find({
          collection: 'orderable',
          where: {
            title: {
              contains: 'Orderable ',
            },
          },
        })

        expect(parseInt(ordered.docs[0]._order, 36)).toBeLessThan(
          parseInt(ordered.docs[1]._order, 36),
        )
      })

      it('should allow reordering with REST API with drafts enabled', async () => {
        const res = await restClient.POST('/reorder', {
          body: JSON.stringify({
            collectionSlug: draftsSlug,
            docsToMove: [orderableDraft1.id],
            newKeyWillBe: 'greater',
            orderableFieldName: '_order',
            target: {
              id: orderableDraft2.id,
              key: orderableDraft2._order,
            },
          }),
        })

        expect(res.status).toStrictEqual(200)

        const ordered = await payload.find({
          collection: draftsSlug,
          draft: true,
          where: {
            text: {
              contains: 'Orderable ',
            },
          },
        })

        expect(ordered.docs).toHaveLength(2)

        expect(parseInt(ordered.docs[0]._order, 36)).toBeLessThan(
          parseInt(ordered.docs[1]._order, 36),
        )
      })

      it('should allow to duplicate with reordable', async () => {
        const doc = await payload.create({
          collection: 'orderable',
          data: { title: 'new document' },
        })

        const docDuplicated = await payload.create({
          duplicateFromID: doc.id,
          collection: 'orderable',
          data: {},
        })
        expect(docDuplicated.title).toBe('new document')
        expect(parseInt(doc._order!, 36)).toBeLessThan(parseInt(docDuplicated._order!, 36))

        await restClient.POST('/reorder', {
          body: JSON.stringify({
            collectionSlug: orderableSlug,
            docsToMove: [doc.id],
            newKeyWillBe: 'greater',
            orderableFieldName: '_order',
            target: {
              id: docDuplicated.id,
              key: docDuplicated._order,
            },
          }),
        })

        const docAfterReorder = await payload.findByID({ collection: 'orderable', id: doc.id })
        const docDuplicatedAfterReorder = await payload.findByID({
          collection: 'orderable',
          id: docDuplicated.id,
        })
        expect(parseInt(docAfterReorder._order!, 36)).toBeGreaterThan(
          parseInt(docDuplicatedAfterReorder._order!, 36),
        )
      })

      it('should not break with existing base 62 digits', async () => {
        const collection = orderableSlug
        // create seed docs with aa, aA, a0 (legacy base64 chars for backward compatibility)
        const aa = await payload.create({
          collection,
          data: {
            title: 'Base62 aa',
            _order: 'aa',
          },
        })
        const aA = await payload.create({
          collection,
          data: {
            title: 'Base62 aA',
            _order: 'aA',
          },
        })
        const a0 = await payload.create({
          collection,
          data: {
            title: 'Base62 a0',
            _order: 'a0',
          },
        })

        const orderableDoc = await payload.create({
          collection,
          data: {
            title: 'Base62 new',
          },
        })

        const res = await restClient.POST('/reorder', {
          body: JSON.stringify({
            collectionSlug: orderableSlug,
            docsToMove: [orderableDoc.id],
            newKeyWillBe: 'greater',
            orderableFieldName: '_order',
            target: {
              id: aA.id,
              key: aA._order,
            },
          }),
        })

        expect(res.status).toStrictEqual(200)

        const { docs } = await payload.find({
          collection,
          sort: '-_order',
          where: {
            title: {
              contains: 'Base62 ',
            },
          },
        })

        expect(docs).toHaveLength(4)
        const ids = [aa.id, aA.id, a0.id, orderableDoc.id]
        expect(docs.every(({ id }) => ids.includes(id))).toBe(true)

        const a0Index = docs.findIndex((d) => d.id === a0.id)
        const aAIndex = docs.findIndex((d) => d.id === aA.id)
        const orderableIndex = docs.findIndex((d) => d.id === orderableDoc.id)

        // The reordered document should be positioned after the target (aA) since newKeyWillBe: 'greater'
        // and before the target (a0) since (a0) is the smallest fractional index
        expect(orderableIndex).toBeGreaterThan(aAIndex)
        expect(orderableIndex).toBeLessThan(a0Index)
      })

      it('should generate case-insensitive-safe keys when moving to first position', async () => {
        const collection = orderableSlug

        const { docs: allDocs } = await payload.find({
          collection,
          sort: '_order',
          limit: 1,
        })
        expect(allDocs).toHaveLength(1)
        const firstDoc = allDocs[0]!

        const newDoc = await payload.create({
          collection,
          data: { title: 'Move to first test' },
        })

        const res = await restClient.POST('/reorder', {
          body: JSON.stringify({
            collectionSlug: collection,
            docsToMove: [newDoc.id],
            newKeyWillBe: 'less',
            orderableFieldName: '_order',
            target: {
              id: firstDoc.id,
              key: firstDoc._order,
            },
          }),
        })

        expect(res.status).toStrictEqual(200)

        const newDocAfter = await payload.findByID({ collection, id: newDoc.id })

        expect(newDocAfter._order).toMatch(/^\d/)
        expect(parseInt(newDocAfter._order!, 36)).toBeLessThan(parseInt(firstDoc._order!, 36))
      })

      it('should allow multiple reorders to absolute first position', async () => {
        const collection = orderableSlug

        const { docs: initialDocs } = await payload.find({
          collection,
          sort: '_order',
          limit: 1,
        })
        expect(initialDocs).toHaveLength(1)
        const originalFirst = initialDocs[0]!

        const docA = await payload.create({
          collection,
          data: { title: 'Multi first A' },
        })

        const docB = await payload.create({
          collection,
          data: { title: 'Multi first B' },
        })

        await restClient.POST('/reorder', {
          body: JSON.stringify({
            collectionSlug: collection,
            docsToMove: [docA.id],
            newKeyWillBe: 'less',
            orderableFieldName: '_order',
            target: {
              id: originalFirst.id,
              key: originalFirst._order,
            },
          }),
        })

        const docAAfter = await payload.findByID({ collection, id: docA.id })
        expect(docAAfter._order).toMatch(/^\d/)

        const res = await restClient.POST('/reorder', {
          body: JSON.stringify({
            collectionSlug: collection,
            docsToMove: [docB.id],
            newKeyWillBe: 'less',
            orderableFieldName: '_order',
            target: {
              id: docA.id,
              key: docAAfter._order,
            },
          }),
        })

        expect(res.status).toStrictEqual(200)

        const docBAfter = await payload.findByID({ collection, id: docB.id })

        expect(docBAfter._order).toMatch(/^\d/)
        expect(parseInt(docBAfter._order!, 36)).toBeLessThan(parseInt(docAAfter._order!, 36))
      })

      it('should handle moving doc from first position and back', async () => {
        const collection = orderableSlug

        const { docs: initialDocs } = await payload.find({
          collection,
          sort: '_order',
          limit: 2,
        })
        expect(initialDocs.length).toBeGreaterThanOrEqual(2)
        const firstDoc = initialDocs[0]!
        const secondDoc = initialDocs[1]!

        await restClient.POST('/reorder', {
          body: JSON.stringify({
            collectionSlug: collection,
            docsToMove: [firstDoc.id],
            newKeyWillBe: 'greater',
            orderableFieldName: '_order',
            target: {
              id: secondDoc.id,
              key: secondDoc._order,
            },
          }),
        })

        const firstDocMoved = await payload.findByID({ collection, id: firstDoc.id })
        expect(parseInt(firstDocMoved._order!, 36)).toBeGreaterThan(parseInt(secondDoc._order!, 36))

        const res = await restClient.POST('/reorder', {
          body: JSON.stringify({
            collectionSlug: collection,
            docsToMove: [firstDoc.id],
            newKeyWillBe: 'less',
            orderableFieldName: '_order',
            target: {
              id: secondDoc.id,
              key: secondDoc._order,
            },
          }),
        })

        expect(res.status).toStrictEqual(200)

        const firstDocBack = await payload.findByID({ collection, id: firstDoc.id })
        expect(parseInt(firstDocBack._order!, 36)).toBeLessThan(parseInt(secondDoc._order!, 36))
      })
    })

    describe('Orderable join', () => {
      let related: OrderableJoin
      let orderable1: Orderable
      let orderable2: Orderable
      let orderable3: Orderable

      beforeAll(async () => {
        related = await payload.create({
          collection: orderableJoinSlug,
          data: {
            title: 'test',
          },
        })
        orderable1 = await payload.create({
          collection: orderableSlug,
          data: {
            title: 'test 1',
            orderableField: related.id,
          },
        })

        orderable2 = await payload.create({
          collection: orderableSlug,
          data: {
            title: 'test 2',
            orderableField: related.id,
          },
        })

        orderable3 = await payload.create({
          collection: orderableSlug,
          data: {
            title: 'test 3',
            orderableField: related.id,
          },
        })
      })

      it('should set order by default', () => {
        expect(orderable1._orderable_orderableJoinField1_order).toBeDefined()
      })

      it('should allow setting the order with the local API', async () => {
        // create two orderableJoinSlug docs
        orderable2 = await payload.update({
          collection: orderableSlug,
          id: orderable2.id,
          data: {
            title: 'test',
            orderableField: related.id,
            _orderable_orderableJoinField1_order: 'e4',
          },
        })
        const orderable4 = await payload.create({
          collection: orderableSlug,
          data: {
            title: 'test',
            orderableField: related.id,
            _orderable_orderableJoinField1_order: 'e2',
          },
        })
        expect(orderable2._orderable_orderableJoinField1_order).toBe('e4')
        expect(orderable4._orderable_orderableJoinField1_order).toBe('e2')
      })

      it('should sort join docs in the correct', async () => {
        related = await payload.findByID({
          collection: orderableJoinSlug,
          id: related.id,
          depth: 1,
        })
        const orders = (related.orderableJoinField1 as { docs: Orderable[] }).docs.map((doc) =>
          parseInt(doc._orderable_orderableJoinField1_order, 36),
        ) as [number, number, number]
        expect(orders[0]).toBeLessThan(orders[1])
        expect(orders[1]).toBeLessThan(orders[2])
      })
    })
  })

  describe('REST API', () => {
    beforeAll(async () => {
      await createData('posts', [
        { text: 'Post 1', number: 1, number2: 10 },
        { text: 'Post 2', number: 2, number2: 10 },
        { text: 'Post 3', number: 3, number2: 5 },
        { text: 'Post 10', number: 10, number2: 5 },
        { text: 'Post 11', number: 11, number2: 20 },
        { text: 'Post 12', number: 12, number2: 20 },
      ])
    })

    afterAll(async () => {
      await payload.delete({ collection: 'posts', where: {} })
    })

    describe('Single sort field', () => {
      it('should sort posts by text field', async () => {
        const res = await restClient
          .GET(`/posts`, {
            query: {
              sort: 'text',
            },
          })
          .then((res) => res.json())

        expect(res.docs.map((post) => post.text)).toEqual([
          'Post 1',
          'Post 10',
          'Post 11',
          'Post 12',
          'Post 2',
          'Post 3',
        ])
      })

      it('should sort posts by text field desc', async () => {
        const res = await restClient
          .GET(`/posts`, {
            query: {
              sort: '-text',
            },
          })
          .then((res) => res.json())

        expect(res.docs.map((post) => post.text)).toEqual([
          'Post 3',
          'Post 2',
          'Post 12',
          'Post 11',
          'Post 10',
          'Post 1',
        ])
      })

      it('should sort posts by number field', async () => {
        const res = await restClient
          .GET(`/posts`, {
            query: {
              sort: 'number',
            },
          })
          .then((res) => res.json())

        expect(res.docs.map((post) => post.text)).toEqual([
          'Post 1',
          'Post 2',
          'Post 3',
          'Post 10',
          'Post 11',
          'Post 12',
        ])
      })

      it('should sort posts by number field desc', async () => {
        const res = await restClient
          .GET(`/posts`, {
            query: {
              sort: '-number',
            },
          })
          .then((res) => res.json())

        expect(res.docs.map((post) => post.text)).toEqual([
          'Post 12',
          'Post 11',
          'Post 10',
          'Post 3',
          'Post 2',
          'Post 1',
        ])
      })
    })

    describe('Sort by multiple fields', () => {
      it('should sort posts by multiple fields', async () => {
        const res = await restClient
          .GET(`/posts`, {
            query: {
              sort: 'number2,number',
            },
          })
          .then((res) => res.json())

        expect(res.docs.map((post) => post.text)).toEqual([
          'Post 3', // 5, 3
          'Post 10', // 5, 10
          'Post 1', // 10, 1
          'Post 2', // 10, 2
          'Post 11', // 20, 11
          'Post 12', // 20, 12
        ])
      })

      it('should sort posts by multiple fields asc and desc', async () => {
        const res = await restClient
          .GET(`/posts`, {
            query: {
              sort: 'number2,-number',
            },
          })
          .then((res) => res.json())

        expect(res.docs.map((post) => post.text)).toEqual([
          'Post 10', // 5, 10
          'Post 3', // 5, 3
          'Post 2', // 10, 2
          'Post 1', // 10, 1
          'Post 12', // 20, 12
          'Post 11', // 20, 11
        ])
      })
    })

    describe('Sort by multiple fields as array', () => {
      it('should sort posts by multiple fields using qs-esm array params', async () => {
        const query = qs.stringify({ sort: ['number2', '-number'] })

        const res = await restClient.GET(`/posts?${query}`).then((res) => res.json())

        expect(res.docs.map((post) => post.text)).toEqual([
          'Post 10', // 5, 10
          'Post 3', // 5, 3
          'Post 2', // 10, 2
          'Post 1', // 10, 1
          'Post 12', // 20, 12
          'Post 11', // 20, 11
        ])
      })
    })
  })
})

async function createData(collection: CollectionSlug, data: Record<string, any>[]) {
  for (const item of data) {
    await payload.create({ collection, data: item })
  }
}
