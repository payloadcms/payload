import type { Field } from 'payload'

import { describe, expect, it } from 'vitest'

import { getCollectionFieldPaths } from './getCollectionFieldPaths.js'

const fields: Field[] = [
  { name: 'title', type: 'text' },
  {
    name: 'status',
    type: 'select',
    options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Published', value: 'published' },
    ],
  },
  { name: 'isActive', type: 'checkbox' },
  { name: 'category', type: 'relationship', relationTo: 'categories' },
  {
    name: 'meta',
    type: 'group',
    fields: [{ name: 'subtitle', type: 'text' }],
  },
  {
    name: 'items',
    type: 'array',
    fields: [{ name: 'label', type: 'text' }],
  },
  {
    type: 'tabs',
    tabs: [
      { name: 'seo', fields: [{ name: 'keyword', type: 'text' }] },
      { fields: [{ name: 'flat', type: 'text' }], label: 'Layout' },
    ],
  },
  {
    type: 'row',
    fields: [{ name: 'rowField', type: 'text' }],
  },
]

describe('getCollectionFieldPaths', () => {
  const { filterableFieldPaths, relationshipFieldPaths, sortableFieldPaths } =
    getCollectionFieldPaths(fields)

  it('should always include base document fields', () => {
    for (const path of ['createdAt', 'id', 'updatedAt']) {
      expect(sortableFieldPaths.has(path)).toBe(true)
      expect(filterableFieldPaths.has(path)).toBe(true)
    }
  })

  it('should mark top-level sortable field types as sortable', () => {
    expect(sortableFieldPaths.has('title')).toBe(true)
    expect(sortableFieldPaths.has('status')).toBe(true)
  })

  it('should not mark non-sortable field types as sortable but keep them filterable', () => {
    expect(sortableFieldPaths.has('isActive')).toBe(false)
    expect(filterableFieldPaths.has('isActive')).toBe(true)
  })

  it('should treat relationships as filterable, flagged, and not sortable', () => {
    expect(filterableFieldPaths.has('category')).toBe(true)
    expect(relationshipFieldPaths.has('category')).toBe(true)
    expect(sortableFieldPaths.has('category')).toBe(false)
  })

  it('should flatten group sub-fields into sortable and filterable paths', () => {
    expect(sortableFieldPaths.has('meta.subtitle')).toBe(true)
    expect(filterableFieldPaths.has('meta.subtitle')).toBe(true)
  })

  it('should keep array sub-fields filterable but never sortable', () => {
    expect(filterableFieldPaths.has('items.label')).toBe(true)
    expect(sortableFieldPaths.has('items.label')).toBe(false)
  })

  it('should prefix named tab sub-fields and inline unnamed tab sub-fields', () => {
    expect(sortableFieldPaths.has('seo.keyword')).toBe(true)
    expect(sortableFieldPaths.has('flat')).toBe(true)
  })

  it('should inline presentational row sub-fields', () => {
    expect(sortableFieldPaths.has('rowField')).toBe(true)
  })
})
