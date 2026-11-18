import type { DefaultDocumentIDType, Payload } from 'payload'

import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { relationshipsSlug, tenantsSlug, usersSlug } from './shared.js'

const locksSlug = 'payload-locked-documents'

test.suite('tenant document locks', { config: './config.ts', resetBetweenTests: false }, () => {
  const createdIDs: { collection: string; id: DefaultDocumentIDType }[] = []
  let payload: Payload
  let tenantAID: DefaultDocumentIDType
  let userA: Awaited<ReturnType<Payload['findByID']>>
  let userB: Awaited<ReturnType<Payload['findByID']>>
  let pageA: Awaited<ReturnType<Payload['findByID']>>
  let pageB: Awaited<ReturnType<Payload['findByID']>>
  let lockB: Awaited<ReturnType<Payload['findByID']>>

  test.beforeEach(async ({ payload: instance }) => {
    payload = instance

    const tenantA = await payload.create({
      collection: tenantsSlug,
      data: { name: 'Lock Tenant A', domain: 'lock-a.test' },
      overrideAccess: true,
    })
    const tenantB = await payload.create({
      collection: tenantsSlug,
      data: { name: 'Lock Tenant B', domain: 'lock-b.test' },
      overrideAccess: true,
    })
    tenantAID = tenantA.id
    createdIDs.push({ id: tenantA.id, collection: tenantsSlug })
    createdIDs.push({ id: tenantB.id, collection: tenantsSlug })

    userA = await payload.create({
      collection: usersSlug,
      data: {
        email: 'lock-tenant-a@test.com',
        password: 'test',
        roles: ['user'],
        tenants: [{ tenant: tenantA.id }],
      },
      overrideAccess: true,
    })
    userB = await payload.create({
      collection: usersSlug,
      data: {
        email: 'lock-tenant-b@test.com',
        password: 'test',
        roles: ['user'],
        tenants: [{ tenant: tenantB.id }],
      },
      overrideAccess: true,
    })
    createdIDs.push({ id: userA.id, collection: usersSlug })
    createdIDs.push({ id: userB.id, collection: usersSlug })

    pageA = await payload.create({
      collection: relationshipsSlug,
      data: { tenant: tenantA.id, title: 'Tenant A lock target' },
      overrideAccess: true,
    })
    pageB = await payload.create({
      collection: relationshipsSlug,
      data: { tenant: tenantB.id, title: 'Tenant B lock target' },
      overrideAccess: true,
    })
    createdIDs.push({ id: pageA.id, collection: relationshipsSlug })
    createdIDs.push({ id: pageB.id, collection: relationshipsSlug })

    lockB = await payload.create({
      collection: locksSlug,
      data: {
        document: { relationTo: relationshipsSlug, value: pageB.id },
        user: { relationTo: usersSlug, value: userB.id },
      },
      overrideAccess: true,
    })
    createdIDs.push({ id: lockB.id, collection: locksSlug })
  })

  test.afterEach(async () => {
    vi.restoreAllMocks()
    for (const { id, collection } of createdIDs.reverse()) {
      await payload.delete({ collection, id, overrideAccess: true })
    }
    createdIDs.length = 0
  })

  test('should hide locks whose target document is in another tenant', async () => {
    const pages = await payload.find({
      collection: relationshipsSlug,
      overrideAccess: false,
      user: userA,
      where: { id: { equals: pageB.id } },
    })
    const locks = await payload.find({ collection: locksSlug, overrideAccess: false, user: userA })

    expect(pages.docs).toHaveLength(0)
    expect(locks.docs).toHaveLength(0)
  })

  test('should deny cross-tenant lock creation', async () => {
    await expect(
      payload.create({
        collection: locksSlug,
        data: {
          document: { relationTo: relationshipsSlug, value: pageB.id },
          user: { relationTo: usersSlug, value: userA.id },
        },
        overrideAccess: false,
        user: userA,
      }),
    ).rejects.toThrow()
  })

  test('should deny cross-tenant lock updates and deletes', async () => {
    await expect(
      payload.update({
        collection: locksSlug,
        id: lockB.id,
        data: { user: { relationTo: usersSlug, value: userA.id } },
        overrideAccess: false,
        user: userA,
      }),
    ).rejects.toThrow()

    await expect(
      payload.delete({ collection: locksSlug, id: lockB.id, overrideAccess: false, user: userA }),
    ).rejects.toThrow()
  })

  test('should allow an editor to manage locks on their own document', async () => {
    const lock = await payload.create({
      collection: locksSlug,
      data: {
        document: { relationTo: relationshipsSlug, value: pageA.id },
        user: { relationTo: usersSlug, value: userA.id },
      },
      overrideAccess: false,
      user: userA,
    })
    createdIDs.push({ id: lock.id, collection: locksSlug })

    const locks = await payload.find({ collection: locksSlug, overrideAccess: false, user: userA })

    expect(locks.docs.map(({ id }) => id)).toEqual([lock.id])

    await payload.update({
      collection: locksSlug,
      id: lock.id,
      data: { user: { relationTo: usersSlug, value: userA.id } },
      overrideAccess: false,
      user: userA,
    })
    await payload.delete({ collection: locksSlug, id: lock.id, overrideAccess: false, user: userA })
    createdIDs.pop()
  })

  test('should reject moving a lock to another tenant', async () => {
    const lock = await payload.create({
      collection: locksSlug,
      data: {
        document: { relationTo: relationshipsSlug, value: pageA.id },
        user: { relationTo: usersSlug, value: userA.id },
      },
      overrideAccess: true,
    })
    createdIDs.push({ id: lock.id, collection: locksSlug })

    await expect(
      payload.update({
        collection: locksSlug,
        id: lock.id,
        data: { document: { relationTo: relationshipsSlug, value: pageB.id } },
        overrideAccess: false,
        user: userA,
      }),
    ).rejects.toThrow()
  })

  test('should reject a lock row with both document and global targets', async () => {
    await expect(
      payload.create({
        collection: locksSlug,
        data: {
          document: { relationTo: relationshipsSlug, value: pageB.id },
          globalSlug: 'some-global',
          user: { relationTo: usersSlug, value: userA.id },
        },
        overrideAccess: false,
        user: userA,
      }),
    ).rejects.toThrow()
  })

  test('should allow an editor to take over a lock on an editable document', async () => {
    const otherEditor = await payload.create({
      collection: usersSlug,
      data: {
        email: 'lock-tenant-a-other@test.com',
        password: 'test',
        roles: ['user'],
        tenants: [{ tenant: tenantAID }],
      },
      overrideAccess: true,
    })
    createdIDs.push({ id: otherEditor.id, collection: usersSlug })

    const lock = await payload.create({
      collection: locksSlug,
      data: {
        document: { relationTo: relationshipsSlug, value: pageA.id },
        user: { relationTo: usersSlug, value: otherEditor.id },
      },
      overrideAccess: true,
    })
    createdIDs.push({ id: lock.id, collection: locksSlug })

    const takenOver = await payload.update({
      collection: locksSlug,
      id: lock.id,
      data: { user: { relationTo: usersSlug, value: userA.id } },
      overrideAccess: false,
      user: userA,
    })

    expect((takenOver.user.value as { id: number | string }).id).toBe(userA.id)

    await payload.delete({ collection: locksSlug, id: lock.id, overrideAccess: false, user: userA })
    createdIDs.pop()
  })

  test('should evaluate ID-based target access for each lock', async () => {
    const secondPage = await payload.create({
      collection: relationshipsSlug,
      data: { tenant: tenantAID, title: 'Another tenant A lock target' },
      overrideAccess: true,
    })
    createdIDs.push({ id: secondPage.id, collection: relationshipsSlug })

    const firstLock = await payload.create({
      collection: locksSlug,
      data: {
        document: { relationTo: relationshipsSlug, value: pageA.id },
        user: { relationTo: usersSlug, value: userA.id },
      },
      overrideAccess: true,
    })
    const secondLock = await payload.create({
      collection: locksSlug,
      data: {
        document: { relationTo: relationshipsSlug, value: secondPage.id },
        user: { relationTo: usersSlug, value: userA.id },
      },
      overrideAccess: true,
    })
    createdIDs.push({ id: firstLock.id, collection: locksSlug })
    createdIDs.push({ id: secondLock.id, collection: locksSlug })

    const access = payload.collections[relationshipsSlug].config.access.read
    vi.spyOn(payload.collections[relationshipsSlug].config.access, 'read').mockImplementation(
      (args) => (args.id === pageA.id ? access(args) : false),
    )

    const locks = await payload.find({ collection: locksSlug, overrideAccess: false, user: userA })

    expect(locks.docs.map(({ id }) => id)).toEqual([firstLock.id])
  })
})
