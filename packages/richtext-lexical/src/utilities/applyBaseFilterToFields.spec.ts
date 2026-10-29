import { describe, expect, it, vi } from 'vitest'

import type { Block, Field, RelationshipField, SanitizedConfig } from 'payload'

import { applyBaseFilterToFields } from './applyBaseFilterToFields.js'

const nestedRelationship = (fields: Field[]): RelationshipField => {
  const blockField = fields[0]
  if (blockField.type !== 'blocks' || typeof blockField.blocks[0] === 'string') {
    throw new Error('Expected nested block')
  }
  const relationship = blockField.blocks[0].fields[0]
  if (relationship.type !== 'relationship') {
    throw new Error('Expected nested relationship')
  }
  return relationship
}

const runFilter = async (field: RelationshipField): Promise<unknown> => {
  if (typeof field.filterOptions !== 'function') {
    throw new Error('Expected relationship filterOptions')
  }
  return field.filterOptions({
    relationTo: 'items',
    req: {} as never,
    user: { id: 'user' },
  } as never)
}

const block = (relationship: RelationshipField): Field => ({
  name: 'content',
  blocks: [{ slug: 'relatedBlock', fields: [relationship] } as Block],
  type: 'blocks',
})

const config = (admin: Record<string, unknown>): SanitizedConfig =>
  ({ collections: [{ slug: 'items', admin }] }) as SanitizedConfig

describe('applyBaseFilterToFields', () => {
  it('does not use admin.hidden to invalidate a relationship nested in a block', async () => {
    const hidden = vi.fn(() => true)
    const result = nestedRelationship(
      applyBaseFilterToFields(
        [block({ name: 'related', relationTo: 'items', type: 'relationship' })],
        config({ hidden }),
      ),
    )

    await expect(runFilter(result)).resolves.toBe(true)
    expect(hidden).not.toHaveBeenCalled()
  })

  it('preserves an original false filter without running the base filter', async () => {
    const baseFilter = vi.fn(async () => ({ tenant: { equals: 'tenant-1' } }))
    const result = nestedRelationship(
      applyBaseFilterToFields(
        [
          block({
            filterOptions: () => false,
            name: 'related',
            relationTo: 'items',
            type: 'relationship',
          }),
        ],
        config({ baseFilter }),
      ),
    )

    await expect(runFilter(result)).resolves.toBe(false)
    expect(baseFilter).not.toHaveBeenCalled()
  })

  it('combines the original Where with the collection base filter', async () => {
    const original = { status: { equals: 'published' } }
    const base = { tenant: { equals: 'tenant-1' } }
    const result = nestedRelationship(
      applyBaseFilterToFields(
        [
          block({
            filterOptions: () => original,
            name: 'related',
            relationTo: 'items',
            type: 'relationship',
          }),
        ],
        config({ baseFilter: async () => base }),
      ),
    )

    await expect(runFilter(result)).resolves.toEqual({ and: [original, base] })
  })
})
