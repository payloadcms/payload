import type { Payload } from 'payload'

import path from 'path'
import { NotFound } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User } from './payload-types.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { postsSlug } from './slugs.js'

const lockedDocumentCollection = 'payload-locked-documents'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Locked documents - bulk delete', () => {
  let deletingUser: User
  let otherUser: User

  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))

    deletingUser = await payload.create({
      collection: 'users',
      data: {
        email: 'bulk-delete-owner@payloadcms.com',
        password: 'test',
      },
    })

    otherUser = await payload.create({
      collection: 'users',
      data: {
        email: 'bulk-delete-other@payloadcms.com',
        password: 'test',
      },
    })
  })

  afterAll(async () => {
    await payload.destroy()
  })

  // Bulk delete resolves the lock state of the whole batch in a single query, rather than one
  // query per document like deleting a single document does
  it('should skip locked documents but delete the unlocked ones', async () => {
    const lockedPost = await payload.create({
      collection: postsSlug,
      data: {
        text: 'bulk delete locked post',
      },
    })

    const unlockedPost = await payload.create({
      collection: postsSlug,
      data: {
        text: 'bulk delete unlocked post',
      },
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
    })

    const { docs, errors } = await payload.delete({
      collection: postsSlug,
      overrideLock: false, // necessary to trigger the lock check
      user: deletingUser,
      where: {
        id: { in: [lockedPost.id, unlockedPost.id] },
      },
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
    })

    expect(remainingPosts.docs).toHaveLength(1)
    expect(remainingPosts.docs[0]?.id).toStrictEqual(lockedPost.id)

    // The lock of the deleted document must be released
    await expect(
      payload.findByID({
        id: ownLock.id,
        collection: lockedDocumentCollection,
      }),
    ).rejects.toBeInstanceOf(NotFound)
  })
})
