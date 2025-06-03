import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Post } from './payload-types.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { postsSlug } from './collections/Posts/index.js'

let restClient: NextRESTClient
let payload: Payload
let user: any

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('soft-delete', () => {
  beforeAll(async () => {
    const initResult = await initPayloadInt(dirname)

    payload = initResult.payload as Payload
    restClient = initResult.restClient as NextRESTClient
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  let postOne: Post
  let postTwo: Post

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

  afterEach(async () => {
    await payload.delete({
      collection: postsSlug,
      trash: true,
      where: {
        title: {
          exists: true,
        },
      },
    })
  })

  describe('find / findByID operation', () => {
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

    it('should return a soft-deleted document when trash: true', async () => {
      const softDeletedPost: Post = await payload.findByID({
        collection: postsSlug,
        id: postTwo.id,
        trash: true,
      })

      expect(softDeletedPost).toBeDefined()
      expect(softDeletedPost?.id).toEqual(postTwo.id)
      expect(softDeletedPost?.deletedAt).toBeDefined()
      expect(softDeletedPost?.deletedAt).toEqual(postTwo.deletedAt)
    })

    it('should throw NotFound error when trying to find a soft-deleted document w/o trash: true', async () => {
      await expect(
        payload.findByID({
          collection: postsSlug,
          id: postTwo.id,
        }),
      ).rejects.toThrow('Not Found')

      await expect(
        payload.findByID({
          collection: postsSlug,
          id: postTwo.id,
          trash: false,
        }),
      ).rejects.toThrow('Not Found')
    })
  })

  describe('updateByID operation', () => {
    it('should update a single soft-deleted document when trash: true', async () => {
      const updatedPost: Post = await payload.update({
        collection: postsSlug,
        id: postTwo.id,
        data: {
          title: 'Updated Post Two',
        },
        trash: true,
      })

      expect(updatedPost).toBeDefined()
      expect(updatedPost.id).toEqual(postTwo.id)
      expect(updatedPost.title).toEqual('Updated Post Two')
      expect(updatedPost.deletedAt).toBeDefined()
      expect(updatedPost.deletedAt).toEqual(postTwo.deletedAt)
    })

    it('should throw NotFound error when trying to update a soft-deleted document w/o trash: true', async () => {
      await expect(
        payload.update({
          collection: postsSlug,
          id: postTwo.id,
          data: {
            title: 'Updated Post Two',
          },
        }),
      ).rejects.toThrow('Not Found')

      await expect(
        payload.update({
          collection: postsSlug,
          id: postTwo.id,
          data: {
            title: 'Updated Post Two',
          },
          trash: false,
        }),
      ).rejects.toThrow('Not Found')
    })

    it('should update a single normal document when trash: false', async () => {
      const updatedPost: Post = await payload.update({
        collection: postsSlug,
        id: postOne.id,
        data: {
          title: 'Updated Post One',
        },
      })

      expect(updatedPost).toBeDefined()
      expect(updatedPost.id).toEqual(postOne.id)
      expect(updatedPost.title).toEqual('Updated Post One')
      expect(updatedPost.deletedAt).toBeUndefined()
    })
  })

  describe('update operation', () => {
    it('should update only normal document when trash: false', async () => {
      const result = await payload.update({
        collection: postsSlug,
        data: {
          title: 'Updated Post',
        },
        trash: false,
        where: {
          title: {
            exists: true,
          },
        },
      })

      expect(result.docs).toBeDefined()
      expect(result.docs.length).toBeGreaterThan(0)

      const updatedPost: Post = result.docs[0]!

      expect(updatedPost?.id).toEqual(postOne.id)
      expect(updatedPost?.title).toEqual('Updated Post')
      expect(updatedPost?.deletedAt).toBeUndefined()
    })

    it('should update all documents including soft-deleted documents when trash: true', async () => {
      const result = await payload.update({
        collection: postsSlug,
        data: {
          title: 'A New Updated Post',
        },
        trash: true,
        where: {
          title: {
            exists: true,
          },
        },
      })

      expect(result.docs).toBeDefined()
      expect(result.docs.length).toBeGreaterThan(0)

      const updatedPostOne: Post = result.docs.find((doc) => doc.id === postOne.id)!
      const updatedPostTwo: Post = result.docs.find((doc) => doc.id === postTwo.id)!

      expect(updatedPostOne?.title).toEqual('A New Updated Post')
      expect(updatedPostOne?.deletedAt).toBeUndefined()

      expect(updatedPostTwo?.title).toEqual('A New Updated Post')
      expect(updatedPostTwo?.deletedAt).toBeDefined()
    })
  })

  describe('delete operation', () => {
    it('should perma delete all docs including soft-deleted documents when trash: true', async () => {
      await payload.delete({
        collection: postsSlug,
        trash: true,
        where: {
          title: {
            exists: true,
          },
        },
      })

      const allDocs = await payload.find({
        collection: postsSlug,
        trash: true,
      })

      expect(allDocs.totalDocs).toEqual(0)
    })

    it('should only perma delete normal docs when trash: false', async () => {
      await payload.delete({
        collection: postsSlug,
        trash: false,
        where: {
          title: {
            exists: true,
          },
        },
      })

      const allDocs = await payload.find({
        collection: postsSlug,
        trash: true,
      })

      expect(allDocs.totalDocs).toEqual(1)
      expect(allDocs.docs[0]?.id).toEqual(postTwo.id)
    })
  })

  describe('deleteByID operation', () => {
    it('should throw NotFound error when trying to delete a soft-deleted document w/o trash: true', async () => {
      await expect(
        payload.delete({
          collection: postsSlug,
          id: postTwo.id,
        }),
      ).rejects.toThrow('Not Found')

      await expect(
        payload.delete({
          collection: postsSlug,
          id: postTwo.id,
          trash: false,
        }),
      ).rejects.toThrow('Not Found')
    })

    it('should delete a soft-deleted document when trash: true', async () => {
      await payload.delete({
        collection: postsSlug,
        id: postTwo.id,
        trash: true,
      })

      const allDocs = await payload.find({
        collection: postsSlug,
        trash: true,
      })

      expect(allDocs.totalDocs).toEqual(1)
      expect(allDocs.docs[0]?.id).toEqual(postOne.id)
    })
  })
})
