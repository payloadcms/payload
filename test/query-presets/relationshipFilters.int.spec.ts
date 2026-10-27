import type { Where } from 'payload'

import { createPayloadRequest } from 'payload'
import { migrateHasManyRelationshipFilters } from 'payload/migrations'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { seedData } from './seed.js'
import { pagesSlug, postsSlug, usersSlug } from './slugs.js'

test.suite('Saved hasMany relationship filter migration', { config: './config.ts' }, () => {
  test('should migrate persisted presets and legacy preferences without changing their metadata', async ({
    payload,
  }) => {
    const req = await createPayloadRequest({ payload })
    const { docs: users } = await payload.find({
      overrideAccess: true,
      collection: usersSlug,
      limit: 1,
    })
    const first = await payload.create({
      overrideAccess: true,
      collection: pagesSlug,
      data: { text: 'First related page' },
    })
    const second = await payload.create({
      overrideAccess: true,
      collection: pagesSlug,
      data: { text: 'Second related page' },
    })
    const included = await payload.create({
      overrideAccess: true,
      collection: postsSlug,
      data: { text: 'Included', relatedPages: [first.id, second.id] },
    })
    const excluded = await payload.create({
      overrideAccess: true,
      collection: postsSlug,
      data: { text: 'Excluded', relatedPages: [] },
    })
    const ids = [first.id, second.id]
    const positive = await payload.create({
      overrideAccess: true,
      collection: 'payload-query-presets',
      data: {
        ...seedData.everyone(),
        relatedCollection: postsSlug,
        title: 'Legacy equals',
        where: { relatedPages: { equals: ids } },
      },
    })
    const negative = await payload.create({
      overrideAccess: true,
      collection: 'payload-query-presets',
      data: {
        ...seedData.everyone(),
        relatedCollection: postsSlug,
        title: 'Legacy not equals',
        where: { relatedPages: { not_equals: ids } },
      },
    })
    const preference = await payload.db.create({
      collection: 'payload-preferences',
      data: {
        key: `collection-${postsSlug}`,
        user: { relationTo: usersSlug, value: users[0]!.id },
        value: { limit: 25, preset: positive.id, where: { relatedPages: { equals: ids } } },
      },
      req,
    })
    const beforePreference = await payload.findByID({
      overrideAccess: true,
      collection: 'payload-preferences',
      id: preference.id,
      depth: 0,
    })

    expect(await migrateHasManyRelationshipFilters({ payload, req })).toBe(3)

    const migratedPositive = await payload.findByID({
      overrideAccess: true,
      collection: 'payload-query-presets',
      id: positive.id,
      depth: 0,
    })
    const migratedNegative = await payload.findByID({
      overrideAccess: true,
      collection: 'payload-query-presets',
      id: negative.id,
      depth: 0,
    })
    const migratedPreference = await payload.findByID({
      overrideAccess: true,
      collection: 'payload-preferences',
      id: preference.id,
      depth: 0,
    })

    expect(migratedPositive.where).toEqual({ or: [{ and: [{ relatedPages: { in: ids } }] }] })
    expect(migratedNegative.where).toEqual({ or: [{ and: [{ relatedPages: { not_in: ids } }] }] })
    expect(migratedPositive.access).toEqual(positive.access)
    expect(migratedPositive.title).toBe(positive.title)
    expect(migratedPreference.user).toEqual(beforePreference.user)
    expect(migratedPreference.value).toEqual({
      limit: 25,
      preset: positive.id,
      where: { relatedPages: { in: ids } },
    })

    for (const [preset, expectedID] of [
      [migratedPositive, included.id],
      [migratedNegative, excluded.id],
    ] as const) {
      const result = await payload.find({
        overrideAccess: true,
        collection: postsSlug,
        where: { and: [{ id: { in: [included.id, excluded.id] } }, preset.where as Where] },
      })

      expect(result.docs.map(({ id }) => id)).toEqual([expectedID])
    }

    expect(await migrateHasManyRelationshipFilters({ payload, req })).toBe(0)
  })
})
