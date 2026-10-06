import type { FilterOptionsResult } from 'payload'

import { describe, expect, it } from 'vitest'

import { getHierarchyFilterOptions } from './getHierarchyFilterOptions.js'

const hierarchyConfig = {
  collectionSpecific: { fieldName: 'allowedTypes' },
  relatedCollections: {
    pages: { fieldName: '_h_tags', hasMany: true },
    posts: { fieldName: '_h_tags', hasMany: true },
  },
}

describe('hierarchy dropdown restrictions', () => {
  it('should constrain collection-specific options while including unrestricted items', () => {
    const result = getHierarchyFilterOptions({
      documentCollectionSlug: 'posts',
      hierarchyConfig,
      hierarchySlug: 'tags',
    })

    expect(result?.tags).toEqual({
      and: [
        {
          or: [
            { allowedTypes: { in: ['posts'] } },
            { allowedTypes: { exists: false } },
            { allowedTypes: { not_in: ['pages', 'posts'] } },
          ],
        },
      ],
    })
  })

  it('should preserve custom filters and hierarchy base filters alongside collection restrictions', () => {
    const filterOptions: FilterOptionsResult = {
      other: false,
      tags: { and: [{ isActive: { equals: true } }] },
    }
    const baseFilter = { tenant: { equals: 'current-tenant' } }
    const result = getHierarchyFilterOptions({
      baseFilter,
      documentCollectionSlug: 'posts',
      filterOptions,
      hierarchyConfig,
      hierarchySlug: 'tags',
    })

    expect(result?.other).toBe(false)
    expect(result?.tags).toMatchObject({
      and: [{ isActive: { equals: true } }, baseFilter, { or: expect.any(Array) }],
    })
    expect(filterOptions.tags).toEqual({ and: [{ isActive: { equals: true } }] })
  })

  it('should preserve an explicitly disabled collection', () => {
    const filterOptions = { tags: false }
    const result = getHierarchyFilterOptions({
      documentCollectionSlug: 'posts',
      filterOptions,
      hierarchyConfig,
      hierarchySlug: 'tags',
    })

    expect(result).toBe(filterOptions)
  })

  it('should retain filters unchanged when there are no hierarchy restrictions', () => {
    const filterOptions = { tags: { isActive: { equals: true } } }
    const result = getHierarchyFilterOptions({ filterOptions, hierarchySlug: 'tags' })

    expect(result).toBe(filterOptions)
  })

  it('should apply the base filter even without a document collection', () => {
    const baseFilter = { tenant: { equals: 'current-tenant' } }
    const result = getHierarchyFilterOptions({ baseFilter, hierarchyConfig, hierarchySlug: 'tags' })

    expect(result?.tags).toEqual({ and: [baseFilter] })
  })
})
