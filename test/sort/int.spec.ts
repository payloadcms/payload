import type { CollectionSlug, Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Orderable, OrderableJoin } from './payload-types.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
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
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
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
          parseInt(doc._orderable_orderableJoinField1_order, 16),
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
  })
})

async function createData(collection: CollectionSlug, data: Record<string, any>[]) {
  for (const item of data) {
    await payload.create({ collection, data: item })
  }
}
