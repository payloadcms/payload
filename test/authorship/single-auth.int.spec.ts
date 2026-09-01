import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { menuSlug, postsSlug, usersSlug } from './slugs.js'

type TestUser = { collection: string; id: number | string } & Record<string, unknown>

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let user: TestUser

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

// Authorship intentionally uses a polymorphic relationship even when there is only ONE auth
// collection. These tests lock in that the stored shape is `{ relationTo, value }` regardless of
// auth-collection count, so adding a second auth collection later requires no data/schema migration.
describe('Authorship - single auth collection', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname, undefined, undefined, 'config.single-auth.ts'))

    const userDoc = (await payload.find({ collection: usersSlug, depth: 0, limit: 1 })).docs[0]!
    user = { ...userDoc, collection: usersSlug }
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

  it('should store createdBy and updatedBy as polymorphic references on create', async () => {
    const post = await createPost({ data: { title: 'created' }, user })

    expect(post.createdBy).toEqual({ relationTo: usersSlug, value: user.id })
    expect(post.updatedBy).toEqual({ relationTo: usersSlug, value: user.id })
  })

  it('should set updatedBy on update and leave createdBy unchanged', async () => {
    const post = await createPost({ data: { title: 'created' }, user })

    const updated = await payload.update({
      id: post.id,
      collection: postsSlug,
      data: { title: 'updated' },
      depth: 0,
      user,
    })

    expect(updated.createdBy).toEqual({ relationTo: usersSlug, value: user.id })
    expect(updated.updatedBy).toEqual({ relationTo: usersSlug, value: user.id })
  })

  it('should let an explicit value in data override the system user', async () => {
    const post = await createPost({
      data: {
        createdBy: { relationTo: usersSlug, value: user.id },
        title: 'explicit',
      },
      user,
    })

    expect(post.createdBy).toEqual({ relationTo: usersSlug, value: user.id })
  })

  it('should populate createdBy to the related user document when depth is requested', async () => {
    const created = await createPost({ data: { title: 'populated' }, user })

    const post = await payload.findByID({
      id: created.id,
      collection: postsSlug,
      depth: 1,
      populate: { [usersSlug]: { email: true } },
    })

    const createdBy = post.createdBy as { relationTo: string; value: { email?: string } }
    expect(createdBy.relationTo).toBe(usersSlug)
    expect(createdBy.value.email).toBe(user.email)
  })

  it('should stamp createdBy on a global on first write', async () => {
    const menu = await payload.updateGlobal({
      slug: menuSlug,
      data: { title: 'menu' },
      depth: 0,
      user,
    })

    expect(menu.createdBy).toEqual({ relationTo: usersSlug, value: user.id })
    expect(menu.updatedBy).toEqual({ relationTo: usersSlug, value: user.id })
  })
})
