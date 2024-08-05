import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { Post, Relation } from './payload-types.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Relationship Object IDs Plugin', () => {
  let relations: Relation[]
  let posts: Post[]
  let payload: Payload

  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  it('seeds data accordingly', async () => {
    // eslint-disable-next-line jest/no-conditional-in-test
    if (payload.db.name === 'mongoose') {
      const relationsQuery = await payload.find({
        collection: 'relations',
        sort: 'createdAt',
      })

      relations = relationsQuery.docs

      const postsQuery = await payload.find({
        collection: 'posts',
        sort: 'createdAt',
      })

      posts = postsQuery.docs

      expect(relationsQuery.totalDocs).toStrictEqual(2)
      expect(postsQuery.totalDocs).toStrictEqual(2)
    }
  })

  it('stores relations as object ids', async () => {
    // eslint-disable-next-line jest/no-conditional-in-test
    if (payload.db.name === 'mongoose') {
      const docs = await payload.db.collections.relations.find()
      expect(typeof docs[0].hasOne).toBe('object')
      expect(typeof docs[0].hasOnePoly.value).toBe('object')
      expect(typeof docs[0].hasMany[0]).toBe('object')
      expect(typeof docs[0].hasManyPoly[0].value).toBe('object')
      expect(typeof docs[0].upload).toBe('object')
    }
  })

  it('can query by relationship id', async () => {
    // eslint-disable-next-line jest/no-conditional-in-test
    if (payload.db.name === 'mongoose') {
      const { totalDocs } = await payload.find({
        collection: 'relations',
        where: {
          hasOne: {
            equals: posts[0].id,
          },
        },
      })

      expect(totalDocs).toStrictEqual(1)
    }
  })

  it('populates relations', () => {
    // eslint-disable-next-line jest/no-conditional-in-test
    if (payload.db.name === 'mongoose') {
      const populatedPostTitle =
        // eslint-disable-next-line jest/no-conditional-in-test
        typeof relations[0].hasOne === 'object' ? relations[0].hasOne.title : undefined
      expect(populatedPostTitle).toBeDefined()

      const populatedUploadFilename =
        // eslint-disable-next-line jest/no-conditional-in-test
        typeof relations[0].upload === 'object' ? relations[0].upload.filename : undefined

      expect(populatedUploadFilename).toBeDefined()
    }
  })

  it('can query by nested property', async () => {
    // eslint-disable-next-line jest/no-conditional-in-test
    if (payload.db.name === 'mongoose') {
      const { totalDocs } = await payload.find({
        collection: 'relations',
        where: {
          'hasOne.title': {
            equals: 'post 1',
          },
        },
      })

      expect(totalDocs).toStrictEqual(1)
    }
  })

  it('can query using the "in" operator', async () => {
    // eslint-disable-next-line jest/no-conditional-in-test
    if (payload.db.name === 'mongoose') {
      const { totalDocs } = await payload.find({
        collection: 'relations',
        where: {
          hasMany: {
            in: [posts[0].id],
          },
        },
      })

      expect(totalDocs).toStrictEqual(1)
    }
  })
})
