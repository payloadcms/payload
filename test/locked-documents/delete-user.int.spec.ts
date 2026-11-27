import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { postsSlug, usersSlug } from './slugs.js'

const lockedDocumentCollection = 'payload-locked-documents'
const preferencesCollection = 'payload-preferences'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const createUserWithLockAndPreference = async (email: string) => {
  const user = await payload.create({
    collection: usersSlug,
    data: {
      email,
      password: 'test',
    },
  })

  const post = await payload.create({
    collection: postsSlug,
    data: {
      text: `post locked by ${email}`,
    },
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
  })

  const preference = await payload.create({
    collection: preferencesCollection,
    data: {
      key: `posts-list-${email}`,
      value: { limit: 10 },
    },
    user: { ...user, collection: usersSlug },
  })

  return { lock, post, preference, user }
}

describe('Locked documents - deleting a user', () => {
  beforeAll(async () => {
    // @ts-expect-error: initPayloadInt does not have a proper type definition
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should release locks held by a user deleted by ID', async () => {
    const { lock, post, user } = await createUserWithLockAndPreference(
      'delete-by-id-lock@payloadcms.com',
    )

    await payload.delete({
      id: user.id,
      collection: usersSlug,
    })

    const { docs } = await payload.find({
      collection: lockedDocumentCollection,
      where: { id: { equals: lock.id } },
    })

    expect(docs).toHaveLength(0)

    const updatedPost = await payload.update({
      id: post.id,
      collection: postsSlug,
      data: { text: 'updated after lock owner was deleted' },
      overrideLock: false,
    })

    expect(updatedPost.text).toBe('updated after lock owner was deleted')
  })

  it('should delete preferences of a user deleted by ID', async () => {
    const { preference, user } = await createUserWithLockAndPreference(
      'delete-by-id-preference@payloadcms.com',
    )

    await payload.delete({
      id: user.id,
      collection: usersSlug,
    })

    const { docs } = await payload.find({
      collection: preferencesCollection,
      where: { id: { equals: preference.id } },
    })

    expect(docs).toHaveLength(0)
  })

  it('should release locks and delete preferences of users deleted in bulk', async () => {
    const deleted = await createUserWithLockAndPreference('bulk-delete-user@payloadcms.com')

    const kept = await createUserWithLockAndPreference('bulk-keep-user@payloadcms.com')

    const { errors } = await payload.delete({
      collection: usersSlug,
      where: { id: { equals: deleted.user.id } },
    })

    expect(errors).toHaveLength(0)

    const { docs: locks } = await payload.find({
      collection: lockedDocumentCollection,
      where: { id: { in: [deleted.lock.id, kept.lock.id] } },
    })

    expect(locks.map(({ id }) => id)).toEqual([kept.lock.id])

    const { docs: preferences } = await payload.find({
      collection: preferencesCollection,
      where: { id: { in: [deleted.preference.id, kept.preference.id] } },
    })

    expect(preferences.map(({ id }) => id)).toEqual([kept.preference.id])
  })
})
