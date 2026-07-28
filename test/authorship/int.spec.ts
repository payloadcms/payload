import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { Admin, User } from './payload-types.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import {
  adminsSlug,
  createdOnlySlug,
  menuSlug,
  noAuthorshipSlug,
  postsSlug,
  updatedOnlySlug,
  usersSlug,
} from './slugs.js'

type TestUser = { collection: string } & (Admin | User)

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let user: TestUser
let admin: TestUser
let otherUser: TestUser

const createdPostIDs: (number | string)[] = []

const createPost = async ({ data, user }: { data: Record<string, unknown>; user?: TestUser }) => {
  const doc = await payload.create({
    collection: postsSlug,
    data: data as never,
    depth: 0,
    user,
  })
  createdPostIDs.push(doc.id)
  return doc
}

describe('Authorship', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))

    const userDoc = (
      await payload.find({
        collection: usersSlug,
        depth: 0,
        limit: 1,
        where: { email: { equals: devUser.email } },
      })
    ).docs[0]!
    user = { ...userDoc, collection: usersSlug }

    const adminDoc = await payload.create({
      collection: adminsSlug,
      data: {
        email: 'admin@payloadcms.com',
        password: devUser.password,
      },
    })
    admin = { ...adminDoc, collection: adminsSlug }

    const otherUserDoc = (
      await payload.find({
        collection: usersSlug,
        depth: 0,
        limit: 1,
        where: { email: { equals: 'other@payloadcms.com' } },
      })
    ).docs[0]!
    otherUser = { ...otherUserDoc, collection: usersSlug }
  })

  afterEach(async () => {
    for (const id of createdPostIDs) {
      await payload.delete({ id, collection: postsSlug }).catch(() => null)
    }
    createdPostIDs.length = 0
  })

  afterAll(async () => {
    await payload?.destroy()
  })

  it('should set createdBy and updatedBy from req.user on create', async () => {
    const post = await createPost({ data: { title: 'created' }, user })

    expect(post.createdBy).toEqual({ relationTo: usersSlug, value: user.id })
    expect(post.updatedBy).toEqual({ relationTo: usersSlug, value: user.id })
  })

  it('should keep createdBy as an id reference when the reader lacks access to the related user', async () => {
    const post = await createPost({ data: { title: 'restricted' }, user })

    // `otherUser` can only read their own user record, so populating `user` is denied
    // and the relationship falls back to the id reference rather than the user's data.
    const read = await payload.findByID({
      id: post.id,
      collection: postsSlug,
      depth: 1,
      overrideAccess: false,
      user: otherUser,
    })

    expect(read.createdBy).toEqual({ relationTo: usersSlug, value: user.id })
    expect(read.updatedBy).toEqual({ relationTo: usersSlug, value: user.id })
  })

  it('should populate createdBy when the reader has access to the related user', async () => {
    const post = await createPost({ data: { title: 'own' }, user })

    const read = await payload.findByID({
      id: post.id,
      collection: postsSlug,
      depth: 1,
      overrideAccess: false,
      user,
    })

    const createdBy = read.createdBy as { relationTo: string; value: { id: number | string } }
    expect(createdBy.relationTo).toBe(usersSlug)
    expect(createdBy.value.id).toBe(user.id)
  })

  it('should set updatedBy on update and leave createdBy unchanged', async () => {
    const post = await createPost({ data: { title: 'created' }, user })

    const updated = await payload.update({
      id: post.id,
      collection: postsSlug,
      data: { title: 'updated' },
      depth: 0,
      user: admin,
    })

    expect(updated.createdBy).toEqual({ relationTo: usersSlug, value: user.id })
    expect(updated.updatedBy).toEqual({ relationTo: adminsSlug, value: admin.id })
  })

  it('should not change createdBy when explicitly provided on update (immutable via Local API)', async () => {
    const post = await createPost({ data: { title: 'created' }, user })

    const updated = await payload.update({
      id: post.id,
      collection: postsSlug,
      data: { createdBy: { relationTo: adminsSlug, value: admin.id }, title: 'updated' },
      depth: 0,
      user: admin,
    })

    expect(updated.createdBy).toEqual({ relationTo: usersSlug, value: user.id })
  })

  it('should honor an explicit updatedBy on update via Local API', async () => {
    const post = await createPost({ data: { title: 'created' }, user })

    // With overrideAccess bypassed, an explicit updatedBy is honored over the acting user.
    const updated = await payload.update({
      id: post.id,
      collection: postsSlug,
      data: { title: 'updated', updatedBy: { relationTo: adminsSlug, value: admin.id } },
      depth: 0,
      user,
    })

    expect(updated.updatedBy).toEqual({ relationTo: adminsSlug, value: admin.id })
  })

  it('should let an explicit value in data override the system user', async () => {
    const post = await createPost({
      data: {
        createdBy: { relationTo: adminsSlug, value: admin.id },
        title: 'explicit',
      },
      user,
    })

    expect(post.createdBy).toEqual({ relationTo: adminsSlug, value: admin.id })
  })

  it('should clear updatedBy when null is explicitly passed even with a user present', async () => {
    const post = await createPost({ data: { title: 'created' }, user })

    const updated = await payload.update({
      id: post.id,
      collection: postsSlug,
      data: { title: 'updated', updatedBy: null },
      depth: 0,
      user,
    })

    expect(updated.updatedBy).toBeFalsy()
  })

  it('should leave updatedBy unchanged when updating without a user', async () => {
    const post = await createPost({ data: { title: 'created' }, user })

    const updated = await payload.update({
      id: post.id,
      collection: postsSlug,
      data: { title: 'updated' },
      depth: 0,
    })

    expect(updated.updatedBy).toEqual({ relationTo: usersSlug, value: user.id })
  })

  it('should support polymorphic tracking across multiple auth collections', async () => {
    const post = await createPost({ data: { title: 'by admin' }, user: admin })

    expect(post.createdBy).toEqual({ relationTo: adminsSlug, value: admin.id })
    expect(post.updatedBy).toEqual({ relationTo: adminsSlug, value: admin.id })
  })

  it('should ignore a client-provided createdBy (no spoofing) when overrideAccess is false', async () => {
    const created = await payload.create({
      collection: postsSlug,
      data: {
        createdBy: { relationTo: adminsSlug, value: admin.id },
        title: 'no spoof create',
      },
      depth: 0,
      overrideAccess: false,
      user: user as never,
    })
    createdPostIDs.push(created.id)

    // Field access denies the client value; the hook stamps the real acting user.
    expect(created.createdBy).toEqual({ relationTo: usersSlug, value: user.id })
  })

  it('should ignore a client-provided updatedBy (no spoofing) when overrideAccess is false', async () => {
    const post = await createPost({ data: { title: 'no spoof update' }, user })

    const updated = await payload.update({
      id: post.id,
      collection: postsSlug,
      data: {
        title: 'no spoof update 2',
        updatedBy: { relationTo: adminsSlug, value: admin.id },
      },
      depth: 0,
      overrideAccess: false,
      user: user as never,
    })

    expect(updated.updatedBy).toEqual({ relationTo: usersSlug, value: user.id })
  })

  it('should stamp updatedBy on every doc in a bulk update', async () => {
    const post1 = await createPost({ data: { title: 'bulk a' }, user })
    const post2 = await createPost({ data: { title: 'bulk b' }, user })

    const result = await payload.update({
      collection: postsSlug,
      data: { title: 'bulk updated' },
      depth: 0,
      user: admin,
      where: { id: { in: [post1.id, post2.id] } },
    })

    expect(result.docs).toHaveLength(2)
    for (const doc of result.docs) {
      expect(doc.updatedBy).toEqual({ relationTo: adminsSlug, value: admin.id })
    }
  })

  it('should stamp createdBy from the duplicating user on duplicate', async () => {
    const post = await createPost({ data: { title: 'original' }, user })

    // The beforeDuplicate hook clears the copied author, so the duplicate is
    // re-attributed to whoever performed the duplication.
    const duplicated = await payload.duplicate({
      id: post.id,
      collection: postsSlug,
      depth: 0,
      user: admin,
    })
    createdPostIDs.push(duplicated.id)

    expect(duplicated.createdBy).toEqual({ relationTo: adminsSlug, value: admin.id })
    expect(duplicated.updatedBy).toEqual({ relationTo: adminsSlug, value: admin.id })
  })

  it('should not change updatedBy when a user logs in', async () => {
    const email = `login-check-${Date.now()}@x.com`

    const createdUser = (await payload.create({
      collection: usersSlug,
      data: { email, password: 'test' },
      depth: 0,
      user,
    })) as never as Record<string, unknown>

    await payload.login({
      collection: usersSlug,
      data: { email, password: 'test' },
    })

    const afterLogin = (await payload.findByID({
      collection: usersSlug,
      id: createdUser.id as string,
      depth: 0,
    })) as never as Record<string, unknown>

    // Session writes on login must not bump the user's authorship metadata.
    expect(afterLogin.updatedBy).toEqual(createdUser.updatedBy)

    await payload.delete({ collection: usersSlug, id: createdUser.id as string }).catch(() => null)
  })

  it('should not inject authorship fields when authorship is false', () => {
    const fields = payload.collections[noAuthorshipSlug].config.fields
    const names = fields.filter((f) => 'name' in f).map((f) => (f as { name: string }).name)

    expect(names).not.toContain('createdBy')
    expect(names).not.toContain('updatedBy')
  })

  it('should only inject createdBy when updatedBy is disabled', () => {
    const fields = payload.collections[createdOnlySlug].config.fields
    const names = fields.filter((f) => 'name' in f).map((f) => (f as { name: string }).name)

    expect(names).toContain('createdBy')
    expect(names).not.toContain('updatedBy')
  })

  it('should only inject updatedBy when createdBy is disabled', () => {
    const fields = payload.collections[updatedOnlySlug].config.fields
    const names = fields.filter((f) => 'name' in f).map((f) => (f as { name: string }).name)

    expect(names).toContain('updatedBy')
    expect(names).not.toContain('createdBy')
  })

  it('should stamp only createdBy when updatedBy is disabled', async () => {
    const created = await payload.create({
      collection: createdOnlySlug,
      data: { title: 'created' },
      depth: 0,
      user,
    })

    expect(created.createdBy).toEqual({ relationTo: usersSlug, value: user.id })
    expect(created).not.toHaveProperty('updatedBy')

    const updated = await payload.update({
      collection: createdOnlySlug,
      id: created.id,
      data: { title: 'updated' },
      depth: 0,
      user: admin,
    })

    // createdBy stays put, updatedBy is never tracked
    expect(updated.createdBy).toEqual({ relationTo: usersSlug, value: user.id })
    expect(updated).not.toHaveProperty('updatedBy')

    await payload.delete({ collection: createdOnlySlug, id: created.id }).catch(() => null)
  })

  it('should stamp only updatedBy when createdBy is disabled', async () => {
    const created = await payload.create({
      collection: updatedOnlySlug,
      data: { title: 'created' },
      depth: 0,
      user,
    })

    expect(created.updatedBy).toEqual({ relationTo: usersSlug, value: user.id })
    expect(created).not.toHaveProperty('createdBy')

    const updated = await payload.update({
      collection: updatedOnlySlug,
      id: created.id,
      data: { title: 'updated' },
      depth: 0,
      user: admin,
    })

    // updatedBy follows the latest writer, createdBy is never tracked
    expect(updated.updatedBy).toEqual({ relationTo: adminsSlug, value: admin.id })
    expect(updated).not.toHaveProperty('createdBy')

    await payload.delete({ collection: updatedOnlySlug, id: created.id }).catch(() => null)
  })

  it('should track authorship on globals', async () => {
    const updated = await payload.updateGlobal({
      slug: menuSlug,
      data: { title: 'menu' },
      depth: 0,
      user: admin,
    })

    expect(updated.updatedBy).toEqual({ relationTo: adminsSlug, value: admin.id })
    expect(updated.createdBy).toEqual({ relationTo: adminsSlug, value: admin.id })
  })
})
