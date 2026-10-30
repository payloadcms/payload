import type { Payload } from 'payload'

import { NotFound } from 'payload'
import { expect } from 'vitest'

import type { User } from './payload-types.js'

import { test } from '../__helpers/int/vitest.js'
import { postsSlug, simpleSlug } from './slugs.js'

const lockedDocumentCollection = 'payload-locked-documents'

const createLockedDocuments = async ({
  count,
  payload,
  userID,
}: {
  count: number
  payload: Payload
  userID: User['id']
}): Promise<(number | string)[]> => {
  const ids: (number | string)[] = []

  for (let i = 0; i < count; i++) {
    const doc = await payload.create({
      collection: simpleSlug,
      data: {
        fieldA: `bulk delete ${i}`,
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: lockedDocumentCollection,
      data: {
        document: {
          relationTo: simpleSlug,
          value: doc.id,
        },
        globalSlug: undefined,
        user: {
          relationTo: 'users',
          value: userID,
        },
      },
      overrideAccess: true,
    })

    ids.push(doc.id)
  }

  return ids
}

test.suite('Locked documents - bulk delete', { config: './config.ts' }, () => {
  // Bulk delete resolves the lock state of the whole batch in a single query, rather than one
  // query per document like deleting a single document does
  test('should skip locked documents but delete the unlocked ones', async ({ payload }) => {
    const deletingUser = await payload.create({
      collection: 'users',
      data: {
        email: 'bulk-delete-owner@payloadcms.com',
        password: 'test',
      },
      overrideAccess: true,
    })

    const otherUser = await payload.create({
      collection: 'users',
      data: {
        email: 'bulk-delete-other@payloadcms.com',
        password: 'test',
      },
      overrideAccess: true,
    })

    const lockedPost = await payload.create({
      collection: postsSlug,
      data: {
        text: 'bulk delete locked post',
      },
      overrideAccess: true,
    })

    const unlockedPost = await payload.create({
      collection: postsSlug,
      data: {
        text: 'bulk delete unlocked post',
      },
      overrideAccess: true,
    })

    // Give locking ownership of one of the two documents to another user
    await payload.create({
      collection: lockedDocumentCollection,
      data: {
        document: {
          relationTo: 'posts',
          value: lockedPost.id,
        },
        globalSlug: undefined,
        user: {
          relationTo: 'users',
          value: otherUser.id,
        },
      },
      overrideAccess: true,
    })

    // The other document is locked by the user performing the delete, so it is not blocked. It
    // also lets us assert that its lock is released.
    const ownLock = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        document: {
          relationTo: 'posts',
          value: unlockedPost.id,
        },
        globalSlug: undefined,
        user: {
          relationTo: 'users',
          value: deletingUser.id,
        },
      },
      overrideAccess: true,
    })

    const { docs, errors } = await payload.delete({
      collection: postsSlug,
      overrideLock: false, // necessary to trigger the lock check
      user: deletingUser,
      where: {
        id: { in: [lockedPost.id, unlockedPost.id] },
      },
      overrideAccess: true,
    })

    expect(docs).toHaveLength(1)
    expect(docs[0]?.id).toStrictEqual(unlockedPost.id)

    expect(errors).toHaveLength(1)
    expect(errors[0]?.id).toStrictEqual(lockedPost.id)
    expect(errors[0]?.message).toMatch(/currently locked and cannot be deleted/)

    // The locked document must survive
    const remainingPosts = await payload.find({
      collection: postsSlug,
      where: {
        id: { in: [lockedPost.id, unlockedPost.id] },
      },
      overrideAccess: true,
    })

    expect(remainingPosts.docs).toHaveLength(1)
    expect(remainingPosts.docs[0]?.id).toStrictEqual(lockedPost.id)

    // The lock of the deleted document must be released
    await expect(
      payload.findByID({
        id: ownLock.id,
        collection: lockedDocumentCollection,
        overrideAccess: true,
      }),
    ).rejects.toBeInstanceOf(NotFound)
  })

  // `document` relates to every collection, so a lock query on `document.value` binds the ids once
  // per collection. Cloudflare D1 caps a statement at 100 bound parameters.
  test('should release the locks of a batch that exceeds the bound parameter limit of D1', async ({
    payload,
  }) => {
    const user = await payload.create({
      collection: 'users',
      data: {
        email: 'bulk-delete-many@payloadcms.com',
        password: 'test',
      },
      overrideAccess: true,
    })

    const ids = await createLockedDocuments({ count: 20, payload, userID: user.id })

    const { docs, errors } = await payload.delete({
      collection: simpleSlug,
      overrideLock: false,
      user,
      where: {
        id: { in: ids },
      },
      overrideAccess: true,
    })

    expect(errors).toHaveLength(0)
    expect(docs).toHaveLength(ids.length)

    const { totalDocs } = await payload.count({
      collection: lockedDocumentCollection,
      overrideAccess: true,
      where: {
        'document.relationTo': { equals: simpleSlug },
      },
    })

    expect(totalDocs).toBe(0)
  })

  // Only the locks of the deleted documents may be loaded: loading every lock of the collection
  // binds all of their ids in a follow-up query
  test('should release a lock when its collection holds more locks than the bound parameter limit of D1', async ({
    payload,
  }) => {
    const user = await payload.create({
      collection: 'users',
      data: {
        email: 'bulk-delete-many-locks@payloadcms.com',
        password: 'test',
      },
      overrideAccess: true,
    })

    const ids = await createLockedDocuments({ count: 120, payload, userID: user.id })

    const { docs, errors } = await payload.delete({
      collection: simpleSlug,
      overrideLock: false,
      user,
      where: {
        id: { equals: ids[0] },
      },
      overrideAccess: true,
    })

    expect(errors).toHaveLength(0)
    expect(docs).toHaveLength(1)

    const { totalDocs } = await payload.count({
      collection: lockedDocumentCollection,
      overrideAccess: true,
      where: {
        'document.relationTo': { equals: simpleSlug },
      },
    })

    expect(totalDocs).toBe(ids.length - 1)
  })
})
