import { describe, expect, it } from 'vitest'

import { getHierarchyListURL } from './getHierarchyListURL.js'

describe('getHierarchyListURL', () => {
  it('keeps root navigation in the hierarchy view', () => {
    expect(
      getHierarchyListURL({
        adminRoute: '/admin',
        collectionSlug: 'tags',
      }),
    ).toBe('/admin/collections/tags?view=hierarchy')
  })

  it('preserves a custom parent field and numeric ID zero', () => {
    expect(
      getHierarchyListURL({
        adminRoute: '/admin',
        collectionSlug: 'departments',
        parentFieldName: 'parentDept',
        parentID: 0,
      }),
    ).toBe('/admin/collections/departments?parentDept=0&view=hierarchy')
  })
})
