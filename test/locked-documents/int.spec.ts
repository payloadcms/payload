import type { PostgresAdapter } from '@payloadcms/db-postgres'
import type {
  Payload,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'

import path from 'path'
import { Locked, NotFound } from 'payload'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, expect } from 'vitest'

import type { Post, User } from './payload-types.js'

import { describe, it } from '../__helpers/int/vitest.js'
import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import { menuSlug } from './globals/Menu/index.js'
import { pagesSlug, postsSlug, simpleSlug, usersSlug } from './slugs.js'

const lockedDocumentCollection = 'payload-locked-documents'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Locked documents', () => {
  let post: Post
  let user: any
  let user2: any
  let postConfig: SanitizedCollectionConfig

  beforeAll(async () => {
    // @ts-expect-error: initPayloadInt does not have a proper type definition
    ;({ payload } = await initPayloadInt(dirname))

    postConfig = payload.config.collections.find(
      ({ slug }) => slug === postsSlug,
    ) as SanitizedCollectionConfig

    const loginResult = await payload.login({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    user = loginResult.user

    user2 = await payload.create({
      collection: 'users',
      data: {
        email: 'test@payloadcms.com',
        password: 'test',
      },
    })

    post = await payload.create({
      collection: postsSlug,
      data: {
        text: 'some post',
      },
    })

    await payload.create({
      collection: pagesSlug,
      data: {
        text: 'some page',
      },
    })

    await payload.updateGlobal({
      slug: menuSlug,
      data: {
        globalText: 'global text',
      },
    })
  })

  afterAll(async () => {
    await payload.destroy()
  })

  afterEach(() => {
    postConfig.lockDocuments = { duration: 300 }
  })

  it('should update unlocked document - collection', async () => {
    const updatedPost = await payload.update({
      collection: postsSlug,
      data: {
        text: 'updated post',
      },
      id: post.id,
    })

    expect(updatedPost.text).toEqual('updated post')
  })

  it('should update unlocked document - global', async () => {
    const updatedGlobalMenu = await payload.updateGlobal({
      slug: menuSlug,
      data: {
        globalText: 'updated global text',
      },
    })

    expect(updatedGlobalMenu.globalText).toEqual('updated global text')
  })

  it('should delete unlocked document - collection', async () => {
    const { docs } = await payload.find({
      collection: postsSlug,
      depth: 0,
    })

    expect(docs).toHaveLength(2)

    await payload.delete({
      collection: postsSlug,
      id: post.id,
    })

    const { docs: deletedResults } = await payload.find({
      collection: postsSlug,
      depth: 0,
    })

    expect(deletedResults).toHaveLength(1)
  })

  it('should allow update of stale locked document - collection', async () => {
    const newPost2 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 2',
      },
    })

    // Set lock duration to 1 second for testing purposes
    postConfig.lockDocuments = { duration: 1 }

    // Give locking ownership to another user
    const lockedDocInstance = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        user: {
          relationTo: 'users',
          value: user2.id,
        },
        document: {
          relationTo: 'posts',
          value: newPost2.id,
        },
        globalSlug: undefined,
      },
    })

    await wait(1100)

    const updateLockedDoc = await payload.update({
      collection: postsSlug,
      data: {
        text: 'updated post 2',
      },
      overrideLock: false,
      id: newPost2.id,
    })
    postConfig.lockDocuments = { duration: 300 }

    // Should allow update since editedAt date is past expiration duration.
    // Therefore the document is considered stale
    expect(updateLockedDoc.text).toEqual('updated post 2')

    // Check to make sure the document does not exist in payload-locked-documents anymore
    try {
      await payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedDocInstance.id,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(NotFound)
    }

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedDocInstance.id },
      },
    })

    // Updating a document with the local API should not keep a stored doc
    // in the payload-locked-documents collection
    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })

  it('should allow update of stale locked document - global', async () => {
    // Set lock duration to 1 second for testing purposes
    const globalConfig = payload.config.globals.find(
      ({ slug }) => slug === menuSlug,
    ) as SanitizedGlobalConfig
    globalConfig.lockDocuments = { duration: 1 }
    // Give locking ownership to another user
    const lockedGlobalInstance = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        user: {
          relationTo: 'users',
          value: user2.id,
        },
        document: undefined,
        globalSlug: menuSlug,
      },
    })

    await wait(1100)

    const updateGlobalLockedDoc = await payload.updateGlobal({
      data: {
        globalText: 'global text 2',
      },
      overrideLock: false,
      slug: menuSlug,
    })
    globalConfig.lockDocuments = { duration: 300 }

    // Should allow update since editedAt date is past expiration duration.
    // Therefore the document is considered stale
    expect(updateGlobalLockedDoc.globalText).toEqual('global text 2')

    // Check to make sure the document does not exist in payload-locked-documents anymore
    try {
      await payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedGlobalInstance.id,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(NotFound)
    }

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedGlobalInstance.id },
      },
    })

    // Updating a document with the local API should not keep a stored doc
    // in the payload-locked-documents collection
    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })

  it('should not allow update of locked document - collection', async () => {
    const newPost = await payload.create({
      collection: postsSlug,
      data: {
        text: 'some post',
      },
    })

    // Give locking ownership to another user
    await payload.create({
      collection: lockedDocumentCollection,
      data: {
        document: {
          relationTo: 'posts',
          value: newPost.id,
        },
        globalSlug: undefined,
        user: {
          relationTo: 'users',
          value: user2.id,
        },
      },
    })

    try {
      await payload.update({
        collection: postsSlug,
        data: {
          text: 'updated post',
        },
        overrideLock: false, // necessary to trigger the lock check
        id: newPost.id,
      })
    } catch (error: any) {
      expect(error).toBeInstanceOf(Locked)
      expect(error.message).toMatch(/currently locked by another user and cannot be updated/)
    }

    const updatedPost = await payload.findByID({
      collection: postsSlug,
      id: newPost.id,
    })

    // Should not allow update - expect data not to change
    expect(updatedPost.text).toEqual('some post')
  })

  it('should not allow update of locked document - global', async () => {
    // Give locking ownership to another user
    await payload.create({
      collection: lockedDocumentCollection,
      data: {
        document: undefined,
        globalSlug: menuSlug,
        user: {
          relationTo: 'users',
          value: user2.id,
        },
      },
    })

    try {
      await payload.updateGlobal({
        data: {
          globalText: 'updated global text',
        },
        overrideLock: false, // necessary to trigger the lock check
        slug: menuSlug,
      })
    } catch (error: any) {
      expect(error).toBeInstanceOf(Locked)
      expect(error.message).toMatch(/currently locked by another user and cannot be updated/)
    }

    const updatedGlobalMenu = await payload.findGlobal({
      slug: menuSlug,
    })

    // Should not allow update - expect data not to change
    expect(updatedGlobalMenu.globalText).toEqual('global text 2')
  })

  // Try to delete locked document (collection)
  it('should not allow delete of locked document - collection', async () => {
    const newPost3 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 3',
      },
    })

    // Give locking ownership to another user
    await payload.create({
      collection: lockedDocumentCollection,
      data: {
        document: {
          relationTo: 'posts',
          value: newPost3.id,
        },
        globalSlug: undefined,
        user: {
          relationTo: 'users',
          value: user2.id,
        },
      },
    })

    try {
      await payload.delete({
        collection: postsSlug,
        id: newPost3.id,
        overrideLock: false, // necessary to trigger the lock check
      })
    } catch (error: any) {
      expect(error).toBeInstanceOf(Locked)
      expect(error.message).toMatch(/currently locked and cannot be deleted/)
    }

    const findPostDocs = await payload.find({
      collection: postsSlug,
      where: {
        id: { equals: newPost3.id },
      },
    })

    expect(findPostDocs.docs).toHaveLength(1)
  })

  it('should allow delete of stale locked document - collection', async () => {
    const newPost4 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 4',
      },
    })

    // Set lock duration to 1 second for testing purposes
    postConfig.lockDocuments = { duration: 1 }

    // Give locking ownership to another user
    const lockedDocInstance = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        user: {
          relationTo: 'users',
          value: user2.id,
        },
        document: {
          relationTo: 'posts',
          value: newPost4.id,
        },
        globalSlug: undefined,
      },
    })

    await wait(1100)

    await payload.delete({
      collection: postsSlug,
      id: newPost4.id,
      overrideLock: false,
    })

    const findPostDocs = await payload.find({
      collection: postsSlug,
      where: {
        id: { equals: newPost4.id },
      },
    })

    expect(findPostDocs.docs).toHaveLength(0)

    // Check to make sure the document does not exist in payload-locked-documents anymore
    try {
      await payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedDocInstance.id,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(NotFound)
    }

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedDocInstance.id },
      },
    })

    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })

  it('should allow update of locked document w/ overrideLock flag - collection', async () => {
    const newPost5 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 5',
      },
    })

    // Give locking ownership to another user
    const lockedDocInstance = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        user: {
          relationTo: 'users',
          value: user2.id,
        },
        document: {
          relationTo: 'posts',
          value: newPost5.id,
        },
        globalSlug: undefined,
      },
    })

    const updateLockedDoc = await payload.update({
      collection: postsSlug,
      data: {
        text: 'updated post 5',
      },
      id: newPost5.id,
      overrideLock: true,
    })

    // Should allow update since using overrideLock flag
    expect(updateLockedDoc.text).toEqual('updated post 5')

    // Check to make sure the document does not exist in payload-locked-documents anymore
    try {
      await payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedDocInstance.id,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(NotFound)
    }

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedDocInstance.id },
      },
    })

    // Updating a document with the local API should not keep a stored doc
    // in the payload-locked-documents collection
    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })

  it('should allow update of locked document w/ overrideLock flag - global', async () => {
    // Give locking ownership to another user
    const lockedGlobalInstance = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        globalSlug: menuSlug,
        user: {
          relationTo: 'users',
          value: user2.id,
        },
        document: undefined,
      },
    })

    const updateGlobalLockedDoc = await payload.updateGlobal({
      data: {
        globalText: 'updated global text 2',
      },
      slug: menuSlug,
      overrideLock: true,
    })

    // Should allow update since using overrideLock flag
    expect(updateGlobalLockedDoc.globalText).toEqual('updated global text 2')

    // Check to make sure the document does not exist in payload-locked-documents anymore
    try {
      await payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedGlobalInstance.id,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(NotFound)
    }

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedGlobalInstance.id },
      },
    })

    // Updating a document with the local API should not keep a stored doc
    // in the payload-locked-documents collection
    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })

  it('should allow delete of locked document w/ overrideLock flag - collection', async () => {
    const newPost6 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 6',
      },
    })

    // Give locking ownership to another user
    const lockedDocInstance = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        user: {
          relationTo: 'users',
          value: user2.id,
        },
        document: {
          relationTo: 'posts',
          value: newPost6.id,
        },
        globalSlug: undefined,
      },
    })

    await payload.delete({
      collection: postsSlug,
      id: newPost6.id,
      overrideLock: true,
    })

    const findPostDocs = await payload.find({
      collection: postsSlug,
      where: {
        id: { equals: newPost6.id },
      },
    })

    expect(findPostDocs.docs).toHaveLength(0)

    // Check to make sure the document does not exist in payload-locked-documents anymore
    try {
      await payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedDocInstance.id,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(NotFound)
    }

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedDocInstance.id },
      },
    })

    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })

  it('should allow take over on locked doc (simulates take over modal from admin ui)', async () => {
    const newPost7 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 7',
      },
    })

    const lockedDocInstance = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        user: {
          relationTo: 'users',
          value: user2.id,
        },
        document: {
          relationTo: 'posts',
          value: newPost7.id,
        },
        globalSlug: undefined,
      },
    })

    // This is the take over action - changing the user to the current user
    await payload.update({
      collection: 'payload-locked-documents',
      data: {
        user: { relationTo: 'users', value: user?.id },
      },
      id: lockedDocInstance.id,
    })

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        'user.value': { equals: user.id },
      },
    })

    expect(docsFromLocksCollection.docs).toHaveLength(1)
    expect((docsFromLocksCollection.docs[0]?.user.value as User)?.id).toEqual(user.id)
  })

  describe('Postgres lock transactions', { db: (adapter) => adapter === 'postgres' }, () => {
    const createdDocumentIDs: (number | string)[] = []
    const createdLockIDs: (number | string)[] = []

    afterEach(async () => {
      for (const id of createdLockIDs) {
        await payload.delete({ collection: lockedDocumentCollection, id, overrideAccess: true })
      }
      createdLockIDs.length = 0

      for (const id of createdDocumentIDs) {
        await payload.delete({ collection: simpleSlug, id, overrideAccess: true })
      }
      createdDocumentIDs.length = 0
    })
    for (const isolationLevel of ['repeatable read', 'serializable'] as const) {
      it(`should reject a save locked after a ${isolationLevel} snapshot`, async () => {
        const doc = await payload.create({
          collection: simpleSlug,
          data: { fieldA: 'before' },
          overrideAccess: true,
        })

        createdDocumentIDs.push(doc.id)
        const transactionID = await payload.db.beginTransaction({ isolationLevel })

        if (!transactionID) {
          throw new Error('Expected a Postgres transaction')
        }

        try {
          const req = { transactionID }

          await payload.findByID({
            collection: simpleSlug,
            id: doc.id,
            overrideAccess: true,
            req,
          })
          const lock = await payload.create({
            collection: lockedDocumentCollection,
            data: {
              document: { relationTo: simpleSlug, value: doc.id },
              user: { relationTo: usersSlug, value: user2.id },
            },
            overrideAccess: true,
          })

          createdLockIDs.push(lock.id)

          await expect(
            payload.update({
              collection: simpleSlug,
              id: doc.id,
              data: { fieldA: 'after' },
              overrideAccess: true,
              overrideLock: false,
              req,
              user,
            }),
          ).rejects.toBeInstanceOf(Locked)
        } finally {
          await payload.db.rollbackTransaction(transactionID)
        }
      })

      it(`should skip a bulk delete locked after a ${isolationLevel} snapshot`, async () => {
        const doc = await payload.create({
          collection: simpleSlug,
          data: {},
          overrideAccess: true,
        })

        createdDocumentIDs.push(doc.id)
        const transactionID = await payload.db.beginTransaction({ isolationLevel })

        if (!transactionID) {
          throw new Error('Expected a Postgres transaction')
        }

        try {
          const req = { transactionID }

          await payload.findByID({
            collection: simpleSlug,
            id: doc.id,
            overrideAccess: true,
            req,
          })
          const lock = await payload.create({
            collection: lockedDocumentCollection,
            data: {
              document: { relationTo: simpleSlug, value: doc.id },
              user: { relationTo: usersSlug, value: user2.id },
            },
            overrideAccess: true,
          })

          createdLockIDs.push(lock.id)

          const result = await payload.delete({
            collection: simpleSlug,
            where: { id: { equals: doc.id } },
            overrideAccess: true,
            overrideLock: false,
            req,
            user,
          })

          expect(result.docs).toEqual([])
          expect(result.errors).toEqual([
            expect.objectContaining({
              id: doc.id,
              message: expect.stringContaining('currently locked'),
            }),
          ])
        } finally {
          await payload.db.rollbackTransaction(transactionID)
        }

        const remaining = await payload.findByID({
          collection: simpleSlug,
          id: doc.id,
          overrideAccess: true,
        })

        expect(remaining.id).toBe(doc.id)
      })
    }

    it('should save a document using its existing transaction', async () => {
      const doc = await payload.create({
        collection: simpleSlug,
        overrideAccess: true,
        data: { fieldA: 'before' },
      })

      createdDocumentIDs.push(doc.id)

      const updated = await withFullPostgresPool({
        payload,
        operation: ({ req }) =>
          payload.update({
            collection: simpleSlug,
            overrideAccess: true,
            id: doc.id,
            data: { fieldA: 'after' },
            overrideLock: false,
            req,
          }),
      })

      expect(updated.fieldA).toBe('after')
    })

    it('should bulk delete documents using its existing transaction', async () => {
      const first = await payload.create({
        collection: simpleSlug,
        overrideAccess: true,
        data: {},
      })

      createdDocumentIDs.push(first.id)
      const second = await payload.create({
        collection: simpleSlug,
        overrideAccess: true,
        data: {},
      })

      createdDocumentIDs.push(second.id)

      const result = await withFullPostgresPool({
        payload,
        operation: ({ req }) =>
          payload.delete({
            collection: simpleSlug,
            overrideAccess: true,
            where: { id: { in: [first.id, second.id] } },
            overrideLock: false,
            req,
          }),
      })

      expect(result.errors).toEqual([])
      expect(result.docs.map(({ id }) => id).sort()).toEqual([first.id, second.id].sort())
    })
  })
})

async function withFullPostgresPool<T>({
  operation,
  payload,
}: {
  operation: (args: { req: Partial<PayloadRequest> }) => Promise<T>
  payload: Payload
}): Promise<T> {
  const { pool } = payload.db as unknown as PostgresAdapter
  const originalConnectionTimeout = pool.options.connectionTimeoutMillis
  const originalMax = pool.options.max
  const transactionIDs: (number | string)[] = []

  try {
    // Bound acquisition waits so a lock read outside the transaction fails instead of hanging.
    pool.options.connectionTimeoutMillis = 2000
    pool.options.max = 2

    while (pool.totalCount > pool.options.max && pool.idleCount > 0) {
      const client = await pool.connect()

      client.release(true)
    }

    // Some v3 adapters retain a startup connection. Reserve the remaining capacity so
    // the lock read cannot borrow another connection regardless of that lifecycle detail.
    while (pool.idleCount > 0 || pool.totalCount < pool.options.max) {
      const transactionID = await payload.db.beginTransaction()

      if (!transactionID) {
        throw new Error('Expected Postgres to start a transaction')
      }

      transactionIDs.push(transactionID)
    }

    if (!transactionIDs.length) {
      throw new Error('Expected an available transaction connection')
    }

    return await operation({ req: { transactionID: transactionIDs[0] } })
  } finally {
    try {
      await Promise.all(transactionIDs.map((id) => payload.db.rollbackTransaction(id)))
    } finally {
      pool.options.connectionTimeoutMillis = originalConnectionTimeout
      pool.options.max = originalMax
    }
  }
}
