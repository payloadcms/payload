import path from 'path'
import { type Payload } from 'payload'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Post } from './payload-types.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { postsSlug } from './collections/Posts/index.js'

let restClient: NextRESTClient
let user: any
let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('soft-delete', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  beforeEach(async () => {
    await restClient.login({
      slug: 'users',
      credentials: devUser,
    })
    user = await payload.login({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  })

  describe('find operation', () => {
    let postOne: Post
    let postTwo: Post

    beforeAll(async () => {
      postOne = await payload.create({
        collection: postsSlug,
        data: {
          title: 'Post one',
        },
      })

      postTwo = await payload.create({
        collection: postsSlug,
        data: {
          title: 'Post two',
          deletedAt: new Date().toISOString(),
        },
      })
    })

    it('should return all docs including soft-deleted docs in find with trash: true', async () => {
      const allDocs = await payload.find({
        collection: postsSlug,
        trash: true,
      })

      expect(allDocs.totalDocs).toEqual(2)
    })

    it('should return only soft-deleted docs in find with trash: true', async () => {
      const softDeletedDocs = await payload.find({
        collection: postsSlug,
        where: {
          deletedAt: {
            exists: true,
          },
        },
        trash: true,
      })

      expect(softDeletedDocs.totalDocs).toEqual(1)
      expect(softDeletedDocs.docs[0]?.id).toEqual(postTwo.id)
    })

    it('should return only non-soft-deleted docs in find with trash: false', async () => {
      const normalDocs = await payload.find({
        collection: postsSlug,
        trash: false,
      })

      expect(normalDocs.totalDocs).toEqual(1)
      expect(normalDocs.docs[0]?.id).toEqual(postOne.id)
    })
  })
})
