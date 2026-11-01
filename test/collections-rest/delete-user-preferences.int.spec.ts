import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

const preferencesSlug = 'payload-preferences'

test.suite('Collections REST - delete user preferences', { config: './config.ts' }, () => {
  test('should delete the preferences of a deleted user via where delete', async ({ payload }) => {
    const owner = await payload.create({
      collection: 'users',
      data: {
        email: 'delete-user-preferences-where@payloadcms.com',
        password: 'test',
      },
      overrideAccess: true,
    })

    const user = { ...owner, collection: 'users' as const }
    const createdPrefIds: (number | string)[] = []

    for (const key of ['nav', 'locale', `collection-${preferencesSlug}`]) {
      const pref = await payload.create({
        collection: preferencesSlug,
        data: {
          key,
          user: { relationTo: 'users', value: owner.id },
          value: {},
        },
        user,
      })
      createdPrefIds.push(pref.id)
    }

    const { docs, errors } = await payload.delete({
      collection: 'users',
      where: {
        id: { equals: owner.id },
      },
      overrideAccess: true,
    })

    expect(errors).toHaveLength(0)
    expect(docs).toHaveLength(1)

    const { totalDocs } = await payload.db.count({
      collection: preferencesSlug,
      where: {
        id: { in: createdPrefIds },
      },
    })

    expect(totalDocs).toBe(0)
  })

  test('should delete the preferences of a deleted user via deleteByID', async ({ payload }) => {
    const owner = await payload.create({
      collection: 'users',
      data: {
        email: 'delete-user-preferences-by-id@payloadcms.com',
        password: 'test',
      },
      overrideAccess: true,
    })

    const user = { ...owner, collection: 'users' as const }
    const createdPrefIds: (number | string)[] = []

    for (const key of ['nav', 'locale', `collection-${preferencesSlug}`]) {
      const pref = await payload.create({
        collection: preferencesSlug,
        data: {
          key,
          user: { relationTo: 'users', value: owner.id },
          value: {},
        },
        user,
      })
      createdPrefIds.push(pref.id)
    }

    const doc = await payload.delete({
      collection: 'users',
      id: owner.id,
      overrideAccess: true,
    })

    expect(doc.id).toEqual(owner.id)

    const { totalDocs } = await payload.db.count({
      collection: preferencesSlug,
      where: {
        id: { in: createdPrefIds },
      },
    })

    expect(totalDocs).toBe(0)
  })
})
