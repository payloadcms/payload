import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { Payload } from 'payload'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import configPromise from './config.js'
import { postsSlug, relationsSlug } from './shared.js'

let payload: Payload

let relations: unknown[]
let posts: unknown[]

describe('@payloadcms/plugin-relationship-object-ids', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(configPromise))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  it('should initialize Payload', () => {
    expect(payload).toBeTruthy()
  })

  // isMongoose() from '../helpers/isMongoose' doesn't work, because here "payload" is still undefined.
  // As well PAYLOAD_DATABASE could be undefined with MongoDB.
  if (
    !process.env.PAYLOAD_DATABASE?.includes('postgres') &&
    process.env.PAYLOAD_DATABASE !== 'supabase'
  ) {
    it('seeds data accordingly', async () => {
      const relationsQuery = await payload.find({
        collection: relationsSlug,
        sort: 'createdAt',
      })

      relations = relationsQuery.docs

      const postsQuery = await payload.find({
        collection: postsSlug,
        sort: 'createdAt',
      })

      posts = postsQuery.docs

      expect(relationsQuery.totalDocs).toEqual(2)
      expect(postsQuery.totalDocs).toEqual(2)
    })

    it('stores relations as object ids', async () => {
      const docs = await (payload.db as MongooseAdapter).collections[relationsSlug].find()
      expect(typeof docs[0].hasOne).toBe('object')
      expect(typeof docs[0].hasOnePoly.value).toBe('object')
      expect(typeof docs[0].hasMany[0]).toBe('object')
      expect(typeof docs[0].hasManyPoly[0].value).toBe('object')
      expect(typeof docs[0].upload).toBe('object')
    })

    it('can query by relationship id', async () => {
      const { totalDocs } = await payload.find({
        collection: relationsSlug,
        where: {
          hasOne: {
            equals: posts[0].id,
          },
        },
      })

      expect(totalDocs).toStrictEqual(1)
    })

    it('populates relations', () => {
      const populatedPostTitle = typeof relations[0].hasOne

      expect(populatedPostTitle).toBeDefined()

      const populatedUploadFilename = typeof relations[0].upload

      expect(populatedUploadFilename).toBeDefined()
    })

    it('can query by nested property', async () => {
      const { totalDocs } = await payload.find({
        collection: relationsSlug,
        where: {
          'hasOne.title': {
            equals: 'post 1',
          },
        },
      })

      expect(totalDocs).toStrictEqual(1)
    })

    it('can query using the "in" operator', async () => {
      const { totalDocs } = await payload.find({
        collection: relationsSlug,
        where: {
          hasMany: {
            in: [posts[0].id],
          },
        },
      })

      expect(totalDocs).toStrictEqual(1)
    })
  }
})
