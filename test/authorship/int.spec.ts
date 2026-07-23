import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import {
  adminsSlug,
  createdOnlySlug,
  menuSlug,
  noAuthorshipSlug,
  postsSlug,
  usersSlug,
} from './slugs.js'

type TestUser = { collection: string; id: number | string } & Record<string, unknown>

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
    user: user as never,
  })
  createdPostIDs.push(doc.id)
  return doc as { id: number | string } & Record<string, unknown>
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
    await payload.destroy()
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
