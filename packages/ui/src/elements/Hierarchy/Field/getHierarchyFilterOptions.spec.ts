import type { FilterOptionsResult } from 'payload'

import { describe, expect, it } from 'vitest'

import { getHierarchyFilterOptions } from './getHierarchyFilterOptions.js'

const hierarchyConfig = {
  collectionSpecific: { fieldName: 'allowedTypes' },
  relatedCollections: {
    organizations: { fieldName: 'parentFolder', hasMany: false },
    products: { fieldName: 'parentFolder', hasMany: false },
  },
}

describe('hierarchy dropdown restrictions', () => {
  it('should constrain collection-specific options while including unrestricted items', () => {
    const result = getHierarchyFilterOptions({
      documentCollectionSlug: 'organizations',
      hierarchyConfig,
      hierarchySlug: 'folders',
    })

    expect(result?.folders).toEqual({
      and: [
        {
          or: [
            { allowedTypes: { in: ['organizations'] } },
            { allowedTypes: { exists: false } },
            { allowedTypes: { not_in: ['organizations', 'products'] } },
          ],
        },
      ],
    })
  })

  it('should preserve custom filters and hierarchy base filters alongside collection restrictions', () => {
    const filterOptions: FilterOptionsResult = {
      folders: { and: [{ isActive: { equals: true } }] },
      other: false,
    }
    const baseFilter = { tenant: { equals: 'current-tenant' } }
    const result = getHierarchyFilterOptions({
      baseFilter,
      documentCollectionSlug: 'organizations',
      filterOptions,
      hierarchyConfig,
      hierarchySlug: 'folders',
    })

    expect(result?.other).toBe(false)
    expect(result?.folders).toMatchObject({
      and: [{ isActive: { equals: true } }, baseFilter, { or: expect.any(Array) }],
    })
    expect(filterOptions.folders).toEqual({ and: [{ isActive: { equals: true } }] })
  })

  it('should preserve an explicitly disabled collection', () => {
    const filterOptions = { folders: false }
    const result = getHierarchyFilterOptions({
      documentCollectionSlug: 'organizations',
      filterOptions,
      hierarchyConfig,
      hierarchySlug: 'folders',
    })

    expect(result).toBe(filterOptions)
  })

  it('should retain filters unchanged when there are no hierarchy restrictions', () => {
    const filterOptions = { folders: { isActive: { equals: true } } }
    const result = getHierarchyFilterOptions({ filterOptions, hierarchySlug: 'folders' })

    expect(result).toBe(filterOptions)
  })

  it('should apply the base filter even without a document collection', () => {
    const baseFilter = { tenant: { equals: 'current-tenant' } }
    const result = getHierarchyFilterOptions({
      baseFilter,
      hierarchyConfig,
      hierarchySlug: 'folders',
    })

    expect(result?.folders).toEqual({ and: [baseFilter] })
  })
})
