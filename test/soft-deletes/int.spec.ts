import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Page, Post } from './payload-types.js'

import { regularUser } from '../credentials.js'
import { idToString } from '../helpers/idToString.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { pagesSlug } from './collections/Pages/index.js'
import { postsSlug } from './collections/Posts/index.js'
import { usersSlug } from './collections/Users/index.js'

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

  let pageOne: Page
  let postOne: Post
  let postTwo: Post

  beforeEach(async () => {
    await restClient.login({
      slug: usersSlug,
      credentials: regularUser,
    })

    user = await payload.login({
      collection: usersSlug,
      data: {
        email: regularUser.email,
        password: regularUser.password,
      },
    })

    pageOne = await payload.create({
      collection: pagesSlug,
      data: {
        title: 'Page one',
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

  // Access control tests use the Pages collection because it has delete access control enabled.
  // The Posts collection does not have any access restrictions and is used for general CRUD tests.
  describe('Access control', () => {
    it('should not allow bulk soft-deleting documents when restricted by delete access', async () => {
      await expect(
        payload.update({
          collection: pagesSlug,
          data: {
            deletedAt: new Date().toISOString(),
          },
          user, // Regular user does not have delete access
          where: {
            // Using where to target multiple documents
            title: {
              equals: pageOne.title,
            },
          },
          overrideAccess: false, // Override access to false to test access control
        }),
      ).rejects.toMatchObject({
        status: 403,
        name: 'Forbidden',
        message: expect.stringContaining('You are not allowed'),
      })
    })

    it('should not allow soft-deleting a document when restricted by delete access', async () => {
      await expect(
        payload.update({
          collection: pagesSlug,
          data: {
            deletedAt: new Date().toISOString(),
          },
          id: pageOne.id, // Using ID to target specific document
          user, // Regular user does not have delete access
          overrideAccess: false, // Override access to false to test access control
        }),
      ).rejects.toMatchObject({
        status: 403,
        name: 'Forbidden',
        message: expect.stringContaining('You are not allowed'),
      })
    })
  })

  describe('LOCAL API', () => {
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
    })

    describe('findByID operation', () => {
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

    describe('findVersions operation', () => {
      beforeAll(async () => {
        await payload.update({
          collection: postsSlug,
          data: {
            title: 'Some updated title',
          },
          trash: true,
          where: {
            title: {
              exists: true,
            },
          },
        })
      })
      it('should return all versions including soft-deleted docs in findVersions with trash: true', async () => {
        const allVersions = await payload.findVersions({
          collection: postsSlug,
          trash: true,
        })

        expect(allVersions.totalDocs).toEqual(2)
        expect(allVersions.docs[0]?.parent).toEqual(postTwo.id)
        expect(allVersions.docs[1]?.parent).toEqual(postOne.id)
      })

      it('should return only soft-deleted docs in findVersions with trash: true', async () => {
        const softDeletedVersions = await payload.findVersions({
          collection: postsSlug,
          where: {
            'version.deletedAt': {
              exists: true,
            },
          },
          trash: true,
        })

        expect(softDeletedVersions.totalDocs).toEqual(1)
        expect(softDeletedVersions.docs[0]?.parent).toEqual(postTwo.id)
      })

      it('should return only non-soft-deleted docs in findVersions with trash: false', async () => {
        const normalVersions = await payload.findVersions({
          collection: postsSlug,
          trash: false,
        })

        expect(normalVersions.totalDocs).toEqual(1)
        expect(normalVersions.docs[0]?.parent).toEqual(postOne.id)
      })
    })

    describe('findVersionByID operation', () => {
      beforeAll(async () => {
        await payload.update({
          collection: postsSlug,
          data: {
            title: 'Some updated title',
          },
          trash: true,
          where: {
            title: {
              exists: true,
            },
          },
        })
      })

      it('should return a soft-deleted version document when trash: true', async () => {
        const softDeletedVersions = await payload.findVersions({
          collection: postsSlug,
          where: {
            'version.deletedAt': {
              exists: true,
            },
          },
          trash: true,
        })

        expect(softDeletedVersions.docs).toHaveLength(1)

        const version = softDeletedVersions.docs[0]

        const softDeletedVersionPost = await payload.findVersionByID({
          collection: postsSlug,
          id: version!.id,
          trash: true,
        })

        expect(softDeletedVersionPost).toBeDefined()
        expect(softDeletedVersionPost?.parent).toEqual(postTwo.id)
        expect(softDeletedVersionPost?.version?.deletedAt).toBeDefined()
        expect(softDeletedVersionPost?.version?.deletedAt).toEqual(postTwo.deletedAt)
      })

      it('should throw NotFound error when trying to find a soft-deleted version document w/o trash: true', async () => {
        const softDeletedVersions = await payload.findVersions({
          collection: postsSlug,
          where: {
            'version.deletedAt': {
              exists: true,
            },
          },
          trash: true,
        })

        expect(softDeletedVersions.docs).toHaveLength(1)

        const version = softDeletedVersions.docs[0]

        await expect(
          payload.findVersionByID({
            collection: postsSlug,
            id: version!.id,
          }),
        ).rejects.toThrow('Not Found')

        await expect(
          payload.findVersionByID({
            collection: postsSlug,
            id: version!.id,
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
        expect(updatedPost.deletedAt).toBeFalsy()
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
        expect(updatedPost?.deletedAt).toBeFalsy()
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
        expect(updatedPostOne?.deletedAt).toBeFalsy()

        expect(updatedPostTwo?.title).toEqual('A New Updated Post')
        expect(updatedPostTwo?.deletedAt).toBeDefined()
      })

      it('should only update soft-deleted documents when trash: true and where[deletedAt][exists]=true', async () => {
        const postThree = await payload.create({
          collection: postsSlug,
          data: {
            title: 'Post three',
            deletedAt: new Date().toISOString(),
          },
        })

        const result = await payload.update({
          collection: postsSlug,
          data: {
            title: 'Updated Soft Deleted Post',
          },
          trash: true,
          where: {
            deletedAt: {
              exists: true,
            },
          },
        })
        expect(result.docs).toBeDefined()
        expect(result.docs[0]?.id).toEqual(postThree.id)
        expect(result.docs[0]?.title).toEqual('Updated Soft Deleted Post')
        expect(result.docs[0]?.deletedAt).toEqual(postThree.deletedAt)
        expect(result.docs[1]?.id).toEqual(postTwo.id)
        expect(result.docs[1]?.title).toEqual('Updated Soft Deleted Post')
        expect(result.docs[1]?.deletedAt).toEqual(postTwo.deletedAt)

        // Clean up
        await payload.delete({
          collection: postsSlug,
          id: postThree.id,
          trash: true,
        })
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

  describe('REST API', () => {
    describe('find endpoint', () => {
      it('should return all docs including soft-deleted docs in find with trash=true', async () => {
        const res = await restClient.GET(`/${postsSlug}?trash=true`)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.docs).toHaveLength(2)
      })

      it('should return only soft-deleted docs with trash=true and where[deletedAt][exists]=true', async () => {
        const res = await restClient.GET(`/${postsSlug}?trash=true&where[deletedAt][exists]=true`)
        const data = await res.json()
        expect(data.docs).toHaveLength(1)
        expect(data.docs[0]?.id).toEqual(postTwo.id)
      })

      it('should return only normal docs when trash=false', async () => {
        const res = await restClient.GET(`/${postsSlug}?trash=false`)
        const data = await res.json()
        expect(data.docs).toHaveLength(1)
        expect(data.docs[0]?.id).toEqual(postOne.id)
      })
    })

    describe('findByID endpoint', () => {
      it('should return a soft-deleted doc by ID with trash=true', async () => {
        const res = await restClient.GET(`/${postsSlug}/${postTwo.id}?trash=true`)
        const data = await res.json()
        expect(data?.id).toEqual(postTwo.id)
        expect(data?.deletedAt).toEqual(postTwo.deletedAt)
      })

      it('should 404 when trying to get a soft-deleted doc without trash=true', async () => {
        const res = await restClient.GET(`/${postsSlug}/${postTwo.id}`)
        expect(res.status).toBe(404)
      })
    })

    describe('find versions endpoint', () => {
      beforeAll(async () => {
        await payload.update({
          collection: postsSlug,
          data: {
            title: 'Some updated title',
          },
          trash: true,
          where: {
            title: {
              exists: true,
            },
          },
        })
      })
      it('should return all versions including soft-deleted docs in findVersions with trash: true', async () => {
        const res = await restClient.GET(`/${postsSlug}/versions?trash=true`)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.docs).toHaveLength(2)
      })

      it('should return only soft-deleted docs in findVersions with trash: true', async () => {
        const res = await restClient.GET(
          `/${postsSlug}/versions?trash=true&where[version.deletedAt][exists]=true`,
        )
        const data = await res.json()
        expect(data.docs).toHaveLength(1)
        expect(data.docs[0]?.parent).toEqual(postTwo.id)
      })

      it('should return only non-soft-deleted docs in findVersions with trash: false', async () => {
        const res = await restClient.GET(`/${postsSlug}/versions?trash=false`)
        const data = await res.json()
        expect(data.docs).toHaveLength(1)
        expect(data.docs[0]?.parent).toEqual(postOne.id)
      })
    })

    describe('findVersionByID endpoint', () => {
      beforeAll(async () => {
        await payload.update({
          collection: postsSlug,
          data: {
            title: 'Some updated title',
          },
          trash: true,
          where: {
            title: {
              exists: true,
            },
          },
        })
      })

      it('should return a soft-deleted version document when trash: true', async () => {
        const softDeletedVersions = await restClient.GET(
          `/${postsSlug}/versions?trash=true&where[version.deletedAt][exists]=true`,
        )

        const softDeletedVersionsData = await softDeletedVersions.json()
        expect(softDeletedVersionsData.docs).toHaveLength(1)

        const version = softDeletedVersionsData.docs[0]

        const versionPost = await restClient.GET(`/${postsSlug}/versions/${version!.id}?trash=true`)
        const softDeletedVersionPost = await versionPost.json()

        expect(softDeletedVersionPost).toBeDefined()
        expect(softDeletedVersionPost?.parent).toEqual(postTwo.id)
        expect(softDeletedVersionPost?.version?.deletedAt).toBeDefined()
        expect(softDeletedVersionPost?.version?.deletedAt).toEqual(postTwo.deletedAt)
      })

      it('should throw NotFound error when trying to find a soft-deleted version document w/o trash: true', async () => {
        const softDeletedVersions = await restClient.GET(
          `/${postsSlug}/versions?trash=true&where[version.deletedAt][exists]=true`,
        )

        const softDeletedVersionsData = await softDeletedVersions.json()
        expect(softDeletedVersionsData.docs).toHaveLength(1)

        const version = softDeletedVersionsData.docs[0]

        const withoutTrash = await restClient.GET(`/${postsSlug}/versions/${version!.id}`)
        expect(withoutTrash.status).toBe(404)

        const withTrashFalse = await restClient.GET(
          `/${postsSlug}/versions/${version!.id}?trash=false`,
        )
        expect(withTrashFalse.status).toBe(404)
      })
    })

    describe('updateByID endpoint', () => {
      it('should update a single soft-deleted doc when trash=true', async () => {
        const res = await restClient.PATCH(`/${postsSlug}/${postTwo.id}?trash=true`, {
          body: JSON.stringify({
            title: 'Updated via REST',
          }),
        })

        const result = await res.json()
        expect(result.doc.title).toBe('Updated via REST')
        expect(result.doc.deletedAt).toEqual(postTwo.deletedAt)
      })

      it('should throw NotFound error when trying to update a soft-deleted document w/o trash: true', async () => {
        const res = await restClient.PATCH(`/${postsSlug}/${postTwo.id}`, {
          body: JSON.stringify({ title: 'Fail Update' }),
        })
        expect(res.status).toBe(404)
      })

      it('should update a single normal document when trash: false', async () => {
        const res = await restClient.PATCH(`/${postsSlug}/${postOne.id}?trash=false`, {
          body: JSON.stringify({ title: 'Updated Normal via REST' }),
        })
        const result = await res.json()
        expect(result.doc.title).toBe('Updated Normal via REST')
        expect(result.doc.deletedAt).toBeFalsy()
      })
    })

    describe('update endpoint', () => {
      it('should update only normal document when trash: false', async () => {
        const query = `?trash=false&where[id][equals]=${postOne.id}`

        const res = await restClient.PATCH(`/${postsSlug}${query}`, {
          body: JSON.stringify({ title: 'Updated Normal via REST' }),
        })

        const result = await res.json()
        expect(result.docs).toHaveLength(1)
        expect(result.docs[0].id).toBe(postOne.id)
        expect(result.docs[0].title).toBe('Updated Normal via REST')
        expect(result.docs[0].deletedAt).toBeFalsy()
      })

      it('should update all documents including soft-deleted documents when trash: true', async () => {
        const query = `?trash=true&where[title][exists]=true`

        const res = await restClient.PATCH(`/${postsSlug}${query}`, {
          body: JSON.stringify({ title: 'Bulk Updated All' }),
        })

        const result = await res.json()
        expect(result.docs).toHaveLength(2)
        expect(result.docs.every((doc: Post) => doc.title === 'Bulk Updated All')).toBe(true)
      })

      it('should only update soft-deleted documents when trash: true and where[deletedAt][exists]=true', async () => {
        const query = `?trash=true&where[deletedAt][exists]=true`

        const postThree = await payload.create({
          collection: postsSlug,
          data: {
            title: 'Post three',
            deletedAt: new Date().toISOString(),
          },
        })

        const res = await restClient.PATCH(`/${postsSlug}${query}`, {
          body: JSON.stringify({ title: 'Updated Soft Deleted Post' }),
        })

        const result = await res.json()
        expect(result.docs).toHaveLength(2)

        expect(result.docs).toBeDefined()
        expect(result.docs[0]?.id).toEqual(postThree.id)
        expect(result.docs[0]?.title).toEqual('Updated Soft Deleted Post')
        expect(result.docs[0]?.deletedAt).toEqual(postThree.deletedAt)
        expect(result.docs[1]?.id).toEqual(postTwo.id)
        expect(result.docs[1]?.title).toEqual('Updated Soft Deleted Post')
        expect(result.docs[1]?.deletedAt).toEqual(postTwo.deletedAt)

        // Clean up
        await payload.delete({
          collection: postsSlug,
          id: postThree.id,
          trash: true,
        })
      })
    })

    describe('delete endpoint', () => {
      it('should perma delete all docs including soft-deleted documents when trash: true', async () => {
        const query = `?trash=true&where[title][exists]=true`

        const res = await restClient.DELETE(`/${postsSlug}${query}`)
        expect(res.status).toBe(200)

        const result = await res.json()
        expect(result.docs).toHaveLength(2)

        const check = await restClient.GET(`/${postsSlug}?trash=true`)
        const checkData = await check.json()
        expect(checkData.docs).toHaveLength(0)
      })

      it('should only perma delete normal docs when trash: false', async () => {
        const query = `?trash=false&where[title][exists]=true`

        const res = await restClient.DELETE(`/${postsSlug}${query}`)
        expect(res.status).toBe(200)

        const result = await res.json()
        expect(result.docs).toHaveLength(1)
        expect(result.docs[0]?.id).toBe(postOne.id)

        const check = await restClient.GET(`/${postsSlug}?trash=true`)
        const checkData = await check.json()

        // Make sure postTwo (soft-deleted) is still there
        expect(checkData.docs.some((doc: Post) => doc.id === postTwo.id)).toBe(true)
      })
    })

    describe('deleteByID endpoint', () => {
      it('should throw NotFound error when trying to delete a soft-deleted document w/o trash: true', async () => {
        const res = await restClient.DELETE(`/${postsSlug}/${postTwo.id}`)
        expect(res.status).toBe(404)
      })

      it('should delete a soft-deleted document when trash: true', async () => {
        const res = await restClient.DELETE(`/${postsSlug}/${postTwo.id}?trash=true`)
        expect(res.status).toBe(200)
        const result = await res.json()
        expect(result.doc.id).toBe(postTwo.id)
      })
    })
  })

  describe('GRAPHQL API', () => {
    describe('find query', () => {
      it('should return all docs including soft-deleted docs in find with trash=true', async () => {
        const query = `
          query {
            Posts(trash: true) {
              docs {
                id
                title
                deletedAt
              }
            }
          }
        `

        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.data.Posts.docs).toHaveLength(2)
      })

      it('should return only soft-deleted docs with trash=true and where[deletedAt][exists]=true', async () => {
        const query = `
          query {
            Posts(
              trash: true
              where: { deletedAt: { exists: true } }
            ) {
              docs {
                id
                deletedAt
              }
            }
          }
        `

        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.data.Posts.docs).toHaveLength(1)
        expect(res.data.Posts.docs[0].id).toEqual(postTwo.id)
      })

      it('should return only normal docs when trash=false', async () => {
        const query = `
          query {
            Posts(trash: false) {
              docs {
                id
                deletedAt
              }
            }
          }
        `

        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.data.Posts.docs).toHaveLength(1)
        expect(res.data.Posts.docs[0].id).toEqual(postOne.id)
        expect(res.data.Posts.docs[0].deletedAt).toBeNull()
      })
    })

    describe('findByID query', () => {
      it('should return a soft-deleted doc by ID with trash=true', async () => {
        const query = `
          query {
            Post(id: ${idToString(postTwo.id, payload)}, trash: true) {
              id
              deletedAt
            }
          }
        `

        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.data.Post.id).toBe(postTwo.id)
        expect(res.data.Post.deletedAt).toBe(postTwo.deletedAt)
      })

      it('should 404 when trying to get a soft-deleted doc without trash=true', async () => {
        const query = `
          query {
            Post(id: ${idToString(postTwo.id, payload)}) {
              id
            }
          }
        `

        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())
        expect(res.errors?.[0]?.message).toMatch(/not found/i)
      })
    })

    describe('find versions query', () => {
      beforeAll(async () => {
        await payload.update({
          collection: postsSlug,
          data: {
            title: 'Some updated title',
          },
          trash: true,
          where: {
            title: {
              exists: true,
            },
          },
        })
      })
      it('should return all versions including soft-deleted docs in findVersions with trash: true', async () => {
        const query = `
          query {
            versionsPosts(trash: true) {
              docs {
                id
                version {
                  title
                  deletedAt
                }
              }
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.data.versionsPosts.docs).toHaveLength(2)
      })

      it('should return only soft-deleted docs in findVersions with trash: true', async () => {
        const query = `
          query {
            versionsPosts(
              trash: true,
              where: {
                version__deletedAt: {
                  exists: true
                }
              }
            ) {
              docs {
                id
                version {
                  title
                  deletedAt
                }
              }
            }
          }
        `

        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        const { docs } = res.data.versionsPosts

        // Should only include soft-deleted versions
        expect(docs).toHaveLength(1)

        for (const doc of docs) {
          expect(doc.version.deletedAt).toBeDefined()
        }
      })

      it('should return only non-soft-deleted docs in findVersions with trash: false', async () => {
        const query = `
          query {
            versionsPosts(trash: false) {
              docs {
                id
                version {
                  title
                  deletedAt
                }
              }
            }
          }
        `

        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        const { docs } = res.data.versionsPosts

        // All versions returned should NOT have deletedAt set
        for (const doc of docs) {
          expect(doc.version.deletedAt).toBeNull()
        }
      })
    })

    describe('findVersionByID endpoint', () => {
      beforeAll(async () => {
        await payload.update({
          collection: postsSlug,
          data: {
            title: 'Some updated title',
          },
          trash: true,
          where: {
            title: {
              exists: true,
            },
          },
        })
      })

      it('should return a soft-deleted document when trash: true', async () => {
        // First, get the version ID of the soft-deleted post
        const listQuery = `
          query {
            versionsPosts(
              trash: true,
              where: {
                version__deletedAt: {
                  exists: true
                }
              }
            ) {
              docs {
                id
                version {
                  deletedAt
                }
              }
            }
          }
        `
        const listRes = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query: listQuery }) })
          .then((r) => r.json())

        const softDeletedVersion = listRes.data.versionsPosts.docs[0]

        const detailQuery = `
          query {
            versionPost(id: ${idToString(softDeletedVersion.id, payload)}, trash: true) {
              id
              version {
                deletedAt
              }
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query: detailQuery }) })
          .then((r) => r.json())

        expect(res.data.versionPost.id).toBe(softDeletedVersion.id)
        expect(res.data.versionPost.version.deletedAt).toBe(postTwo.deletedAt)
      })

      it('should throw NotFound error when trying to find a soft-deleted version document w/o trash: true', async () => {
        // First, get the version ID of the soft-deleted post
        const listQuery = `
          query {
            versionsPosts(
              trash: true,
              where: {
                version__deletedAt: {
                  exists: true
                }
              }
            ) {
              docs {
                id
              }
            }
          }
        `
        const listRes = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query: listQuery }) })
          .then((r) => r.json())

        const softDeletedVersion = listRes.data.versionsPosts.docs[0]

        const detailQuery = `
          query {
            versionPost(id: ${idToString(softDeletedVersion.id, payload)}) {
              id
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query: detailQuery }) })
          .then((r) => r.json())

        expect(res.errors?.[0]?.message).toMatch(/not found/i)
      })
    })

    describe('updateByID query', () => {
      it('should update a single soft-deleted doc when trash=true', async () => {
        const query = `
          mutation {
            updatePost(id: ${idToString(postTwo.id, payload)}, trash: true, data: { title: "Updated Soft Deleted via GQL" }) {
              id
              title
              deletedAt
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.data.updatePost.id).toBe(postTwo.id)
        expect(res.data.updatePost.title).toBe('Updated Soft Deleted via GQL')
        expect(res.data.updatePost.deletedAt).toBe(postTwo.deletedAt)
      })

      it('should throw NotFound error when trying to update a soft-deleted document w/o trash: true', async () => {
        const query = `
          mutation {
            updatePost(id: ${idToString(postTwo.id, payload)}, data: { title: "Should Fail" }) {
              id
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())
        expect(res.errors?.[0]?.message).toMatch(/not found/i)
      })

      it('should update a single normal document when trash: false', async () => {
        const query = `
          mutation {
            updatePost(id: ${idToString(postOne.id, payload)}, trash: false, data: { title: "Updated Normal via GQL" }) {
              id
              title
              deletedAt
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.data.updatePost.id).toBe(postOne.id)
        expect(res.data.updatePost.title).toBe('Updated Normal via GQL')
        expect(res.data.updatePost.deletedAt).toBeNull()
      })
    })

    // describe('update endpoint', () => {
    //   it.todo('should update only normal document when trash: false')

    //   it.todo('should update all documents including soft-deleted documents when trash: true')

    //   it.todo(
    //     'should only update soft-deleted documents when trash: true and where[deletedAt][exists]=true',
    //   )
    // })

    // describe('delete endpoint', () => {
    //   it.todo('should perma delete all docs including soft-deleted documents when trash: true')

    //   it.todo('should only perma delete normal docs when trash: false')
    // })

    describe('deleteByID query', () => {
      it('should throw NotFound error when trying to delete a soft-deleted document w/o trash: true', async () => {
        const query = `
          mutation {
            deletePost(id: ${idToString(postTwo.id, payload)}) {
                id
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        console.log(res)
        expect(res.errors?.[0]?.message).toMatch(/not found/i)
      })

      it('should delete a soft-deleted document when trash: true', async () => {
        const query = `
          mutation {
            deletePost(id: ${idToString(postTwo.id, payload)}, trash: true) {
                id
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())
        expect(res.data.deletePost.id).toBe(postTwo.id)
      })
    })
  })
})
