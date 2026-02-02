import type { CollectionSlug, Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'
import type { Post, RestrictedCollection } from './payload-types.js'

import { regularUser } from '../credentials.js'
import { idToString } from '../__helpers/shared/idToString.js'
import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { postsSlug } from './collections/Posts/index.js'
import { restrictedCollectionSlug } from './collections/RestrictedCollection/index.js'
import { usersSlug } from './collections/Users/index.js'

let restClient: NextRESTClient
let payload: Payload
let user: any

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('trash', () => {
  beforeAll(async () => {
    const initResult = await initPayloadInt(dirname)

    payload = initResult.payload
    restClient = initResult.restClient
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  let restrictedCollectionDoc: RestrictedCollection
  let postsDocOne: Post
  let postsDocTwo: Post

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

    restrictedCollectionDoc = await payload.create({
      collection: restrictedCollectionSlug as CollectionSlug,
      data: {
        title: 'With Access Control one',
      },
    })

    postsDocOne = await payload.create({
      collection: postsSlug,
      data: {
        title: 'Doc one',
      },
    })

    postsDocTwo = await payload.create({
      collection: postsSlug,
      data: {
        title: 'Doc two',
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
  // The Post collection does not have any access restrictions and is used for general CRUD tests.
  describe('Access control', () => {
    it('should not allow bulk soft-deleting documents when restricted by delete access', async () => {
      await expect(
        payload.update({
          collection: restrictedCollectionSlug as CollectionSlug,
          data: {
            deletedAt: new Date().toISOString(),
          },
          user, // Regular user does not have delete access
          where: {
            // Using where to target multiple documents
            title: {
              equals: restrictedCollectionDoc.title,
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
          collection: restrictedCollectionSlug as CollectionSlug,
          data: {
            deletedAt: new Date().toISOString(),
          },
          id: restrictedCollectionDoc.id, // Using ID to target specific document
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
    describe('find', () => {
      it('should return all docs including soft-deleted docs in find with trash: true', async () => {
        const allDocs = await payload.find({
          collection: postsSlug,
          trash: true,
        })

        expect(allDocs.totalDocs).toEqual(2)
      })

      it('should return only soft-deleted docs in find with trash: true', async () => {
        const trashedDocs = await payload.find({
          collection: postsSlug,
          where: {
            deletedAt: {
              exists: true,
            },
          },
          trash: true,
        })

        expect(trashedDocs.totalDocs).toEqual(1)
        expect(trashedDocs.docs[0]?.id).toEqual(postsDocTwo.id)
      })

      it('should return only non-soft-deleted docs in find with trash: false', async () => {
        const normalDocs = await payload.find({
          collection: postsSlug,
          trash: false,
        })

        expect(normalDocs.totalDocs).toEqual(1)
        expect(normalDocs.docs[0]?.id).toEqual(postsDocOne.id)
      })

      it('should find restored documents after setting deletedAt to null', async () => {
        await payload.update({
          collection: postsSlug,
          id: postsDocTwo.id,
          data: {
            deletedAt: null,
          },
          trash: true,
        })

        const result = await payload.find({
          collection: postsSlug,
          trash: false, // Normal query should return it now
        })

        const restored = result.docs.find(
          (doc) => (doc.id as number | string) === (postsDocTwo.id as number | string),
        )

        expect(restored).toBeDefined()
        expect(restored?.deletedAt).toBeNull()
      })
    })

    describe('findDistinct', () => {
      it('should return all unique values for a field (excluding soft-deleted docs by default)', async () => {
        // Add a duplicate title
        await payload.create({
          collection: postsSlug,
          data: { title: 'Doc one' },
        })

        const result = await payload.findDistinct({
          collection: postsSlug,
          field: 'title',
        })

        const titles = result.values.map((v) => v.title)

        // Expect only distinct titles of non-trashed docs
        expect(titles).toContain('Doc one')
        expect(titles).not.toContain('Doc two') // because it's soft-deleted
        expect(titles).toHaveLength(1)
      })

      it('should include soft-deleted docs when trash: true', async () => {
        const result = await payload.findDistinct({
          collection: postsSlug,
          field: 'title',
          trash: true,
        })

        const titles = result.values.map((v) => v.title)

        expect(titles).toContain('Doc one')
        expect(titles).toContain('Doc two') // soft-deleted doc
      })

      it('should return only distinct values from soft-deleted docs when where[deletedAt][exists]=true', async () => {
        const result = await payload.findDistinct({
          collection: postsSlug,
          field: 'title',
          trash: true,
          where: {
            deletedAt: { exists: true },
          },
        })

        const titles = result.values.map((v) => v.title)
        expect(titles).toEqual(['Doc two']) // Only the soft-deleted doc
      })

      it('should respect where filters when retrieving distinct values', async () => {
        const result = await payload.findDistinct({
          collection: postsSlug,
          field: 'title',
          trash: true,
          where: {
            title: { equals: 'Doc two' },
          },
        })

        const titles = result.values.map((v) => v.title)
        expect(titles).toEqual(['Doc two'])
      })
    })

    describe('findByID operation', () => {
      it('should return a soft-deleted document when trash: true', async () => {
        const trashedPostDoc: Post = await payload.findByID({
          collection: postsSlug,
          id: postsDocTwo.id,
          trash: true,
        })

        expect(trashedPostDoc).toBeDefined()
        expect(trashedPostDoc?.id).toEqual(postsDocTwo.id)
        expect(trashedPostDoc?.deletedAt).toBeDefined()
        expect(trashedPostDoc?.deletedAt).toEqual(postsDocTwo.deletedAt)
      })

      it('should throw NotFound error when trying to find a soft-deleted document w/o trash: true', async () => {
        await expect(
          payload.findByID({
            collection: postsSlug,
            id: postsDocTwo.id,
          }),
        ).rejects.toThrow('Not Found')

        await expect(
          payload.findByID({
            collection: postsSlug,
            id: postsDocTwo.id,
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
        expect(allVersions.docs[0]?.parent).toEqual(postsDocTwo.id)
        expect(allVersions.docs[1]?.parent).toEqual(postsDocOne.id)
      })

      it('should return only soft-deleted docs in findVersions with trash: true', async () => {
        const trashedVersions = await payload.findVersions({
          collection: postsSlug,
          where: {
            'version.deletedAt': {
              exists: true,
            },
          },
          trash: true,
        })

        expect(trashedVersions.totalDocs).toEqual(1)
        expect(trashedVersions.docs[0]?.parent).toEqual(postsDocTwo.id)
      })

      it('should return only non-soft-deleted docs in findVersions with trash: false', async () => {
        const normalVersions = await payload.findVersions({
          collection: postsSlug,
          trash: false,
        })

        expect(normalVersions.totalDocs).toEqual(1)
        expect(normalVersions.docs[0]?.parent).toEqual(postsDocOne.id)
      })

      it('should find versions where version.deletedAt is null after restore', async () => {
        await payload.update({
          collection: postsSlug,
          id: postsDocTwo.id,
          data: {
            deletedAt: null,
          },
          trash: true,
        })

        const versions = await payload.findVersions({
          collection: postsSlug,
          trash: true,
          where: {
            'version.deletedAt': {
              equals: null,
            },
          },
        })

        expect(versions.docs.some((v) => v.parent === postsDocTwo.id)).toBe(true)
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
        const trashedVersions = await payload.findVersions({
          collection: postsSlug,
          where: {
            'version.deletedAt': {
              exists: true,
            },
          },
          trash: true,
        })

        expect(trashedVersions.docs).toHaveLength(1)

        const version = trashedVersions.docs[0]

        const trashedVersionDoc = await payload.findVersionByID({
          collection: postsSlug,
          id: version!.id,
          trash: true,
        })

        expect(trashedVersionDoc).toBeDefined()
        expect(trashedVersionDoc?.parent).toEqual(postsDocTwo.id)
        expect(trashedVersionDoc?.version?.deletedAt).toBeDefined()
        expect(trashedVersionDoc?.version?.deletedAt).toEqual(postsDocTwo.deletedAt)
      })

      it('should throw NotFound error when trying to find a soft-deleted version document w/o trash: true', async () => {
        const trashedVersions = await payload.findVersions({
          collection: postsSlug,
          where: {
            'version.deletedAt': {
              exists: true,
            },
          },
          trash: true,
        })

        expect(trashedVersions.docs).toHaveLength(1)

        const version = trashedVersions.docs[0]

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
        const updatedPostDoc: Post = await payload.update({
          collection: postsSlug,
          id: postsDocTwo.id,
          data: {
            title: 'Updated Doc Two',
          },
          trash: true,
        })

        expect(updatedPostDoc).toBeDefined()
        expect(updatedPostDoc.id).toEqual(postsDocTwo.id)
        expect(updatedPostDoc.title).toEqual('Updated Doc Two')
        expect(updatedPostDoc.deletedAt).toBeDefined()
        expect(updatedPostDoc.deletedAt).toEqual(postsDocTwo.deletedAt)
      })

      it('should throw NotFound error when trying to update a soft-deleted document w/o trash: true', async () => {
        await expect(
          payload.update({
            collection: postsSlug,
            id: postsDocTwo.id,
            data: {
              title: 'Updated Doc Two',
            },
          }),
        ).rejects.toThrow('Not Found')

        await expect(
          payload.update({
            collection: postsSlug,
            id: postsDocTwo.id,
            data: {
              title: 'Updated Doc Two',
            },
            trash: false,
          }),
        ).rejects.toThrow('Not Found')
      })

      it('should update a single normal document when trash: false', async () => {
        const updatedPostDoc: Post = await payload.update({
          collection: postsSlug,
          id: postsDocOne.id,
          data: {
            title: 'Updated Doc One',
          },
        })

        expect(updatedPostDoc).toBeDefined()
        expect(updatedPostDoc.id).toEqual(postsDocOne.id)
        expect(updatedPostDoc.title).toEqual('Updated Doc One')
        expect(updatedPostDoc.deletedAt).toBeFalsy()
      })

      it('should restore a soft-deleted document by setting deletedAt to null', async () => {
        const restored = await payload.update({
          collection: postsSlug,
          id: postsDocTwo.id,
          data: {
            deletedAt: null,
          },
          trash: true,
        })

        expect(restored.deletedAt).toBeNull()

        // Should now show up in trash: false queries
        const result = await payload.find({
          collection: postsSlug,
          trash: false,
        })

        const found = result.docs.find((doc) => doc.id === postsDocTwo.id)
        expect(found).toBeDefined()
        expect(found?.deletedAt).toBeNull()
      })
    })

    describe('update operation', () => {
      it('should update only normal document when trash: false', async () => {
        const result = await payload.update({
          collection: postsSlug,
          data: {
            title: 'Updated Doc',
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

        const updatedDoc = result.docs[0]

        expect(updatedDoc?.id).toEqual(postsDocOne.id)
        expect(updatedDoc?.title).toEqual('Updated Doc')
        expect(updatedDoc?.deletedAt).toBeFalsy()
      })

      it('should update all documents including soft-deleted documents when trash: true', async () => {
        const result = await payload.update({
          collection: postsSlug,
          data: {
            title: 'A New Updated Doc',
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

        const updatedPostdDocOne = result.docs.find((doc) => doc.id === postsDocOne.id)
        const updatedPostdDocTwo = result.docs.find((doc) => doc.id === postsDocTwo.id)

        expect(updatedPostdDocOne?.title).toEqual('A New Updated Doc')
        expect(updatedPostdDocOne?.deletedAt).toBeFalsy()

        expect(updatedPostdDocTwo?.title).toEqual('A New Updated Doc')
        expect(updatedPostdDocTwo?.deletedAt).toBeDefined()
      })

      it('should only update soft-deleted documents when trash: true and where[deletedAt][exists]=true', async () => {
        const docThree = await payload.create({
          collection: postsSlug,
          data: {
            title: 'Doc three',
            deletedAt: new Date().toISOString(),
          },
        })

        const result = await payload.update({
          collection: postsSlug,
          data: {
            title: 'Updated Soft Deleted Doc',
          },
          trash: true,
          where: {
            deletedAt: {
              exists: true,
            },
          },
        })
        expect(result.docs).toBeDefined()
        expect(result.docs[0]?.id).toEqual(docThree.id)
        expect(result.docs[0]?.title).toEqual('Updated Soft Deleted Doc')
        expect(result.docs[0]?.deletedAt).toEqual(docThree.deletedAt)
        expect(result.docs[1]?.id).toEqual(postsDocTwo.id)
        expect(result.docs[1]?.title).toEqual('Updated Soft Deleted Doc')
        expect(result.docs[1]?.deletedAt).toEqual(postsDocTwo.deletedAt)

        // Clean up
        await payload.delete({
          collection: postsSlug,
          id: docThree.id,
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
        expect(allDocs.docs[0]?.id).toEqual(postsDocTwo.id)
      })
    })

    describe('trashing documents with validation issues', () => {
      it('should allow trashing documents with empty required fields (draft scenario)', async () => {
        // Create a draft document with empty required field
        const draftDoc = await payload.create({
          collection: postsSlug,
          data: {
            title: '', // Empty required field
            _status: 'draft',
          },
          draft: true,
        })

        expect(draftDoc.title).toBe('')
        expect(draftDoc._status).toBe('draft')

        // Should be able to trash the document even with empty required field
        const trashedDoc = await payload.update({
          collection: postsSlug,
          id: draftDoc.id,
          data: {
            deletedAt: new Date().toISOString(),
          },
        })

        expect(trashedDoc.deletedAt).toBeDefined()
        expect(trashedDoc.title).toBe('') // Title should still be empty
        expect(trashedDoc._status).toBe('draft')

        // Clean up
        await payload.delete({
          collection: postsSlug,
          id: draftDoc.id,
          trash: true,
        })
      })

      it('should allow restoring trashed drafts with empty required fields as draft', async () => {
        // Create a draft document with empty required field
        const draftDoc = await payload.create({
          collection: postsSlug,
          data: {
            title: '', // Empty required field
            _status: 'draft',
          },
          draft: true,
        })

        // Trash it
        await payload.update({
          collection: postsSlug,
          id: draftDoc.id,
          data: {
            deletedAt: new Date().toISOString(),
          },
        })

        // Should be able to restore as draft without validation errors
        const restoredDoc = await payload.update({
          collection: postsSlug,
          id: draftDoc.id,
          data: {
            deletedAt: null,
            _status: 'draft',
          },
          trash: true,
        })

        expect(restoredDoc.deletedAt).toBeNull()
        expect(restoredDoc.title).toBe('')
        expect(restoredDoc._status).toBe('draft')

        // Clean up
        await payload.delete({
          collection: postsSlug,
          id: draftDoc.id,
          trash: true,
        })
      })

      it('should NOT allow restoring trashed drafts with empty required fields as published', async () => {
        // Create a draft document with empty required field
        const draftDoc = await payload.create({
          collection: postsSlug,
          data: {
            title: '', // Empty required field
            _status: 'draft',
          },
          draft: true,
        })

        // Trash it
        await payload.update({
          collection: postsSlug,
          id: draftDoc.id,
          data: {
            deletedAt: new Date().toISOString(),
          },
        })

        // Should NOT be able to restore as published - should fail validation
        await expect(
          payload.update({
            collection: postsSlug,
            id: draftDoc.id,
            data: {
              deletedAt: null,
              _status: 'published',
            },
            trash: true,
          }),
        ).rejects.toThrow(/invalid/i)

        // Clean up
        await payload.delete({
          collection: postsSlug,
          id: draftDoc.id,
          trash: true,
        })
      })
    })

    describe('deleteByID operation', () => {
      it('should throw NotFound error when trying to delete a soft-deleted document w/o trash: true', async () => {
        await expect(
          payload.delete({
            collection: postsSlug,
            id: postsDocTwo.id,
          }),
        ).rejects.toThrow('Not Found')

        await expect(
          payload.delete({
            collection: postsSlug,
            id: postsDocTwo.id,
            trash: false,
          }),
        ).rejects.toThrow('Not Found')
      })

      it('should delete a soft-deleted document when trash: true', async () => {
        await payload.delete({
          collection: postsSlug,
          id: postsDocTwo.id,
          trash: true,
        })

        const allDocs = await payload.find({
          collection: postsSlug,
          trash: true,
        })

        expect(allDocs.totalDocs).toEqual(1)
        expect(allDocs.docs[0]?.id).toEqual(postsDocOne.id)
      })
    })

    describe('restoreVersion operation', () => {
      it('should throw error when restoring a version of a trashed document', async () => {
        // Create a version of postsDocTwo (which is soft-deleted)
        await payload.update({
          collection: postsSlug,
          id: postsDocTwo.id,
          data: { title: 'Updated Before Restore Attempt' },
          trash: true,
        })

        const { docs: versions } = await payload.findVersions({
          collection: postsSlug,
          trash: true,
        })
        const version = versions.find((v) => v.parent === postsDocTwo.id)

        expect(version).toBeDefined()

        await expect(
          payload.restoreVersion({
            collection: postsSlug,
            id: version!.id,
          }),
        ).rejects.toThrow(/Cannot restore a version of a trashed document/i)
      })
    })

    describe('count operation', () => {
      it('should return total count of non-soft-deleted documents by default (trash: false)', async () => {
        const result = await payload.count({
          collection: postsSlug,
        })

        expect(result.totalDocs).toEqual(1) // Only postsDocOne
      })

      it('should return total count of all documents including soft-deleted when trash: true', async () => {
        const result = await payload.count({
          collection: postsSlug,
          trash: true,
        })

        expect(result.totalDocs).toEqual(2)
      })

      it('should return count of only soft-deleted documents when where[deletedAt][exists]=true', async () => {
        const result = await payload.count({
          collection: postsSlug,
          trash: true,
          where: { deletedAt: { exists: true } },
        })

        expect(result.totalDocs).toEqual(1) // Only postsDocTwo
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
        expect(data.docs[0]?.id).toEqual(postsDocTwo.id)
      })

      it('should return only normal docs when trash=false', async () => {
        const res = await restClient.GET(`/${postsSlug}?trash=false`)
        const data = await res.json()
        expect(data.docs).toHaveLength(1)
        expect(data.docs[0]?.id).toEqual(postsDocOne.id)
      })

      it('should find restored documents after setting deletedAt to null', async () => {
        await restClient.PATCH(`/${postsSlug}/${postsDocTwo.id}?trash=true`, {
          body: JSON.stringify({
            deletedAt: null,
          }),
        })

        const res = await restClient.GET(`/${postsSlug}?trash=false`)
        const data = await res.json()

        const restored = data.docs.find((doc: Post) => doc.id === postsDocTwo.id)

        expect(restored).toBeDefined()
        expect(restored.deletedAt).toBeNull()
      })
    })

    describe('findByID endpoint', () => {
      it('should return a soft-deleted doc by ID with trash=true', async () => {
        const res = await restClient.GET(`/${postsSlug}/${postsDocTwo.id}?trash=true`)
        const data = await res.json()
        expect(data?.id).toEqual(postsDocTwo.id)
        expect(data?.deletedAt).toEqual(postsDocTwo.deletedAt)
      })

      it('should 404 when trying to get a soft-deleted doc without trash=true', async () => {
        const res = await restClient.GET(`/${postsSlug}/${postsDocTwo.id}`)
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
        expect(data.docs[0]?.parent).toEqual(postsDocTwo.id)
      })

      it('should return only non-soft-deleted docs in findVersions with trash: false', async () => {
        const res = await restClient.GET(`/${postsSlug}/versions?trash=false`)
        const data = await res.json()
        expect(data.docs).toHaveLength(1)
        expect(data.docs[0]?.parent).toEqual(postsDocOne.id)
      })

      it('should find versions where version.deletedAt is null after restore via REST', async () => {
        await restClient.PATCH(`/${postsSlug}/${postsDocTwo.id}?trash=true`, {
          body: JSON.stringify({
            deletedAt: null,
          }),
        })

        const res = await restClient.GET(
          `/${postsSlug}/versions?trash=true&where[version.deletedAt][equals]=null`,
        )
        const data = await res.json()

        const version = data.docs.find((v: any) => v.parent === postsDocTwo.id)
        expect(version).toBeDefined()
        expect(version.version.deletedAt).toBeNull()
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
        const trashedVersions = await restClient.GET(
          `/${postsSlug}/versions?trash=true&where[version.deletedAt][exists]=true`,
        )

        const trashedVersionsData = await trashedVersions.json()
        expect(trashedVersionsData.docs).toHaveLength(1)

        const version = trashedVersionsData.docs[0]

        const versionDoc = await restClient.GET(`/${postsSlug}/versions/${version!.id}?trash=true`)
        const trashedVersionDoc = await versionDoc.json()

        expect(trashedVersionDoc).toBeDefined()
        expect(trashedVersionDoc?.parent).toEqual(postsDocTwo.id)
        expect(trashedVersionDoc?.version?.deletedAt).toBeDefined()
        expect(trashedVersionDoc?.version?.deletedAt).toEqual(postsDocTwo.deletedAt)
      })

      it('should throw NotFound error when trying to find a soft-deleted version document w/o trash: true', async () => {
        const trashedVersions = await restClient.GET(
          `/${postsSlug}/versions?trash=true&where[version.deletedAt][exists]=true`,
        )

        const trashedVersionsData = await trashedVersions.json()
        expect(trashedVersionsData.docs).toHaveLength(1)

        const version = trashedVersionsData.docs[0]

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
        const res = await restClient.PATCH(`/${postsSlug}/${postsDocTwo.id}?trash=true`, {
          body: JSON.stringify({
            title: 'Updated via REST',
          }),
        })

        const result = await res.json()
        expect(result.doc.title).toBe('Updated via REST')
        expect(result.doc.deletedAt).toEqual(postsDocTwo.deletedAt)
      })

      it('should throw NotFound error when trying to update a soft-deleted document w/o trash: true', async () => {
        const res = await restClient.PATCH(`/${postsSlug}/${postsDocTwo.id}`, {
          body: JSON.stringify({ title: 'Fail Update' }),
        })
        expect(res.status).toBe(404)
      })

      it('should update a single normal document when trash: false', async () => {
        const res = await restClient.PATCH(`/${postsSlug}/${postsDocOne.id}?trash=false`, {
          body: JSON.stringify({ title: 'Updated Normal via REST' }),
        })
        const result = await res.json()
        expect(result.doc.title).toBe('Updated Normal via REST')
        expect(result.doc.deletedAt).toBeFalsy()
      })

      it('should restore a soft-deleted document by setting deletedAt to null', async () => {
        const res = await restClient.PATCH(`/${postsSlug}/${postsDocTwo.id}?trash=true`, {
          body: JSON.stringify({
            deletedAt: null,
          }),
        })

        const result = await res.json()
        expect(result.doc.deletedAt).toBeNull()

        const check = await restClient.GET(`/${postsSlug}?trash=false`)
        const data = await check.json()
        const restored = data.docs.find((doc: Post) => doc.id === postsDocTwo.id)

        expect(restored).toBeDefined()
        expect(restored.deletedAt).toBeNull()
      })
    })

    describe('update endpoint', () => {
      it('should update only normal document when trash: false', async () => {
        const query = `?trash=false&where[id][equals]=${postsDocOne.id}`

        const res = await restClient.PATCH(`/${postsSlug}${query}`, {
          body: JSON.stringify({ title: 'Updated Normal via REST' }),
        })

        const result = await res.json()
        expect(result.docs).toHaveLength(1)
        expect(result.docs[0].id).toBe(postsDocOne.id)
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

        const docThree = await payload.create({
          collection: postsSlug,
          data: {
            title: 'Doc three',
            deletedAt: new Date().toISOString(),
          },
        })

        const res = await restClient.PATCH(`/${postsSlug}${query}`, {
          body: JSON.stringify({ title: 'Updated Soft Deleted Doc' }),
        })

        const result = await res.json()
        expect(result.docs).toHaveLength(2)

        expect(result.docs).toBeDefined()
        expect(result.docs[0]?.id).toEqual(docThree.id)
        expect(result.docs[0]?.title).toEqual('Updated Soft Deleted Doc')
        expect(result.docs[0]?.deletedAt).toEqual(docThree.deletedAt)
        expect(result.docs[1]?.id).toEqual(postsDocTwo.id)
        expect(result.docs[1]?.title).toEqual('Updated Soft Deleted Doc')
        expect(result.docs[1]?.deletedAt).toEqual(postsDocTwo.deletedAt)

        // Clean up
        await payload.delete({
          collection: postsSlug,
          id: docThree.id,
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
        expect(result.docs[0]?.id).toBe(postsDocOne.id)

        const check = await restClient.GET(`/${postsSlug}?trash=true`)
        const checkData = await check.json()

        // Make sure postsDocTwo (soft-deleted) is still there
        expect(checkData.docs.some((doc: Post) => doc.id === postsDocTwo.id)).toBe(true)
      })
    })

    describe('deleteByID endpoint', () => {
      it('should throw NotFound error when trying to delete a soft-deleted document w/o trash: true', async () => {
        const res = await restClient.DELETE(`/${postsSlug}/${postsDocTwo.id}`)
        expect(res.status).toBe(404)
      })

      it('should delete a soft-deleted document when trash: true', async () => {
        const res = await restClient.DELETE(`/${postsSlug}/${postsDocTwo.id}?trash=true`)
        expect(res.status).toBe(200)
        const result = await res.json()
        expect(result.doc.id).toBe(postsDocTwo.id)
      })
    })

    describe('restoreVersion operation', () => {
      it('should throw error when restoring a version of a trashed document', async () => {
        const updateRes = await restClient.PATCH(`/${postsSlug}/${postsDocTwo.id}?trash=true`, {
          body: JSON.stringify({ title: 'Updated Soft Deleted for Restore Test' }),
        })
        expect(updateRes.status).toBe(200)

        const { docs: versions } = await payload.findVersions({
          collection: postsSlug,
          trash: true,
        })
        const version = versions.find((v) => v.parent === postsDocTwo.id)

        const res = await restClient.POST(`/${postsSlug}/versions/${version!.id}`)
        const body = await res.json()

        expect(res.status).toBe(403)
        expect(body.message ?? body.errors?.[0]?.message).toMatch(
          'Cannot restore a version of a trashed document',
        )
      })
    })

    describe('count endpoint', () => {
      it('should return count of non-soft-deleted docs by default (trash=false)', async () => {
        const res = await restClient.GET(`/${postsSlug}/count`)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.totalDocs).toEqual(1)
      })

      it('should return count of all docs including soft-deleted when trash=true', async () => {
        const res = await restClient.GET(`/${postsSlug}/count?trash=true`)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.totalDocs).toEqual(2)
      })

      it('should return count of only soft-deleted docs with trash=true & where[deletedAt][exists]=true', async () => {
        const res = await restClient.GET(
          `/${postsSlug}/count?trash=true&where[deletedAt][exists]=true`,
        )
        const data = await res.json()
        expect(data.totalDocs).toEqual(1)
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
        expect(res.data.Posts.docs[0].id).toEqual(postsDocTwo.id)
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
        expect(res.data.Posts.docs[0].id).toEqual(postsDocOne.id)
        expect(res.data.Posts.docs[0].deletedAt).toBeNull()
      })

      it('should find restored documents after setting deletedAt to null', async () => {
        const mutation = `
          mutation {
            updatePost(id: ${idToString(postsDocTwo.id, payload)}, trash: true, data: {
              deletedAt: null
            }) {
              id
            }
          }
        `
        await restClient.GRAPHQL_POST({ body: JSON.stringify({ query: mutation }) })

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

        const restored = res.data.Posts.docs.find((doc: Post) => doc.id === postsDocTwo.id)
        expect(restored).toBeDefined()
        expect(restored.deletedAt).toBeNull()
      })
    })

    describe('findByID query', () => {
      it('should return a soft-deleted doc by ID with trash=true', async () => {
        const query = `
          query {
            Post(id: ${idToString(postsDocTwo.id, payload)}, trash: true) {
              id
              deletedAt
            }
          }
        `

        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.data.Post.id).toBe(postsDocTwo.id)
        expect(res.data.Post.deletedAt).toBe(postsDocTwo.deletedAt)
      })

      it('should 404 when trying to get a soft-deleted doc without trash=true', async () => {
        const query = `
          query {
            Post(id: ${idToString(postsDocTwo.id, payload)}) {
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

      it('should find versions where version.deletedAt is null after restore', async () => {
        const mutation = `
          mutation {
            updatePost(id: ${idToString(postsDocTwo.id, payload)}, trash: true, data: { deletedAt: null }) {
              id
              title
              deletedAt
            }
          }
        `
        await restClient.GRAPHQL_POST({ body: JSON.stringify({ query: mutation }) })

        const query = `
          query {
            versionsPosts(
              trash: true,
              where: {
                version__deletedAt: {
                  equals: null
                }
              }
            ) {
              docs {
                id
                parent {
                  id
                }
                version {
                  deletedAt
                }
              }
            }
          }
        `

        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        const version = res.data.versionsPosts.docs.find(
          (v: any) => String(v.parent.id) === String(postsDocTwo.id),
        )
        expect(version).toBeDefined()
        expect(version.version.deletedAt).toBeNull()
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
        // First, get the version ID of the soft-deleted trash enabled doc
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

        const trashedVersion = listRes.data.versionsPosts.docs[0]

        const detailQuery = `
          query {
            versionPost(id: ${idToString(trashedVersion.id, payload)}, trash: true) {
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

        expect(res.data.versionPost.id).toBe(trashedVersion.id)
        expect(res.data.versionPost.version.deletedAt).toBe(postsDocTwo.deletedAt)
      })

      it('should throw NotFound error when trying to find a soft-deleted version document w/o trash: true', async () => {
        // First, get the version ID of the soft-deleted trash enabled doc
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

        const trashedVersion = listRes.data.versionsPosts.docs[0]

        const detailQuery = `
          query {
            versionPost(id: ${idToString(trashedVersion.id, payload)}) {
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
            updatePost(id: ${idToString(postsDocTwo.id, payload)}, trash: true, data: { title: "Updated Soft Deleted via GQL" }) {
              id
              title
              deletedAt
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.data.updatePost.id).toBe(postsDocTwo.id)
        expect(res.data.updatePost.title).toBe('Updated Soft Deleted via GQL')
        expect(res.data.updatePost.deletedAt).toBe(postsDocTwo.deletedAt)
      })

      it('should throw NotFound error when trying to update a soft-deleted document w/o trash: true', async () => {
        const query = `
          mutation {
            updatePost(id: ${idToString(postsDocTwo.id, payload)}, data: { title: "Should Fail" }) {
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
            updatePost(id: ${idToString(postsDocOne.id, payload)}, trash: false, data: { title: "Updated Normal via GQL" }) {
              id
              title
              deletedAt
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.data.updatePost.id).toBe(postsDocOne.id)
        expect(res.data.updatePost.title).toBe('Updated Normal via GQL')
        expect(res.data.updatePost.deletedAt).toBeNull()
      })

      it('should restore a soft-deleted document by setting deletedAt to null', async () => {
        const mutation = `
          mutation {
            updatePost(id: ${idToString(postsDocTwo.id, payload)}, trash: true, data: {
              deletedAt: null
            }) {
              id
              deletedAt
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query: mutation }) })
          .then((r) => r.json())

        expect(res.data.updatePost.deletedAt).toBeNull()

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
        const restored = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        const match = restored.data.Posts.docs.find((doc: Post) => doc.id === postsDocTwo.id)
        expect(match).toBeDefined()
        expect(match.deletedAt).toBeNull()
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
            deletePost(id: ${idToString(postsDocTwo.id, payload)}) {
                id
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.errors?.[0]?.message).toMatch(/not found/i)
      })

      it('should delete a soft-deleted document when trash: true', async () => {
        const query = `
          mutation {
            deletePost(id: ${idToString(postsDocTwo.id, payload)}, trash: true) {
                id
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())
        expect(res.data.deletePost.id).toBe(postsDocTwo.id)
      })
    })

    describe('restoreVersion operation', () => {
      it('should throw error when restoring a version of a trashed document', async () => {
        const updateMutation = `
          mutation {
            updatePost(id: ${idToString(postsDocTwo.id, payload)}, trash: true, data: {
              title: "Soft Deleted Version"
            }) {
              id
            }
          }
    `
        await restClient.GRAPHQL_POST({ body: JSON.stringify({ query: updateMutation }) })

        const versionQuery = `
          query {
            versionsPosts(
              trash: true,
              where: {
                version__deletedAt: { exists: true }
              }
            ) {
              docs {
                id
                parent {
                  id
                }
                version {
                  deletedAt
                }
              }
            }
          }
        `
        const versionRes = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query: versionQuery }) })
          .then((r) => r.json())

        const version = versionRes.data.versionsPosts.docs.find((v: any) => v?.version?.deletedAt)

        expect(version?.id).toBeDefined()

        expect(version).toBeDefined()

        const restoreMutation = `
          mutation {
            restoreVersionPost(id: ${idToString(version.id, payload)}) {
              id
            }
          }
        `
        const restoreRes = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query: restoreMutation }) })
          .then((r) => r.json())

        expect(restoreRes.errors?.[0]?.message).toMatch(
          /Cannot restore a version of a trashed document/i,
        )
      })
    })

    describe('count query', () => {
      it('should return count of non-soft-deleted documents by default (trash=false)', async () => {
        const query = `
          query {
            countPosts {
              totalDocs
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.data.countPosts.totalDocs).toBe(1)
      })

      it('should return count of all documents including soft-deleted when trash=true', async () => {
        const query = `
          query {
            countPosts(trash: true) {
              totalDocs
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.data.countPosts.totalDocs).toBe(2)
      })

      it('should return count of only soft-deleted docs with where[deletedAt][exists]=true', async () => {
        const query = `
          query {
            countPosts(trash: true, where: { deletedAt: { exists: true } }) {
              totalDocs
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.data.countPosts.totalDocs).toBe(1)
      })
    })
  })
})
