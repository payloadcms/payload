/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

test.suite('Pinned documents', { config: './config.ts' }, () => {
  test('should store queryable pins in a hidden collection owned by the authenticated user', async ({
    payload,
  }) => {
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'pin-owner@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const other = await payload.create({
      collection: 'users',
      data: { email: 'pin-other@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const ticket = await payload.create({
      collection: 'tickets',
      data: { title: 'Pinned ticket' },
      overrideAccess: true,
    })
    const user = { ...owner, collection: 'users' as const }
    const pin = await payload.create({
      collection: 'payload-pinned-documents',
      data: {
        document: { relationTo: 'tickets', value: ticket.id },
        key: 'spoofed',
        user: { relationTo: 'users', value: other.id },
      },
      depth: 0,
      overrideAccess: false,
      user,
    })

    expect(payload.collections['payload-pinned-documents'].config.admin.hidden).toBe(true)
    expect(pin.user).toEqual({ relationTo: 'users', value: owner.id })
    const result = await payload.find({
      collection: 'payload-pinned-documents',
      depth: 0,
      overrideAccess: false,
      user,
      where: { 'document.value': { equals: ticket.id } },
    })

    expect(result.docs).toHaveLength(1)
    expect(result.docs[0].document).toEqual({ relationTo: 'tickets', value: ticket.id })
  })

  test('should preserve ownership and the uniqueness key when updating a pin', async ({
    payload,
  }) => {
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'pin-owner@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const other = await payload.create({
      collection: 'users',
      data: { email: 'pin-other@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const ticket = await payload.create({
      collection: 'tickets',
      data: { title: 'Immutable owner' },
      overrideAccess: true,
    })
    const user = { ...owner, collection: 'users' as const }
    const pin = await payload.create({
      collection: 'payload-pinned-documents',
      data: {
        document: { relationTo: 'tickets', value: ticket.id },
        key: '',
        user: { relationTo: 'users', value: owner.id },
      },
      depth: 0,
      overrideAccess: false,
      user,
    })
    const updated = await payload.update({
      id: pin.id,
      collection: 'payload-pinned-documents',
      data: { key: 'spoofed', user: { relationTo: 'users', value: other.id } },
      depth: 0,
      overrideAccess: false,
      user,
    })

    expect(updated.user).toEqual(pin.user)
    expect(updated.key).toBe(pin.key)
  })

  test('should reject pinning a document the user cannot read', async ({ payload }) => {
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'pins-restricted@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const ticket = await payload.create({
      collection: 'tickets',
      data: { title: 'Restricted target' },
      overrideAccess: true,
    })

    await expect(
      payload.create({
        collection: 'payload-pinned-documents',
        data: {
          document: { relationTo: 'tickets', value: ticket.id },
          key: '',
          user: { relationTo: 'users', value: owner.id },
        },
        overrideAccess: false,
        user: { ...owner, collection: 'users' },
      }),
    ).rejects.toThrow()
    expect(
      (await payload.find({ collection: 'payload-pinned-documents', overrideAccess: true }))
        .totalDocs,
    ).toBe(0)
  })

  test('should prevent other users and anonymous requests from reading, changing or deleting a pin', async ({
    payload,
  }) => {
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'pin-owner@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const other = await payload.create({
      collection: 'users',
      data: { email: 'pin-other@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const ticket = await payload.create({
      collection: 'tickets',
      data: { title: 'Private pin' },
      overrideAccess: true,
    })
    const pin = await payload.create({
      collection: 'payload-pinned-documents',
      data: {
        document: { relationTo: 'tickets', value: ticket.id },
        key: '',
        user: { relationTo: 'users', value: owner.id },
      },
      overrideAccess: false,
      user: { ...owner, collection: 'users' },
    })
    const user = { ...other, collection: 'users' as const }
    const result = await payload.find({
      collection: 'payload-pinned-documents',
      overrideAccess: false,
      user,
    })

    expect(result.docs).toHaveLength(0)
    await expect(
      payload.find({ collection: 'payload-pinned-documents', overrideAccess: false }),
    ).rejects.toThrow()
    await expect(
      payload.update({
        id: pin.id,
        collection: 'payload-pinned-documents',
        data: { key: 'changed' },
        overrideAccess: false,
        user,
      }),
    ).rejects.toThrow()
    await expect(
      payload.delete({
        id: pin.id,
        collection: 'payload-pinned-documents',
        overrideAccess: false,
        user,
      }),
    ).rejects.toThrow()
    await payload.delete({
      id: pin.id,
      collection: 'payload-pinned-documents',
      overrideAccess: false,
      user: { ...owner, collection: 'users' },
    })
    expect(
      (await payload.find({ collection: 'payload-pinned-documents', overrideAccess: true }))
        .totalDocs,
    ).toBe(0)
  })

  test('should reject duplicate pins while allowing different users to pin the same document', async ({
    payload,
  }) => {
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'pin-owner@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const other = await payload.create({
      collection: 'users',
      data: { email: 'pin-other@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const ticket = await payload.create({
      collection: 'tickets',
      data: { title: 'Shared target' },
      overrideAccess: true,
    })
    const data = {
      document: { relationTo: 'tickets' as const, value: ticket.id },
      key: '',
      user: { relationTo: 'users' as const, value: owner.id },
    }

    await payload.create({
      collection: 'payload-pinned-documents',
      data,
      overrideAccess: false,
      user: { ...owner, collection: 'users' },
    })
    await expect(
      payload.create({
        collection: 'payload-pinned-documents',
        data,
        overrideAccess: false,
        user: { ...owner, collection: 'users' },
      }),
    ).rejects.toThrow()
    await payload.create({
      collection: 'payload-pinned-documents',
      data,
      overrideAccess: false,
      user: { ...other, collection: 'users' },
    })
    expect(
      (await payload.find({ collection: 'payload-pinned-documents', overrideAccess: true }))
        .totalDocs,
    ).toBe(2)
  })

  test('should honor a configured collection access override', async ({ payload }) => {
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'pins-disabled@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const ticket = await payload.create({
      collection: 'tickets',
      data: { title: 'Disabled pins' },
      overrideAccess: true,
    })

    await expect(
      payload.create({
        collection: 'payload-pinned-documents',
        data: {
          document: { relationTo: 'tickets', value: ticket.id },
          key: '',
          user: { relationTo: 'users', value: owner.id },
        },
        overrideAccess: false,
        user: { ...owner, collection: 'users' },
      }),
    ).rejects.toThrow()
  })
})
