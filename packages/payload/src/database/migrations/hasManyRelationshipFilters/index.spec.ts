import type { Payload, PayloadRequest } from '../../../index.js'

import { describe, expect, it, vi } from 'vitest'

import { flattenAllFields } from '../../../utilities/flattenAllFields.js'
import { migrateHasManyRelationshipFilters } from './index.js'

const fields = flattenAllFields({
  fields: [{ name: 'related', type: 'relationship', hasMany: true, relationTo: 'pages' }],
})

const makePayload = () => {
  const find = vi.fn()
  const updateOne = vi.fn()
  const payload = {
    collections: {
      'payload-preferences': {},
      'payload-query-presets': {},
      posts: { config: { flattenedFields: fields } },
    },
    config: { collections: [] },
    db: { find, updateOne },
  } as unknown as Payload

  return { find, payload, updateOne }
}

describe('migrateHasManyRelationshipFilters', () => {
  it('should migrate every page while preserving preset and preference metadata', async () => {
    const { find, payload, updateOne } = makePayload()
    const req = { transactionID: 123 } as PayloadRequest
    const user = { relationTo: 'users', value: 'owner' }
    const preference = {
      id: 'preference',
      key: 'collection-posts',
      user,
      value: { columns: ['title'], limit: 20, where: { related: { not_equals: [1, 2] } } },
    }
    const firstPreset = {
      id: 'first',
      relatedCollection: 'posts',
      title: 'Saved filter',
      access: { read: { constraint: 'onlyMe', users: ['owner'] } },
      where: { related: { equals: ['a', 'b'] } },
    }
    const secondPreset = {
      id: 'second',
      relatedCollection: 'posts',
      where: { related: { not_equals: ['c'] } },
    }

    find.mockImplementation(({ collection, page }) =>
      Promise.resolve(
        collection === 'payload-query-presets'
          ? {
              docs: page === 1 ? [firstPreset] : [secondPreset],
              hasNextPage: page === 1,
              nextPage: page === 1 ? 2 : null,
            }
          : { docs: [preference], hasNextPage: false },
      ),
    )

    expect(await migrateHasManyRelationshipFilters({ payload, req })).toBe(3)
    expect(find.mock.calls.map(([{ collection, page }]) => ({ collection, page }))).toEqual(
      expect.arrayContaining([
        { collection: 'payload-query-presets', page: 1 },
        { collection: 'payload-query-presets', page: 2 },
        { collection: 'payload-preferences', page: 1 },
      ]),
    )
    expect(updateOne).toHaveBeenCalledWith({
      collection: 'payload-query-presets',
      id: 'first',
      data: { where: { related: { in: ['a', 'b'] } } },
      req,
      returning: false,
    })
    expect(updateOne).toHaveBeenCalledWith({
      collection: 'payload-preferences',
      id: 'preference',
      data: { value: { ...preference.value, where: { related: { not_in: [1, 2] } } } },
      req,
      returning: false,
    })
    expect(updateOne).toHaveBeenCalledWith({
      collection: 'payload-query-presets',
      id: 'second',
      data: { where: { related: { not_in: ['c'] } } },
      req,
      returning: false,
    })
    expect(firstPreset.where).toEqual({ related: { equals: ['a', 'b'] } })
    expect(preference.user).toBe(user)
  })

  it('should skip unrelated preferences, unknown collections and migrated filters', async () => {
    const { find, payload, updateOne } = makePayload()

    find.mockResolvedValue({
      docs: [
        { id: 'a', key: 'dashboard-layout', value: { where: { related: { equals: ['a'] } } } },
        { id: 'b', key: 'collection-removed', value: { where: { related: { equals: ['a'] } } } },
        { id: 'c', relatedCollection: 'removed', where: { related: { equals: ['a'] } } },
        { id: 'd', relatedCollection: 'posts', where: { related: { in: ['a'] } } },
        { id: 'e', key: 'collection-posts', value: { limit: 20 } },
      ],
      hasNextPage: false,
    })

    expect(await migrateHasManyRelationshipFilters({ payload, req: {} as PayloadRequest })).toBe(0)
    expect(updateOne).not.toHaveBeenCalled()
  })

  it('should not query internal collections that are disabled', async () => {
    const { find, payload } = makePayload()

    delete payload.collections['payload-query-presets']
    find.mockResolvedValue({ docs: [], hasNextPage: false })

    await migrateHasManyRelationshipFilters({ payload, req: {} as PayloadRequest })

    expect(find).toHaveBeenCalledTimes(1)
    expect(find.mock.calls[0][0].collection).toBe('payload-preferences')
  })
})
