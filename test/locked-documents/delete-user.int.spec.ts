import type { Payload } from 'payload'

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { postsSlug, usersSlug } from './slugs.js'

const lockedDocumentCollection = 'payload-locked-documents'
const preferencesCollection = 'payload-preferences'

const createUserWithLockAndPreference = async ({
  email,
  payload,
}: {
  email: string
  payload: Payload
}) => {
  const user = await payload.create({
    collection: usersSlug,
    data: {
      email,
      password: 'test',
    },
    overrideAccess: true,
  })

  const post = await payload.create({
    collection: postsSlug,
    data: {
      text: `post locked by ${email}`,
    },
    overrideAccess: true,
  })

  const lock = await payload.create({
    collection: lockedDocumentCollection,
    data: {
      document: {
        relationTo: postsSlug,
        value: post.id,
      },
      globalSlug: undefined,
      user: {
        relationTo: usersSlug,
        value: user.id,
      },
    },
    overrideAccess: true,
  })

  const preference = await payload.create({
    collection: preferencesCollection,
    data: {
      key: 'posts-list',
      value: { limit: 10 },
    },
    overrideAccess: true,
    user: { ...user, collection: usersSlug },
  })

  return { lock, post, preference, user }
}

test.suite('Locked documents - deleting a user', { config: './config.ts' }, () => {
  test('should release locks held by a user deleted by ID', async ({ payload }) => {
    const { lock, post, user } = await createUserWithLockAndPreference({
      email: 'delete-by-id-lock@payloadcms.com',
      payload,
    })

    await payload.delete({
      id: user.id,
      collection: usersSlug,
      overrideAccess: true,
    })

    const { docs } = await payload.find({
      collection: lockedDocumentCollection,
      overrideAccess: true,
      where: { id: { equals: lock.id } },
    })

    expect(docs).toHaveLength(0)

    const updatedPost = await payload.update({
      id: post.id,
      collection: postsSlug,
      data: { text: 'updated after lock owner was deleted' },
      overrideAccess: true,
      overrideLock: false,
    })

    expect(updatedPost.text).toBe('updated after lock owner was deleted')
  })

  test('should delete preferences of a user deleted by ID', async ({ payload }) => {
    const { preference, user } = await createUserWithLockAndPreference({
      email: 'delete-by-id-preference@payloadcms.com',
      payload,
    })

    await payload.delete({
      id: user.id,
      collection: usersSlug,
      overrideAccess: true,
    })

    const { docs } = await payload.find({
      collection: preferencesCollection,
      overrideAccess: true,
      where: { id: { equals: preference.id } },
    })

    expect(docs).toHaveLength(0)
  })

  test('should release locks and delete preferences of users deleted in bulk', async ({
    payload,
  }) => {
    const deleted = await createUserWithLockAndPreference({
      email: 'bulk-delete-user@payloadcms.com',
      payload,
    })

    const kept = await createUserWithLockAndPreference({
      email: 'bulk-keep-user@payloadcms.com',
      payload,
    })

    const { errors } = await payload.delete({
      collection: usersSlug,
      overrideAccess: true,
      where: { id: { equals: deleted.user.id } },
    })

    expect(errors).toHaveLength(0)

    const { docs: locks } = await payload.find({
      collection: lockedDocumentCollection,
      overrideAccess: true,
      where: { id: { in: [deleted.lock.id, kept.lock.id] } },
    })

    expect(locks.map(({ id }) => id)).toEqual([kept.lock.id])

    const { docs: preferences } = await payload.find({
      collection: preferencesCollection,
      overrideAccess: true,
      where: { id: { in: [deleted.preference.id, kept.preference.id] } },
    })

    expect(preferences.map(({ id }) => id)).toEqual([kept.preference.id])
  })
})
