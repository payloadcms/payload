import { Locked } from 'payload'
import { wait } from 'payload/shared'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import { autosaveGlobalSlug } from './globals/AutosaveGlobal/index.js'
import { autosaveSlug, postsSlug } from './slugs.js'

const lockedDocumentCollection = 'payload-locked-documents'

test.suite('Autosave document locks', { config: './config.ts', resetBetweenTests: false }, () => {
  let user: { id: number | string }
  let user2: { id: number | string }

  test.beforeAll(async ({ payloadInstance: payload }) => {
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
        email: 'autosave-lock@payloadcms.com',
        password: 'test',
      },
      overrideAccess: true,
    })
  })

  test('should advance updatedAt when the lock heartbeat writes empty data', async ({
    payload,
  }) => {
    const heartbeatPost = await payload.create({
      collection: postsSlug,
      data: {
        text: 'heartbeat post',
      },
      overrideAccess: true,
    })

    const lock = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        document: {
          relationTo: 'posts',
          value: heartbeatPost.id,
        },
        globalSlug: undefined,
        user: {
          relationTo: 'users',
          value: user.id,
        },
      },
      overrideAccess: true,
    })

    const before = await payload.findByID({
      collection: lockedDocumentCollection,
      id: lock.id,
      overrideAccess: true,
    })

    // Longer than one second so a timestamp truncated to seconds still moves.
    await wait(1100)

    await payload.db.updateOne({
      id: lock.id,
      collection: lockedDocumentCollection,
      data: {},
      returning: false,
    })

    const after = await payload.findByID({
      collection: lockedDocumentCollection,
      id: lock.id,
      overrideAccess: true,
    })

    expect(new Date(after.updatedAt).getTime()).toBeGreaterThan(
      new Date(before.updatedAt).getTime(),
    )
  })

  test('should keep the lock when the owner autosaves a collection', async ({ payload }) => {
    const doc = await payload.create({
      collection: autosaveSlug,
      data: { fieldA: 'before' },
      draft: true,
      overrideAccess: true,
    })

    const lock = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        document: { relationTo: autosaveSlug, value: doc.id },
        globalSlug: undefined,
        user: { relationTo: 'users', value: user.id },
      },
      overrideAccess: true,
    })

    await payload.update({
      id: doc.id,
      autosave: true,
      collection: autosaveSlug,
      data: { fieldA: 'during' },
      draft: true,
      overrideAccess: true,
      overrideLock: false,
      user,
    })

    const locks = await payload.find({
      collection: lockedDocumentCollection,
      overrideAccess: true,
      where: {
        and: [
          { 'document.relationTo': { equals: autosaveSlug } },
          { 'document.value': { equals: doc.id } },
        ],
      },
    })

    expect(locks.docs).toHaveLength(1)
    expect(locks.docs[0]?.id).toBe(lock.id)
  })

  test('should keep the lock when the owner autosaves a global', async ({ payload }) => {
    const lock = await payload.create({
      collection: lockedDocumentCollection,
      data: {
        globalSlug: autosaveGlobalSlug,
        user: { relationTo: 'users', value: user.id },
      },
      overrideAccess: true,
    })

    await payload.updateGlobal({
      autosave: true,
      data: { text: 'during' },
      draft: true,
      overrideAccess: true,
      overrideLock: false,
      slug: autosaveGlobalSlug,
      user,
    })

    const locks = await payload.find({
      collection: lockedDocumentCollection,
      overrideAccess: true,
      where: { globalSlug: { equals: autosaveGlobalSlug } },
    })

    expect(locks.docs).toHaveLength(1)
    expect(locks.docs[0]?.id).toBe(lock.id)

    await payload.delete({
      id: lock.id,
      collection: lockedDocumentCollection,
      overrideAccess: true,
    })
  })

  test('should remove the lock when the owner publishes an autosave collection', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: autosaveSlug,
      data: { fieldA: 'draft' },
      draft: true,
      overrideAccess: true,
    })

    await payload.create({
      collection: lockedDocumentCollection,
      data: {
        document: { relationTo: autosaveSlug, value: doc.id },
        globalSlug: undefined,
        user: { relationTo: 'users', value: user.id },
      },
      overrideAccess: true,
    })

    await payload.update({
      id: doc.id,
      collection: autosaveSlug,
      data: { _status: 'published', fieldA: 'published' },
      overrideAccess: true,
      overrideLock: false,
      user,
    })

    const locks = await payload.find({
      collection: lockedDocumentCollection,
      overrideAccess: true,
      where: {
        and: [
          { 'document.relationTo': { equals: autosaveSlug } },
          { 'document.value': { equals: doc.id } },
        ],
      },
    })

    expect(locks.docs).toHaveLength(0)
  })

  test('should reject an autosave from another user while the lock is fresh', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: autosaveSlug,
      data: { fieldA: 'owned' },
      draft: true,
      overrideAccess: true,
    })

    await payload.create({
      collection: lockedDocumentCollection,
      data: {
        document: { relationTo: autosaveSlug, value: doc.id },
        globalSlug: undefined,
        user: { relationTo: 'users', value: user2.id },
      },
      overrideAccess: true,
    })

    await expect(
      payload.update({
        id: doc.id,
        autosave: true,
        collection: autosaveSlug,
        data: { fieldA: 'stolen' },
        draft: true,
        overrideAccess: true,
        overrideLock: false,
        user,
      }),
    ).rejects.toBeInstanceOf(Locked)

    const saved = await payload.findByID({
      id: doc.id,
      collection: autosaveSlug,
      draft: true,
      overrideAccess: true,
    })

    expect(saved.fieldA).toEqual('owned')
  })

  test('should remove the lock when an autosave document is deleted', async ({ payload }) => {
    const doc = await payload.create({
      collection: autosaveSlug,
      data: { fieldA: 'gone' },
      draft: true,
      overrideAccess: true,
    })

    await payload.create({
      collection: lockedDocumentCollection,
      data: {
        document: { relationTo: autosaveSlug, value: doc.id },
        globalSlug: undefined,
        user: { relationTo: 'users', value: user.id },
      },
      overrideAccess: true,
    })

    await payload.delete({
      id: doc.id,
      collection: autosaveSlug,
      overrideAccess: true,
      overrideLock: false,
      user,
    })

    const locks = await payload.find({
      collection: lockedDocumentCollection,
      overrideAccess: true,
      where: {
        and: [
          { 'document.relationTo': { equals: autosaveSlug } },
          { 'document.value': { equals: doc.id } },
        ],
      },
    })

    expect(locks.docs).toHaveLength(0)
  })

  test('should remove the lock when an autosave document is trashed', async ({ payload }) => {
    const doc = await payload.create({
      collection: autosaveSlug,
      data: { fieldA: 'trash' },
      draft: true,
      overrideAccess: true,
    })

    await payload.create({
      collection: lockedDocumentCollection,
      data: {
        document: { relationTo: autosaveSlug, value: doc.id },
        globalSlug: undefined,
        user: { relationTo: 'users', value: user.id },
      },
      overrideAccess: true,
    })

    await payload.update({
      id: doc.id,
      collection: autosaveSlug,
      data: { deletedAt: new Date().toISOString() },
      overrideAccess: true,
      overrideLock: false,
      user,
    })

    const locks = await payload.find({
      collection: lockedDocumentCollection,
      overrideAccess: true,
      where: {
        and: [
          { 'document.relationTo': { equals: autosaveSlug } },
          { 'document.value': { equals: doc.id } },
        ],
      },
    })

    expect(locks.docs).toHaveLength(0)
  })

  test('should still clear the lock on save when autosave is disabled', async ({ payload }) => {
    const doc = await payload.create({
      collection: postsSlug,
      data: { text: 'plain' },
      overrideAccess: true,
    })

    await payload.create({
      collection: lockedDocumentCollection,
      data: {
        document: { relationTo: postsSlug, value: doc.id },
        globalSlug: undefined,
        user: { relationTo: 'users', value: user.id },
      },
      overrideAccess: true,
    })

    await payload.update({
      id: doc.id,
      collection: postsSlug,
      data: { text: 'saved' },
      overrideAccess: true,
      overrideLock: false,
      user,
    })

    const locks = await payload.find({
      collection: lockedDocumentCollection,
      overrideAccess: true,
      where: {
        and: [
          { 'document.relationTo': { equals: postsSlug } },
          { 'document.value': { equals: doc.id } },
        ],
      },
    })

    expect(locks.docs).toHaveLength(0)
  })
})
