import type { FieldHook } from '../../config/types.js'

import { describe, expect, it } from 'vitest'

import { createCreatedByField } from './index.js'

describe('createdBy first-write detection', () => {
  const field = createCreatedByField()
  const stamp = field.hooks!.beforeChange![0]!
  const actor = { relationTo: 'users', value: 'actor' }
  const creator = { relationTo: 'users', value: 'creator' }

  it.each([
    { description: 'an empty global', operation: 'update', originalDoc: {} },
    {
      description: 'an unsaved global with defaults',
      operation: 'update',
      originalDoc: { title: 'Default title' },
    },
    {
      collection: { slug: 'posts' },
      description: 'a create-validation candidate with defaults',
      operation: 'validate',
      originalDoc: { title: 'Default title' },
    },
  ])('should stamp the actor for $description', async ({ collection, operation, originalDoc }) => {
    const value = await stamp({
      collection,
      context: {},
      operation,
      originalDoc,
      req: { user: { collection: actor.relationTo, id: actor.value } },
      siblingDocWithLocales: {},
    } as Parameters<FieldHook>[0])

    expect(value).toEqual(actor)
  })

  it.each([0, 1, 'existing-global'])(
    'should preserve the creator for persisted ID %s',
    async (id) => {
      const value = await stamp({
        context: {},
        operation: 'update',
        originalDoc: { id, title: 'Existing title' },
        previousValue: creator,
        req: { user: { collection: actor.relationTo, id: actor.value } },
      } as Parameters<FieldHook>[0])

      expect(value).toEqual(creator)
    },
  )

  it('should not backfill a creator on an existing global without one', async () => {
    const value = await stamp({
      context: {},
      operation: 'update',
      originalDoc: { id: 'legacy-global', title: 'Existing title' },
      previousValue: undefined,
      req: { user: { collection: actor.relationTo, id: actor.value } },
    } as Parameters<FieldHook>[0])

    expect(value).toBeUndefined()
  })

  it('should preserve the creator of a persisted global draft without an ID', async () => {
    const storedDoc = { createdAt: '2026-10-01T10:00:00.000Z', title: 'Saved draft' }
    const value = await stamp({
      context: {},
      operation: 'update',
      originalDoc: storedDoc,
      previousValue: creator,
      req: { user: { collection: actor.relationTo, id: actor.value } },
      siblingDocWithLocales: storedDoc,
    } as Parameters<FieldHook>[0])

    expect(value).toEqual(creator)
  })

  it('should not backfill the creator of a saved anonymous draft without an ID', async () => {
    const storedDoc = { createdAt: '2026-10-01T10:00:00.000Z', title: 'Anonymous draft' }
    const value = await stamp({
      context: {},
      operation: 'update',
      originalDoc: storedDoc,
      previousValue: undefined,
      req: { user: { collection: actor.relationTo, id: actor.value } },
      siblingDocWithLocales: storedDoc,
    } as Parameters<FieldHook>[0])

    expect(value).toBeUndefined()
  })
})
