import type { CollectionSlug } from 'payload'

import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import type { DifferentiatedTrashCollection, Post, RestrictedCollection } from './payload-types.js'

import { test } from '../__helpers/int/vitest.js'
import { idToString } from '../__helpers/shared/idToString.js'
import { devUser, regularUser } from '../credentials.js'
import { differentiatedTrashCollectionSlug } from './collections/DifferentiatedTrashCollection/index.js'
import { pagesSlug } from './collections/Pages/index.js'
import { postsSlug } from './collections/Posts/index.js'
import { registrationsSlug } from './collections/Registrations/index.js'
import { restrictedCollectionSlug } from './collections/RestrictedCollection/index.js'
import { usersSlug } from './collections/Users/index.js'
import testConfig from './config.js'

let user: any

test.suite({ config: testConfig })('trash', () => {
  let restrictedCollectionDoc: RestrictedCollection
  let postsDocOne: Post
  let postsDocTwo: Post

  test.beforeEach(async ({ payload, restClient }) => {
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

  test.afterEach(async ({ payload }) => {
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
  test.describe('Access control', () => {
    test('should not allow bulk soft-deleting documents when restricted by delete access', async ({
      payload,
    }) => {
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

    test('should not allow soft-deleting a document when restricted by delete access', async ({
      payload,
    }) => {
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

  /**
   * Tests for differentiated trash/delete permissions.
   *
   * The DifferentiatedTrashCollection has delete access that distinguishes between:
   * - Trashing (soft-delete): Any logged-in user can trash when deletedAt doesn't exist
   * - Permanently deleting: Only admins can permanently delete when deletedAt exists
   */
  test.describe('Differentiated trash/delete permissions', () => {
    let adminUser: any
    const createdDocIds: (number | string)[] = []

    test.beforeEach(async ({ payload }) => {
      // Login as admin user
      adminUser = await payload.login({
        collection: usersSlug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })
    })

    test.afterEach(async ({ payload }) => {
      // Clean up created documents
      for (const id of createdDocIds) {
        try {
          await payload.delete({
            collection: differentiatedTrashCollectionSlug as CollectionSlug,
            id,
            trash: true,
          })
        } catch (_e) {
          // Ignore errors from cleanup
        }
      }
      createdDocIds.length = 0
    })

    test.describe('trashing documents (soft delete)', () => {
      test('should allow regular user to trash (soft-delete) a document', async ({ payload }) => {
        // Create a document as admin
        const doc = await payload.create({
          collection: differentiatedTrashCollectionSlug as CollectionSlug,
          data: { title: 'Regular user trash test' },
        })

        createdDocIds.push(doc.id)

        // Regular user should be able to trash the document
        const trashedDoc = await payload.update({
          collection: differentiatedTrashCollectionSlug as CollectionSlug,
          id: doc.id,
          data: {
            deletedAt: new Date().toISOString(),
          },
          user, // Regular user from outer scope
          overrideAccess: false,
        })

        expect(trashedDoc.deletedAt).toBeDefined()
      })

      test('should allow admin to trash (soft-delete) a document', async ({ payload }) => {
        // Create a document
        const doc = await payload.create({
          collection: differentiatedTrashCollectionSlug as CollectionSlug,
          data: { title: 'Admin trash test' },
        })

        createdDocIds.push(doc.id)

        // Admin should be able to trash the document
        const trashedDoc = await payload.update({
          collection: differentiatedTrashCollectionSlug as CollectionSlug,
          id: doc.id,
          data: {
            deletedAt: new Date().toISOString(),
          },
          user: adminUser.user,
          overrideAccess: false,
        })

        expect(trashedDoc.deletedAt).toBeDefined()
      })
    })

    test.describe('permanently deleting documents', () => {
      test('should NOT allow regular user to permanently delete a trashed document', async ({
        payload,
      }) => {
        // Create and trash a document
        const doc = await payload.create({
          collection: differentiatedTrashCollectionSlug as CollectionSlug,
          data: {
            title: 'Regular user perm delete test',
            deletedAt: new Date().toISOString(),
          },
        })

        createdDocIds.push(doc.id)

        // Regular user should NOT be able to permanently delete
        await expect(
          payload.delete({
            collection: differentiatedTrashCollectionSlug as CollectionSlug,
            id: doc.id,
            trash: true,
            user, // Regular user from outer scope
            overrideAccess: false,
          }),
        ).rejects.toMatchObject({
          status: 403,
          name: 'Forbidden',
          message: expect.stringContaining('You are not allowed'),
        })
      })

      test('should allow admin to permanently delete a trashed document', async ({ payload }) => {
        // Create and trash a document
        const doc = await payload.create({
          collection: differentiatedTrashCollectionSlug as CollectionSlug,
          data: {
            title: 'Admin perm delete test',
            deletedAt: new Date().toISOString(),
          },
        })

        // Admin should be able to permanently delete
        const deletedDoc = await payload.delete({
          collection: differentiatedTrashCollectionSlug as CollectionSlug,
          id: doc.id,
          trash: true,
          user: adminUser.user,
          overrideAccess: false,
        })

        expect(deletedDoc.id).toBe(doc.id)

        // Verify document is gone
        await expect(
          payload.findByID({
            collection: differentiatedTrashCollectionSlug as CollectionSlug,
            id: doc.id,
            trash: true,
          }),
        ).rejects.toThrow('Not Found')
      })
    })

    test.describe('bulk operations with differentiated permissions', () => {
      test('should allow regular user to bulk trash documents', async ({ payload }) => {
        // Create multiple documents
        const doc1 = await payload.create({
          collection: differentiatedTrashCollectionSlug as CollectionSlug,
          data: { title: 'Bulk trash test 1' },
        })

        const doc2 = await payload.create({
          collection: differentiatedTrashCollectionSlug as CollectionSlug,
          data: { title: 'Bulk trash test 2' },
        })

        createdDocIds.push(doc1.id, doc2.id)

        // Regular user should be able to bulk trash
        const result = await payload.update({
          collection: differentiatedTrashCollectionSlug as CollectionSlug,
          data: {
            deletedAt: new Date().toISOString(),
          },
          where: {
            title: {
              like: 'Bulk trash test',
            },
          },
          user, // Regular user from outer scope
          overrideAccess: false,
        })

        expect(result.docs.length).toBe(2)
        expect(result.docs.every((doc: DifferentiatedTrashCollection) => doc.deletedAt)).toBe(true)
      })

      test('should NOT allow regular user to bulk permanently delete trashed documents', async ({
        payload,
      }) => {
        // Create multiple trashed documents
        const doc1 = await payload.create({
          collection: differentiatedTrashCollectionSlug as CollectionSlug,
          data: {
            title: 'Bulk perm delete test 1',
            deletedAt: new Date().toISOString(),
          },
        })

        const doc2 = await payload.create({
          collection: differentiatedTrashCollectionSlug as CollectionSlug,
          data: {
            title: 'Bulk perm delete test 2',
            deletedAt: new Date().toISOString(),
          },
        })

        createdDocIds.push(doc1.id, doc2.id)

        // Regular user should NOT be able to bulk permanently delete
        await expect(
          payload.delete({
            collection: differentiatedTrashCollectionSlug as CollectionSlug,
            where: {
              title: {
                like: 'Bulk perm delete test',
              },
            },
            trash: true,
            user, // Regular user from outer scope
            overrideAccess: false,
          }),
        ).rejects.toMatchObject({
          status: 403,
          name: 'Forbidden',
          message: expect.stringContaining('You are not allowed'),
        })

        // Verify documents still exist
        const remaining = await payload.find({
          collection: differentiatedTrashCollectionSlug as CollectionSlug,
          trash: true,
          where: {
            title: {
              like: 'Bulk perm delete test',
            },
          },
        })

        expect(remaining.docs.length).toBe(2)
      })

      test('should allow admin to bulk permanently delete trashed documents', async ({
        payload,
      }) => {
        // Create multiple trashed documents
        const doc1 = await payload.create({
          collection: differentiatedTrashCollectionSlug as CollectionSlug,
          data: {
            title: 'Admin bulk perm delete 1',
            deletedAt: new Date().toISOString(),
          },
        })

        const doc2 = await payload.create({
          collection: differentiatedTrashCollectionSlug as CollectionSlug,
          data: {
            title: 'Admin bulk perm delete 2',
            deletedAt: new Date().toISOString(),
          },
        })

        // Admin should be able to bulk permanently delete
        const result = await payload.delete({
          collection: differentiatedTrashCollectionSlug as CollectionSlug,
          where: {
            title: {
              like: 'Admin bulk perm delete',
            },
          },
          trash: true,
          user: adminUser.user,
          overrideAccess: false,
        })

        expect(result.docs.length).toBe(2)
        expect(result.docs.map((d: DifferentiatedTrashCollection) => d.id).sort()).toEqual(
          [doc1.id, doc2.id].sort(),
        )

        // Verify documents are gone
        const remaining = await payload.find({
          collection: differentiatedTrashCollectionSlug as CollectionSlug,
          trash: true,
          where: {
            title: {
              like: 'Admin bulk perm delete',
            },
          },
        })

        expect(remaining.docs.length).toBe(0)
      })
    })
  })

  test.describe('LOCAL API', () => {
    test.describe('find', () => {
      test('should return all docs including soft-deleted docs in find with trash: true', async ({
        payload,
      }) => {
        const allDocs = await payload.find({
          collection: postsSlug,
          trash: true,
        })

        expect(allDocs.totalDocs).toEqual(2)
      })

      test('should return only soft-deleted docs in find with trash: true', async ({ payload }) => {
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

      test('should return only non-soft-deleted docs in find with trash: false', async ({
        payload,
      }) => {
        const normalDocs = await payload.find({
          collection: postsSlug,
          trash: false,
        })

        expect(normalDocs.totalDocs).toEqual(1)
        expect(normalDocs.docs[0]?.id).toEqual(postsDocOne.id)
      })

      test('should find restored documents after setting deletedAt to null', async ({
        payload,
      }) => {
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

    test.describe('findDistinct', () => {
      test('should return all unique values for a field (excluding soft-deleted docs by default)', async ({
        payload,
      }) => {
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

      test('should include soft-deleted docs when trash: true', async ({ payload }) => {
        const result = await payload.findDistinct({
          collection: postsSlug,
          field: 'title',
          trash: true,
        })

        const titles = result.values.map((v) => v.title)

        expect(titles).toContain('Doc one')
        expect(titles).toContain('Doc two') // soft-deleted doc
      })

      test('should return only distinct values from soft-deleted docs when where[deletedAt][exists]=true', async ({
        payload,
      }) => {
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

      test('should respect where filters when retrieving distinct values', async ({ payload }) => {
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

    test.describe('findByID operation', () => {
      test('should return a soft-deleted document when trash: true', async ({ payload }) => {
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

      test('should throw NotFound error when trying to find a soft-deleted document w/o trash: true', async ({
        payload,
      }) => {
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

    test.describe('findVersions operation', () => {
      test('should return all versions including soft-deleted docs in findVersions with trash: true', async ({
        payload,
      }) => {
        const allVersions = await payload.findVersions({
          collection: postsSlug,
          trash: true,
        })

        expect(allVersions.totalDocs).toEqual(2)
        expect(allVersions.docs[0]?.parent).toEqual(postsDocTwo.id)
        expect(allVersions.docs[1]?.parent).toEqual(postsDocOne.id)
      })

      test('should return only soft-deleted docs in findVersions with trash: true', async ({
        payload,
      }) => {
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

      test('should return only non-soft-deleted docs in findVersions with trash: false', async ({
        payload,
      }) => {
        const normalVersions = await payload.findVersions({
          collection: postsSlug,
          trash: false,
        })

        expect(normalVersions.totalDocs).toEqual(1)
        expect(normalVersions.docs[0]?.parent).toEqual(postsDocOne.id)
      })

      test('should find versions where version.deletedAt is null after restore', async ({
        payload,
      }) => {
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

    test.describe('findVersionByID operation', () => {
      test('should return a soft-deleted version document when trash: true', async ({
        payload,
      }) => {
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

      test('should throw NotFound error when trying to find a soft-deleted version document w/o trash: true', async ({
        payload,
      }) => {
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

    test.describe('updateByID operation', () => {
      test('should update a single soft-deleted document when trash: true', async ({ payload }) => {
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

      test('should throw NotFound error when trying to update a soft-deleted document w/o trash: true', async ({
        payload,
      }) => {
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

      test('should update a single normal document when trash: false', async ({ payload }) => {
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

      test('should restore a soft-deleted document by setting deletedAt to null', async ({
        payload,
      }) => {
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

    test.describe('update operation', () => {
      test('should update only normal document when trash: false', async ({ payload }) => {
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

      test('should update all documents including soft-deleted documents when trash: true', async ({
        payload,
      }) => {
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

      test('should only update soft-deleted documents when trash: true and where[deletedAt][exists]=true', async ({
        payload,
      }) => {
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

    test.describe('delete operation', () => {
      test('should perma delete all docs including soft-deleted documents when trash: true', async ({
        payload,
      }) => {
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

      test('should only perma delete normal docs when trash: false', async ({ payload }) => {
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

    test.describe('trashing documents with validation issues', () => {
      test('should allow trashing documents with empty required fields (draft scenario)', async ({
        payload,
      }) => {
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

      test('should allow restoring trashed drafts with empty required fields as draft', async ({
        payload,
      }) => {
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

      test('should NOT allow restoring trashed drafts with empty required fields as published', async ({
        payload,
      }) => {
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

    test.describe('deleteByID operation', () => {
      test('should throw NotFound error when trying to delete a soft-deleted document w/o trash: true', async ({
        payload,
      }) => {
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

      test('should delete a soft-deleted document when trash: true', async ({ payload }) => {
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

    test.describe('restoreVersion operation', () => {
      test('should throw error when restoring a version of a trashed document', async ({
        payload,
      }) => {
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

    test.describe('count operation', () => {
      test('should return total count of non-soft-deleted documents by default (trash: false)', async ({
        payload,
      }) => {
        const result = await payload.count({
          collection: postsSlug,
        })

        expect(result.totalDocs).toEqual(1) // Only postsDocOne
      })

      test('should return total count of all documents including soft-deleted when trash: true', async ({
        payload,
      }) => {
        const result = await payload.count({
          collection: postsSlug,
          trash: true,
        })

        expect(result.totalDocs).toEqual(2)
      })

      test('should return count of only soft-deleted documents when where[deletedAt][exists]=true', async ({
        payload,
      }) => {
        const result = await payload.count({
          collection: postsSlug,
          trash: true,
          where: { deletedAt: { exists: true } },
        })

        expect(result.totalDocs).toEqual(1) // Only postsDocTwo
      })
    })

    test('should preserve localized field data when bulk trashing draft documents', async ({
      payload,
    }) => {
      const localizedFieldValueEN = 'Localized Draft Content EN'
      const localizedFieldValueES = 'Localized Draft Content ES'

      const post = await payload.create({
        collection: postsSlug,
        data: {
          title: 'Draft with Localized Field',
          _status: 'draft',
        },
      })

      // Update en locale as draft - isSavingDraft = true skips updateOne on the main table,
      // storing localized data only in the versions table
      await payload.update({
        collection: postsSlug,
        id: post.id,
        locale: 'en',
        data: {
          localizedField: localizedFieldValueEN,
          _status: 'draft',
        },
        draft: true,
      })

      await payload.update({
        collection: postsSlug,
        id: post.id,
        locale: 'es',
        data: {
          localizedField: localizedFieldValueES,
          _status: 'draft',
        },
        draft: true,
      })

      // Bulk trash the document (simulates list view "Move to Trash")
      // This reads from the main table which has stale/empty localizedField
      const trashResult = await payload.update({
        collection: postsSlug,
        data: {
          deletedAt: new Date().toISOString(),
        },
        where: {
          id: {
            equals: post.id,
          },
        },
      })

      expect(trashResult.docs).toHaveLength(1)
      expect(trashResult.docs[0]?.deletedAt).toBeTruthy()

      // Fetch the latest draft version of the trashed document for each locale
      const trashedDocEN = await payload.findByID({
        collection: postsSlug,
        id: post.id,
        locale: 'en',
        draft: true,
        trash: true,
      })

      const trashedDocES = await payload.findByID({
        collection: postsSlug,
        id: post.id,
        locale: 'es',
        draft: true,
        trash: true,
      })

      // localizedField should be preserved from the latest draft version for both locales,
      // not lost due to stale main table data being used during bulk trash
      expect(trashedDocEN.localizedField).toBe(localizedFieldValueEN)
      expect(trashedDocES.localizedField).toBe(localizedFieldValueES)
    })
  })

  test.describe('REST API', () => {
    test.describe('find endpoint', () => {
      test('should return all docs including soft-deleted docs in find with trash=true', async ({
        restClient,
      }) => {
        const res = await restClient.GET(`/${postsSlug}?trash=true`)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.docs).toHaveLength(2)
      })

      test('should return only soft-deleted docs with trash=true and where[deletedAt][exists]=true', async ({
        restClient,
      }) => {
        const res = await restClient.GET(`/${postsSlug}?trash=true&where[deletedAt][exists]=true`)
        const data = await res.json()
        expect(data.docs).toHaveLength(1)
        expect(data.docs[0]?.id).toEqual(postsDocTwo.id)
      })

      test('should return only normal docs when trash=false', async ({ restClient }) => {
        const res = await restClient.GET(`/${postsSlug}?trash=false`)
        const data = await res.json()
        expect(data.docs).toHaveLength(1)
        expect(data.docs[0]?.id).toEqual(postsDocOne.id)
      })

      test('should find restored documents after setting deletedAt to null', async ({
        restClient,
      }) => {
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

    test.describe('findByID endpoint', () => {
      test('should return a soft-deleted doc by ID with trash=true', async ({ restClient }) => {
        const res = await restClient.GET(`/${postsSlug}/${postsDocTwo.id}?trash=true`)
        const data = await res.json()
        expect(data?.id).toEqual(postsDocTwo.id)
        expect(data?.deletedAt).toEqual(postsDocTwo.deletedAt)
      })

      test('should 404 when trying to get a soft-deleted doc without trash=true', async ({
        restClient,
      }) => {
        const res = await restClient.GET(`/${postsSlug}/${postsDocTwo.id}`)
        expect(res.status).toBe(404)
      })
    })

    test.describe('find versions endpoint', () => {
      test('should return all versions including soft-deleted docs in findVersions with trash: true', async ({
        restClient,
      }) => {
        const res = await restClient.GET(`/${postsSlug}/versions?trash=true`)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.docs).toHaveLength(2)
      })

      test('should return only soft-deleted docs in findVersions with trash: true', async ({
        restClient,
      }) => {
        const res = await restClient.GET(
          `/${postsSlug}/versions?trash=true&where[version.deletedAt][exists]=true`,
        )
        const data = await res.json()
        expect(data.docs).toHaveLength(1)
        expect(data.docs[0]?.parent).toEqual(postsDocTwo.id)
      })

      test('should return only non-soft-deleted docs in findVersions with trash: false', async ({
        restClient,
      }) => {
        const res = await restClient.GET(`/${postsSlug}/versions?trash=false`)
        const data = await res.json()
        expect(data.docs).toHaveLength(1)
        expect(data.docs[0]?.parent).toEqual(postsDocOne.id)
      })

      test('should find versions where version.deletedAt is null after restore via REST', async ({
        restClient,
      }) => {
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

    test.describe('findVersionByID endpoint', () => {
      test('should return a soft-deleted version document when trash: true', async ({
        restClient,
      }) => {
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

      test('should throw NotFound error when trying to find a soft-deleted version document w/o trash: true', async ({
        restClient,
      }) => {
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

    test.describe('updateByID endpoint', () => {
      test('should update a single soft-deleted doc when trash=true', async ({ restClient }) => {
        const res = await restClient.PATCH(`/${postsSlug}/${postsDocTwo.id}?trash=true`, {
          body: JSON.stringify({
            title: 'Updated via REST',
          }),
        })

        const result = await res.json()
        expect(result.doc.title).toBe('Updated via REST')
        expect(result.doc.deletedAt).toEqual(postsDocTwo.deletedAt)
      })

      test('should throw NotFound error when trying to update a soft-deleted document w/o trash: true', async ({
        restClient,
      }) => {
        const res = await restClient.PATCH(`/${postsSlug}/${postsDocTwo.id}`, {
          body: JSON.stringify({ title: 'Fail Update' }),
        })
        expect(res.status).toBe(404)
      })

      test('should update a single normal document when trash: false', async ({ restClient }) => {
        const res = await restClient.PATCH(`/${postsSlug}/${postsDocOne.id}?trash=false`, {
          body: JSON.stringify({ title: 'Updated Normal via REST' }),
        })
        const result = await res.json()
        expect(result.doc.title).toBe('Updated Normal via REST')
        expect(result.doc.deletedAt).toBeFalsy()
      })

      test('should restore a soft-deleted document by setting deletedAt to null', async ({
        restClient,
      }) => {
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

    test.describe('update endpoint', () => {
      test('should update only normal document when trash: false', async ({ restClient }) => {
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

      test('should update all documents including soft-deleted documents when trash: true', async ({
        restClient,
      }) => {
        const query = `?trash=true&where[title][exists]=true`

        const res = await restClient.PATCH(`/${postsSlug}${query}`, {
          body: JSON.stringify({ title: 'Bulk Updated All' }),
        })

        const result = await res.json()
        expect(result.docs).toHaveLength(2)
        expect(result.docs.every((doc: Post) => doc.title === 'Bulk Updated All')).toBe(true)
      })

      test('should only update soft-deleted documents when trash: true and where[deletedAt][exists]=true', async ({
        payload,
        restClient,
      }) => {
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

    test.describe('delete endpoint', () => {
      test('should perma delete all docs including soft-deleted documents when trash: true', async ({
        restClient,
      }) => {
        const query = `?trash=true&where[title][exists]=true`

        const res = await restClient.DELETE(`/${postsSlug}${query}`)
        expect(res.status).toBe(200)

        const result = await res.json()
        expect(result.docs).toHaveLength(2)

        const check = await restClient.GET(`/${postsSlug}?trash=true`)
        const checkData = await check.json()
        expect(checkData.docs).toHaveLength(0)
      })

      test('should only perma delete normal docs when trash: false', async ({ restClient }) => {
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

    test.describe('deleteByID endpoint', () => {
      test('should throw NotFound error when trying to delete a soft-deleted document w/o trash: true', async ({
        restClient,
      }) => {
        const res = await restClient.DELETE(`/${postsSlug}/${postsDocTwo.id}`)
        expect(res.status).toBe(404)
      })

      test('should delete a soft-deleted document when trash: true', async ({ restClient }) => {
        const res = await restClient.DELETE(`/${postsSlug}/${postsDocTwo.id}?trash=true`)
        expect(res.status).toBe(200)
        const result = await res.json()
        expect(result.doc.id).toBe(postsDocTwo.id)
      })
    })

    test.describe('restoreVersion operation', () => {
      test('should throw error when restoring a version of a trashed document', async ({
        payload,
        restClient,
      }) => {
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

    test.describe('count endpoint', () => {
      test('should return count of non-soft-deleted docs by default (trash=false)', async ({
        restClient,
      }) => {
        const res = await restClient.GET(`/${postsSlug}/count`)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.totalDocs).toEqual(1)
      })

      test('should return count of all docs including soft-deleted when trash=true', async ({
        restClient,
      }) => {
        const res = await restClient.GET(`/${postsSlug}/count?trash=true`)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.totalDocs).toEqual(2)
      })

      test('should return count of only soft-deleted docs with trash=true & where[deletedAt][exists]=true', async ({
        restClient,
      }) => {
        const res = await restClient.GET(
          `/${postsSlug}/count?trash=true&where[deletedAt][exists]=true`,
        )
        const data = await res.json()
        expect(data.totalDocs).toEqual(1)
      })
    })
  })

  test.describe('GRAPHQL API', () => {
    test.describe('find query', () => {
      test('should return all docs including soft-deleted docs in find with trash=true', async ({
        restClient,
      }) => {
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

      test('should return only soft-deleted docs with trash=true and where[deletedAt][exists]=true', async ({
        restClient,
      }) => {
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

      test('should return only normal docs when trash=false', async ({ restClient }) => {
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

      test('should find restored documents after setting deletedAt to null', async ({
        payload,
        restClient,
      }) => {
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

    test.describe('findByID query', () => {
      test('should return a soft-deleted doc by ID with trash=true', async ({
        payload,
        restClient,
      }) => {
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

      test('should 404 when trying to get a soft-deleted doc without trash=true', async ({
        payload,
        restClient,
      }) => {
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

    test.describe('find versions query', () => {
      test('should return all versions including soft-deleted docs in findVersions with trash: true', async ({
        restClient,
      }) => {
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

      test('should return only soft-deleted docs in findVersions with trash: true', async ({
        restClient,
      }) => {
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

      test('should return only non-soft-deleted docs in findVersions with trash: false', async ({
        restClient,
      }) => {
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

      test('should find versions where version.deletedAt is null after restore', async ({
        payload,
        restClient,
      }) => {
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

    test.describe('findVersionByID endpoint', () => {
      test('should return a soft-deleted document when trash: true', async ({
        payload,
        restClient,
      }) => {
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

      test('should throw NotFound error when trying to find a soft-deleted version document w/o trash: true', async ({
        payload,
        restClient,
      }) => {
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

    test.describe('updateByID query', () => {
      test('should update a single soft-deleted doc when trash=true', async ({
        payload,
        restClient,
      }) => {
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

      test('should throw NotFound error when trying to update a soft-deleted document w/o trash: true', async ({
        payload,
        restClient,
      }) => {
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

      test('should update a single normal document when trash: false', async ({
        payload,
        restClient,
      }) => {
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

      test('should restore a soft-deleted document by setting deletedAt to null', async ({
        payload,
        restClient,
      }) => {
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

    test.describe.skip('update endpoint', () => {
      test.todo('should update only normal document when trash: false')

      test.todo('should update all documents including soft-deleted documents when trash: true')

      test.todo(
        'should only update soft-deleted documents when trash: true and where[deletedAt][exists]=true',
      )
    })

    test.describe('delete endpoint', () => {
      test.todo('should perma delete all docs including soft-deleted documents when trash: true')

      test.todo('should only perma delete normal docs when trash: false')
    })

    test.describe('deleteByID query', () => {
      test('should throw NotFound error when trying to delete a soft-deleted document w/o trash: true', async ({
        payload,
        restClient,
      }) => {
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

      test('should delete a soft-deleted document when trash: true', async ({
        payload,
        restClient,
      }) => {
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

    test.describe('restoreVersion operation', () => {
      test('should throw error when restoring a version of a trashed document', async ({
        payload,
        restClient,
      }) => {
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

    test.describe('count query', () => {
      test('should return count of non-soft-deleted documents by default (trash=false)', async ({
        restClient,
      }) => {
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

      test('should return count of all documents including soft-deleted when trash=true', async ({
        restClient,
      }) => {
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

      test('should return count of only soft-deleted docs with where[deletedAt][exists]=true', async ({
        restClient,
      }) => {
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

  test.describe('Relationship population', () => {
    const createdPageIDs: (number | string)[] = []

    test.afterEach(async ({ payload }) => {
      for (const id of createdPageIDs) {
        await payload.delete({ collection: pagesSlug, id })
      }
      createdPageIDs.length = 0
    })

    test('should not include trashed document IDs in hasMany relationship population', async ({
      payload,
    }) => {
      // postsDocOne is non-trashed, postsDocTwo is trashed
      const page = await payload.create({
        collection: pagesSlug,
        data: {
          title: 'Page with related posts',
          relatedPosts: [postsDocOne.id, postsDocTwo.id],
        },
      })
      createdPageIDs.push(page.id)

      const result = await payload.findByID({
        collection: pagesSlug,
        id: page.id,
        depth: 1,
      })

      // The trashed post (postsDocTwo) should be absent from the relationship array
      // Non-trashed post (postsDocOne) should be populated as an object
      expect(Array.isArray(result.relatedPosts)).toBe(true)
      expect(result.relatedPosts).toHaveLength(1)
      expect((result.relatedPosts as Post[])[0]?.id).toBe(postsDocOne.id)
    })

    test('should return null for a trashed document in a single relationship', async ({
      payload,
    }) => {
      const page = await payload.create({
        collection: pagesSlug,
        data: {
          title: 'Page with featured post',
          featuredPost: postsDocTwo.id,
        },
      })
      createdPageIDs.push(page.id)

      const result = await payload.findByID({
        collection: pagesSlug,
        id: page.id,
        depth: 1,
      })

      expect(result.featuredPost).toBeNull()
    })

    test('should populate a non-trashed document in a single relationship', async ({ payload }) => {
      const page = await payload.create({
        collection: pagesSlug,
        data: {
          title: 'Page with featured post',
          featuredPost: postsDocOne.id,
        },
      })
      createdPageIDs.push(page.id)

      const result = await payload.findByID({
        collection: pagesSlug,
        id: page.id,
        depth: 1,
      })

      expect((result.featuredPost as Post)?.id).toBe(postsDocOne.id)
    })

    test('should include trashed documents in relationship when depth=0', async ({ payload }) => {
      // At depth=0, relationships are returned as IDs - but trashed IDs should still be filtered
      const page = await payload.create({
        collection: pagesSlug,
        data: {
          title: 'Page with related posts depth 0',
          relatedPosts: [postsDocOne.id, postsDocTwo.id],
        },
      })
      createdPageIDs.push(page.id)

      const result = await payload.findByID({
        collection: pagesSlug,
        id: page.id,
        depth: 0,
      })

      // At depth=0, no population occurs - raw IDs are returned as stored
      // The trashed post ID should still be visible at depth=0
      const relatedPosts = result.relatedPosts as (number | string)[]
      expect(Array.isArray(relatedPosts)).toBe(true)
      expect(relatedPosts).toHaveLength(2)
    })
  })

  test.describe('Writes referencing a trashed document', () => {
    const createdRegistrationIDs: (number | string)[] = []

    test.afterEach(async ({ payload }) => {
      for (const id of createdRegistrationIDs) {
        await payload.delete({ id, collection: registrationsSlug })
      }
      createdRegistrationIDs.length = 0
    })

    // The `registrations` afterChange hook reads the related post and swallows the
    // resulting NotFound. That swallowed read must not roll back the create.
    test('should persist a document whose required relationship points at a trashed document', async ({
      payload,
    }) => {
      const registration = await payload.create({
        collection: registrationsSlug,
        data: {
          post: postsDocTwo.id,
          title: 'Registration for a trashed post',
        },
      })
      createdRegistrationIDs.push(registration.id)

      const result = await payload.find({
        collection: registrationsSlug,
        where: {
          id: {
            equals: registration.id,
          },
        },
      })

      expect(result.totalDocs).toBe(1)
    })

    test('should persist a document created over REST whose relationship points at a trashed document', async ({
      payload,
      restClient,
    }) => {
      const response = await restClient.POST(`/${registrationsSlug}`, {
        body: JSON.stringify({
          post: postsDocTwo.id,
          title: 'REST registration for a trashed post',
        }),
      })

      const { doc } = await response.json()

      expect(response.status).toBe(201)
      createdRegistrationIDs.push(doc.id)

      const result = await payload.find({
        collection: registrationsSlug,
        where: {
          id: {
            equals: doc.id,
          },
        },
      })

      expect(result.totalDocs).toBe(1)
    })
  })
})
