import { describe, expect, it, vi } from 'vitest'

import type { CollectionSlug, RelationshipField, SanitizedConfig, Where } from 'payload'

import { getBaseFields } from './baseFields.js'

const filterFor = (
  config: SanitizedConfig,
  enabledCollections?: CollectionSlug[],
): RelationshipField['filterOptions'] => {
  const field = getBaseFields(config, enabledCollections).find(({ name }) => name === 'doc')
  if (!field || field.type !== 'relationship') {
    throw new Error('Expected internal link relationship field')
  }
  return field.filterOptions
}

const runFilter = async (filterOptions: RelationshipField['filterOptions']): Promise<unknown> => {
  if (typeof filterOptions !== 'function') {
    throw new Error('Expected relationship filterOptions')
  }
  return (filterOptions as Exclude<typeof filterOptions, Where | boolean>)({
    relationTo: 'items',
    req: {} as never,
    user: { id: 'user' },
  } as never)
}

describe('getBaseFields', () => {
  it('does not use function-based admin.hidden to invalidate internal links', async () => {
    const hidden = vi.fn(() => true)
    const config = {
      collections: [{ slug: 'items', admin: { enableRichTextLink: true, hidden } }],
    } as SanitizedConfig

    await expect(runFilter(filterFor(config))).resolves.toBe(true)
    expect(hidden).not.toHaveBeenCalled()
  })

  it('keeps static hidden collections out of the default relation list', () => {
    const config = {
      collections: [{ slug: 'items', admin: { enableRichTextLink: true, hidden: true } }],
    } as SanitizedConfig

    expect(getBaseFields(config).some(({ name }) => name === 'doc')).toBe(false)
  })

  it('applies the collection base filter with an explicit enabled collection list', async () => {
    const where = { tenant: { equals: 'tenant-1' } }
    const baseFilter = vi.fn(async () => where)
    const hidden = vi.fn(() => true)
    const config = {
      collections: [{ slug: 'items', admin: { baseFilter, enableRichTextLink: false, hidden } }],
    } as SanitizedConfig

    await expect(runFilter(filterFor(config, ['items']))).resolves.toEqual(where)
    expect(baseFilter).toHaveBeenCalledOnce()
    expect(hidden).not.toHaveBeenCalled()
  })
})
