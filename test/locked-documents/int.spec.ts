import type { PostgresAdapter } from '@payloadcms/db-postgres'
import type {
  Payload,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { Locked, NotFound } from 'payload'
import { wait } from 'payload/shared'
import { expect } from 'vitest'

import type { Post, User } from './payload-types.js'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import { menuSlug } from './globals/Menu/index.js'
import { pagesSlug, postsSlug, simpleSlug, usersSlug } from './slugs.js'

const lockedDocumentCollection = 'payload-locked-documents'

test.suite('Locked documents', { config: './config.ts', resetBetweenTests: false }, () => {
  let post: Post
  let user: any
  let user2: any
  let postConfig: SanitizedCollectionConfig

  test.beforeAll(async ({ payloadInstance: payload }) => {
    postConfig = payload.config.collections.find(
      ({ slug }) => slug === postsSlug,
    ) as SanitizedCollectionConfig

    const loginResult = await payload.login({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
      overrideAccess: true,
    })

    user = loginResult.user

    user2 = await payload.create({
      collection: 'users',
      data: {
        email: 'test@payloadcms.com',
        password: 'test',
      },
      overrideAccess: true,
    })

    post = await payload.create({
      collection: postsSlug,
      data: {
        text: 'some post',
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: pagesSlug,
      data: {
        text: 'some page',
      },
      overrideAccess: true,
    })

    await payload.updateGlobal({
      slug: menuSlug,
      data: {
        globalText: 'global text',
      },
      overrideAccess: true,
    })
  })

  test.afterEach(() => {
    postConfig.lockDocuments = { duration: 300 }
  })

  test('should update unlocked document - collection', async ({ payload }) => {
    const updatedPost = await payload.update({
      collection: postsSlug,
      data: {
        text: 'updated post',
      },
      id: post.id,
      overrideAccess: true,
    })

    expect(updatedPost.text).toEqual('updated post')
  })

  test('should update unlocked document - global', async ({ payload }) => {
    const updatedGlobalMenu = await payload.updateGlobal({
      slug: menuSlug,
      data: {
        globalText: 'updated global text',
      },
      overrideAccess: true,
    })

    expect(updatedGlobalMenu.globalText).toEqual('updated global text')
  })

  test('should delete unlocked document - collection', async ({ payload }) => {
    const { docs } = await payload.find({
      collection: postsSlug,
      depth: 0,
      overrideAccess: true,
    })

    expect(docs).toHaveLength(2)

    await payload.delete({
      collection: postsSlug,
      id: post.id,
      overrideAccess: true,
    })

    const { docs: deletedResults } = await payload.find({
      collection: postsSlug,
      depth: 0,
      overrideAccess: true,
    })

    expect(deletedResults).toHaveLength(1)
  })

  test('should allow update of stale locked document - collection', async ({ payload }) => {
    const newPost2 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 2',
      },
      overrideAccess: true,
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
      overrideAccess: true,
    })

    await wait(1100)

    const updateLockedDoc = await payload.update({
      collection: postsSlug,
      data: {
        text: 'updated post 2',
      },
      overrideLock: false,
      id: newPost2.id,
      overrideAccess: true,
    })
    postConfig.lockDocuments = { duration: 300 }

    // Should allow update since editedAt date is past expiration duration.
    // Therefore the document is considered stale
    expect(updateLockedDoc.text).toEqual('updated post 2')

    // Check to make sure the document does not exist in payload-locked-documents anymore
    await expect(
      payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedDocInstance.id,
        overrideAccess: true,
      }),
    ).rejects.toBeInstanceOf(NotFound)

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedDocInstance.id },
      },
      overrideAccess: true,
    })

    // Updating a document with the local API should not keep a stored doc
    // in the payload-locked-documents collection
    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })

  test('should allow update of stale locked document - global', async ({ payload }) => {
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
      overrideAccess: true,
    })

    await wait(1100)

    const updateGlobalLockedDoc = await payload.updateGlobal({
      data: {
        globalText: 'global text 2',
      },
      overrideLock: false,
      slug: menuSlug,
      overrideAccess: true,
    })
    globalConfig.lockDocuments = { duration: 300 }

    // Should allow update since editedAt date is past expiration duration.
    // Therefore the document is considered stale
    expect(updateGlobalLockedDoc.globalText).toEqual('global text 2')

    // Check to make sure the document does not exist in payload-locked-documents anymore
    await expect(
      payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedGlobalInstance.id,
        overrideAccess: true,
      }),
    ).rejects.toBeInstanceOf(NotFound)

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedGlobalInstance.id },
      },
      overrideAccess: true,
    })

    // Updating a document with the local API should not keep a stored doc
    // in the payload-locked-documents collection
    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })

  test('should not allow update of locked document - collection', async ({ payload }) => {
    const newPost = await payload.create({
      collection: postsSlug,
      data: {
        text: 'some post',
      },
      overrideAccess: true,
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
      overrideAccess: true,
    })

    const operation = payload.update({
      collection: postsSlug,
      data: {
        text: 'updated post',
      },
      overrideLock: false, // necessary to trigger the lock check
      id: newPost.id,
      overrideAccess: true,
    })

    await expect(operation).rejects.toBeInstanceOf(Locked)
    await expect(operation).rejects.toThrow(
      /currently locked by another user and cannot be updated/,
    )

    const updatedPost = await payload.findByID({
      collection: postsSlug,
      id: newPost.id,
      overrideAccess: true,
    })

    // Should not allow update - expect data not to change
    expect(updatedPost.text).toEqual('some post')
  })

  test('should not allow update of locked document - global', async ({ payload }) => {
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
      overrideAccess: true,
    })

    const operation = payload.updateGlobal({
      data: {
        globalText: 'updated global text',
      },
      overrideLock: false, // necessary to trigger the lock check
      slug: menuSlug,
      overrideAccess: true,
    })

    await expect(operation).rejects.toBeInstanceOf(Locked)
    await expect(operation).rejects.toThrow(
      /currently locked by another user and cannot be updated/,
    )

    const updatedGlobalMenu = await payload.findGlobal({
      slug: menuSlug,
      overrideAccess: true,
    })

    // Should not allow update - expect data not to change
    expect(updatedGlobalMenu.globalText).toEqual('global text 2')
  })

  // Try to delete locked document (collection)
  test('should not allow delete of locked document - collection', async ({ payload }) => {
    const newPost3 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 3',
      },
      overrideAccess: true,
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
      overrideAccess: true,
    })

    const operation = payload.delete({
      collection: postsSlug,
      id: newPost3.id,
      overrideLock: false,
      overrideAccess: true, // necessary to trigger the lock check
    })

    await expect(operation).rejects.toBeInstanceOf(Locked)
    await expect(operation).rejects.toThrow(/currently locked and cannot be deleted/)

    const findPostDocs = await payload.find({
      collection: postsSlug,
      where: {
        id: { equals: newPost3.id },
      },
      overrideAccess: true,
    })

    expect(findPostDocs.docs).toHaveLength(1)
  })

  test('should allow delete of stale locked document - collection', async ({ payload }) => {
    const newPost4 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 4',
      },
      overrideAccess: true,
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
      overrideAccess: true,
    })

    await wait(1100)

    await payload.delete({
      collection: postsSlug,
      id: newPost4.id,
      overrideLock: false,
      overrideAccess: true,
    })

    const findPostDocs = await payload.find({
      collection: postsSlug,
      where: {
        id: { equals: newPost4.id },
      },
      overrideAccess: true,
    })

    expect(findPostDocs.docs).toHaveLength(0)

    // Check to make sure the document does not exist in payload-locked-documents anymore
    await expect(
      payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedDocInstance.id,
        overrideAccess: true,
      }),
    ).rejects.toBeInstanceOf(NotFound)

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedDocInstance.id },
      },
      overrideAccess: true,
    })

    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })

  test('should allow update of locked document w/ overrideLock flag - collection', async ({
    payload,
  }) => {
    const newPost5 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 5',
      },
      overrideAccess: true,
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
      overrideAccess: true,
    })

    const updateLockedDoc = await payload.update({
      collection: postsSlug,
      data: {
        text: 'updated post 5',
      },
      id: newPost5.id,
      overrideLock: true,
      overrideAccess: true,
    })

    // Should allow update since using overrideLock flag
    expect(updateLockedDoc.text).toEqual('updated post 5')

    // Check to make sure the document does not exist in payload-locked-documents anymore
    await expect(
      payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedDocInstance.id,
        overrideAccess: true,
      }),
    ).rejects.toBeInstanceOf(NotFound)

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedDocInstance.id },
      },
      overrideAccess: true,
    })

    // Updating a document with the local API should not keep a stored doc
    // in the payload-locked-documents collection
    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })

  test('should allow update of locked document w/ overrideLock flag - global', async ({
    payload,
  }) => {
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
      overrideAccess: true,
    })

    const updateGlobalLockedDoc = await payload.updateGlobal({
      data: {
        globalText: 'updated global text 2',
      },
      slug: menuSlug,
      overrideLock: true,
      overrideAccess: true,
    })

    // Should allow update since using overrideLock flag
    expect(updateGlobalLockedDoc.globalText).toEqual('updated global text 2')

    // Check to make sure the document does not exist in payload-locked-documents anymore
    await expect(
      payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedGlobalInstance.id,
        overrideAccess: true,
      }),
    ).rejects.toBeInstanceOf(NotFound)

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedGlobalInstance.id },
      },
      overrideAccess: true,
    })

    // Updating a document with the local API should not keep a stored doc
    // in the payload-locked-documents collection
    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })

  test('should allow delete of locked document w/ overrideLock flag - collection', async ({
    payload,
  }) => {
    const newPost6 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 6',
      },
      overrideAccess: true,
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
      overrideAccess: true,
    })

    await payload.delete({
      collection: postsSlug,
      id: newPost6.id,
      overrideLock: true,
      overrideAccess: true,
    })

    const findPostDocs = await payload.find({
      collection: postsSlug,
      where: {
        id: { equals: newPost6.id },
      },
      overrideAccess: true,
    })

    expect(findPostDocs.docs).toHaveLength(0)

    // Check to make sure the document does not exist in payload-locked-documents anymore
    await expect(
      payload.findByID({
        collection: lockedDocumentCollection,
        id: lockedDocInstance.id,
        overrideAccess: true,
      }),
    ).rejects.toBeInstanceOf(NotFound)

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        id: { equals: lockedDocInstance.id },
      },
      overrideAccess: true,
    })

    expect(docsFromLocksCollection.docs).toHaveLength(0)
  })

  test('should allow take over on locked doc (simulates take over modal from admin ui)', async ({
    payload,
  }) => {
    const newPost7 = await payload.create({
      collection: postsSlug,
      data: {
        text: 'new post 7',
      },
      overrideAccess: true,
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
      overrideAccess: true,
    })

    // This is the take over action - changing the user to the current user
    await payload.update({
      collection: 'payload-locked-documents',
      data: {
        user: { relationTo: 'users', value: user?.id },
      },
      id: lockedDocInstance.id,
      overrideAccess: true,
    })

    const docsFromLocksCollection = await payload.find({
      collection: lockedDocumentCollection,
      where: {
        'user.value': { equals: user.id },
      },
      overrideAccess: true,
    })

    expect(docsFromLocksCollection.docs).toHaveLength(1)
    expect((docsFromLocksCollection.docs[0]?.user.value as User)?.id).toEqual(user.id)
  })

  test.options.describe(
    'Postgres lock transactions',
    { db: (adapter) => adapter === 'postgres' },
    () => {
      for (const isolationLevel of ['repeatable read', 'serializable'] as const) {
        test(`should reject a save locked after a ${isolationLevel} snapshot`, async ({
          payload,
        }) => {
          const doc = await payload.create({
            collection: simpleSlug,
            data: { fieldA: 'before' },
            overrideAccess: true,
          })
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
            await payload.create({
              collection: lockedDocumentCollection,
              data: {
                document: { relationTo: simpleSlug, value: doc.id },
                user: { relationTo: usersSlug, value: user2.id },
              },
              overrideAccess: true,
            })

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

        test(`should skip a bulk delete locked after a ${isolationLevel} snapshot`, async ({
          payload,
        }) => {
          const doc = await payload.create({
            collection: simpleSlug,
            data: {},
            overrideAccess: true,
          })
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
            await payload.create({
              collection: lockedDocumentCollection,
              data: {
                document: { relationTo: simpleSlug, value: doc.id },
                user: { relationTo: usersSlug, value: user2.id },
              },
              overrideAccess: true,
            })

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

      test('should save a document using an automatically managed transaction with a full pool', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: simpleSlug,
          user,
          data: { fieldA: 'before' },
        })

        await withLimitedPostgresPool({
          max: 1,
          payload,
          operation: () =>
            payload.update({
              collection: simpleSlug,
              user,
              id: doc.id,
              data: { fieldA: 'after' },
              overrideLock: false,
            }),
        })

        const persisted = await payload.findByID({ collection: simpleSlug, user, id: doc.id })

        expect(persisted.fieldA).toBe('after')
      })

      test('should commit a save and its nested hook update with a full pool', async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: simpleSlug,
          user,
          data: { fieldA: 'before' },
        })
        const relatedDoc = await payload.create({
          collection: simpleSlug,
          user,
          data: { fieldA: 'related before' },
        })
        const collectionConfig = payload.collections[simpleSlug].config
        const originalBeforeChange = collectionConfig.hooks.beforeChange

        try {
          collectionConfig.hooks.beforeChange = [
            ...originalBeforeChange,
            async ({ data, originalDoc, req }) => {
              if (originalDoc?.id === doc.id) {
                await req.payload.update({
                  collection: simpleSlug,
                  user,
                  id: relatedDoc.id,
                  data: { fieldA: 'related after' },
                  overrideLock: false,
                  req,
                })
              }

              return data
            },
          ]

          await withLimitedPostgresPool({
            max: 1,
            payload,
            operation: () =>
              payload.update({
                collection: simpleSlug,
                user,
                id: doc.id,
                data: { fieldA: 'after' },
                overrideLock: false,
              }),
          })

          const persisted = await payload.findByID({ collection: simpleSlug, user, id: doc.id })
          const persistedRelated = await payload.findByID({
            collection: simpleSlug,
            user,
            id: relatedDoc.id,
          })

          expect(persisted.fieldA).toBe('after')
          expect(persistedRelated.fieldA).toBe('related after')
        } finally {
          collectionConfig.hooks.beforeChange = originalBeforeChange
        }
      })

      test('should save a document using its existing transaction', async ({ payload }) => {
        const doc = await payload.create({
          collection: simpleSlug,
          overrideAccess: true,
          data: { fieldA: 'before' },
        })

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

      test('should bulk delete documents using its existing transaction', async ({ payload }) => {
        const first = await payload.create({
          collection: simpleSlug,
          overrideAccess: true,
          data: {},
        })
        const second = await payload.create({
          collection: simpleSlug,
          overrideAccess: true,
          data: {},
        })

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
    },
  )
})

async function withFullPostgresPool<T>({
  operation,
  payload,
}: {
  operation: (args: { req: Partial<PayloadRequest> }) => Promise<T>
  payload: Payload
}): Promise<T> {
  const transactionIDs: (number | string)[] = []

  return withLimitedPostgresPool({
    max: 2,
    payload,
    operation: async () => {
      try {
        // Reserve both connections so an independent lock read cannot borrow another.
        for (let index = 0; index < 2; index++) {
          const transactionID = await payload.db.beginTransaction()

          if (!transactionID) {
            throw new Error('Expected Postgres to start a transaction')
          }

          transactionIDs.push(transactionID)
        }

        return await operation({ req: { transactionID: transactionIDs[0] } })
      } finally {
        await Promise.all(transactionIDs.map((id) => payload.db.rollbackTransaction(id)))
      }
    },
  })
}

async function withLimitedPostgresPool<T>({
  max,
  operation,
  payload,
}: {
  max: number
  operation: () => Promise<T>
  payload: Payload
}): Promise<T> {
  const { pool } = payload.db as unknown as PostgresAdapter
  const originalConnectionTimeout = pool.options.connectionTimeoutMillis
  const originalMax = pool.options.max

  try {
    // Bound acquisition waits so a lock read outside the transaction fails instead of hanging.
    pool.options.connectionTimeoutMillis = 2000
    pool.options.max = max

    while (pool.totalCount > pool.options.max && pool.idleCount > 0) {
      const client = await pool.connect()

      client.release(true)
    }

    return await operation()
  } finally {
    pool.options.connectionTimeoutMillis = originalConnectionTimeout
    pool.options.max = originalMax
  }
}
