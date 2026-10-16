/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { createPayloadRequest } from 'payload'
import { PREFERENCE_KEYS } from 'payload/shared'
import { expect } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercise the existing preference endpoint operations.
import { findOne } from '../../packages/payload/src/preferences/operations/findOne.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercise the existing preference endpoint operations.
import { update } from '../../packages/payload/src/preferences/operations/update.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercise the real document handler.
import { getDashboardDocuments } from '../../packages/ui/src/widgets/RecentlyViewed/getDocuments.js'
import { test } from '../__helpers/int/vitest.js'

test.suite('Pinned document preferences', { config: './config.ts' }, () => {
  test('should isolate pin reads and writes between authenticated users', async ({ payload }) => {
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
      data: { title: 'Personal pin' },
      overrideAccess: true,
    })
    const ownerReq = await createPayloadRequest({
      payload,
      req: { user: { ...owner, collection: 'users' } },
    })
    const otherReq = await createPayloadRequest({
      payload,
      req: { user: { ...other, collection: 'users' } },
    })
    const value = { items: [{ id: ticket.id, collectionSlug: 'tickets' }] }
    const key = PREFERENCE_KEYS.PINNED_DOCUMENTS

    await update({ key, req: ownerReq, user: ownerReq.user, value })
    expect(await findOne({ key, req: otherReq, user: otherReq.user })).toBeNull()
    await update({ key, req: otherReq, user: otherReq.user, value })
    await update({ key, req: otherReq, user: otherReq.user, value: { items: [] } })
    expect((await findOne({ key, req: ownerReq, user: ownerReq.user })).value).toEqual(value)
    expect((await findOne({ key, req: otherReq, user: otherReq.user })).value).toEqual({
      items: [],
    })
    const preferences = await payload.find({
      collection: 'payload-preferences',
      depth: 0,
      overrideAccess: false,
      user: otherReq.user,
      where: { key: { equals: key } },
    })

    expect(preferences.docs).toHaveLength(1)
    expect(preferences.docs[0].user).toEqual({ relationTo: 'users', value: other.id })
  })

  test('should reject unauthenticated preference writes', async ({ payload }) => {
    const req = await createPayloadRequest({ payload })
    const key = PREFERENCE_KEYS.PINNED_DOCUMENTS

    await expect(update({ key, req, user: null, value: { items: [] } })).rejects.toThrow()
    expect(await findOne({ key, req, user: null })).toBeNull()
  })

  test('should respect document read access when displaying stored pins', async ({ payload }) => {
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
    const req = await createPayloadRequest({
      payload,
      req: { user: { ...owner, collection: 'users' } },
    })

    await update({
      key: PREFERENCE_KEYS.PINNED_DOCUMENTS,
      req,
      user: req.user,
      value: { items: [{ id: ticket.id, collectionSlug: 'tickets' }] },
    })
    const result = await getDashboardDocuments({ limit: 4, page: 1, req, tab: 'pinned' })

    expect(result.items).toEqual([])
    expect(result.totalDocs).toBe(0)
  })

  test('should deduplicate references and tolerate stale or malformed preference items', async ({
    payload,
  }) => {
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'pin-values@payloadcms.com', password: 'test' },
      overrideAccess: true,
    })
    const ticket = await payload.create({
      collection: 'tickets',
      data: { title: 'Valid target' },
      overrideAccess: true,
    })
    const req = await createPayloadRequest({
      payload,
      req: { user: { ...owner, collection: 'users' } },
    })
    const item = { id: ticket.id, collectionSlug: 'tickets' }

    await update({
      key: PREFERENCE_KEYS.PINNED_DOCUMENTS,
      req,
      user: req.user,
      value: {
        items: [
          item,
          item,
          null,
          { id: 1, collectionSlug: 'removed' },
          { collectionSlug: 'tickets' },
        ],
      },
    })
    const result = await getDashboardDocuments({ limit: 4, page: 1, req, tab: 'pinned' })

    expect(result.totalDocs).toBe(1)
    expect(result.items.map(({ id }) => id)).toEqual([ticket.id])
    expect(payload.collections).not.toHaveProperty('payload-pinned-documents')
  })
})
