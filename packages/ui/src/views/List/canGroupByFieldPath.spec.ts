import type { FlattenedField } from 'payload'

import { describe, expect, it } from 'vitest'

import { canGroupByFieldPath } from './canGroupByFieldPath.js'

const fields = [
  { name: 'title', type: 'text' },
  {
    name: 'meta',
    type: 'group',
    flattenedFields: [{ name: 'robots', type: 'select' }],
  },
  {
    name: 'breadcrumbs',
    type: 'array',
    flattenedFields: [{ name: 'url', type: 'text' }],
  },
  {
    name: 'layout',
    type: 'blocks',
  },
  { name: 'category', type: 'relationship', relationTo: 'categories' },
  { name: 'related', type: 'relationship', relationTo: ['categories', 'posts'] },
  { name: 'categoryTitle', type: 'text', virtual: 'category.title' },
  { name: 'linkLabels', type: 'text', virtual: 'category.links.label' },
  { name: 'loopA', type: 'text', virtual: 'loopB' },
  { name: 'loopB', type: 'text', virtual: 'loopA' },
] as unknown as FlattenedField[]

const categoryFields = [
  { name: 'title', type: 'text' },
  {
    name: 'links',
    type: 'array',
    flattenedFields: [{ name: 'label', type: 'text' }],
  },
] as unknown as FlattenedField[]

const getRelatedFields = (collectionSlug: string) =>
  collectionSlug === 'categories' ? categoryFields : undefined

describe('canGroupByFieldPath', () => {
  it('allows top-level fields and fields inside groups', () => {
    expect(canGroupByFieldPath({ fields, path: 'title' })).toBe(true)
    expect(canGroupByFieldPath({ fields, path: '-title' })).toBe(true)
    expect(canGroupByFieldPath({ fields, path: 'meta.robots' })).toBe(true)
  })

  it('allows paths through relationships (virtual fields)', () => {
    expect(canGroupByFieldPath({ fields, path: 'category.title' })).toBe(true)
  })

  it('rejects fields inside arrays of a related collection', () => {
    expect(canGroupByFieldPath({ fields, getRelatedFields, path: 'category.title' })).toBe(true)
    expect(canGroupByFieldPath({ fields, getRelatedFields, path: 'category.links.label' })).toBe(
      false,
    )
  })

  it('allows a polymorphic relationship itself but rejects paths past it', () => {
    expect(canGroupByFieldPath({ fields, getRelatedFields, path: 'related' })).toBe(true)
    expect(canGroupByFieldPath({ fields, getRelatedFields, path: 'related.links.label' })).toBe(
      false,
    )
  })

  it('follows virtual fields linked to a path and checks their target', () => {
    expect(canGroupByFieldPath({ fields, getRelatedFields, path: 'categoryTitle' })).toBe(true)
    expect(canGroupByFieldPath({ fields, getRelatedFields, path: 'linkLabels' })).toBe(false)
  })

  it('rejects virtual fields that link to each other in a cycle', () => {
    expect(canGroupByFieldPath({ fields, getRelatedFields, path: 'loopA' })).toBe(false)
  })

  it('rejects fields inside arrays and blocks', () => {
    expect(canGroupByFieldPath({ fields, path: 'breadcrumbs.url' })).toBe(false)
    expect(canGroupByFieldPath({ fields, path: '-breadcrumbs.url' })).toBe(false)
    expect(canGroupByFieldPath({ fields, path: 'breadcrumbs' })).toBe(false)
    expect(canGroupByFieldPath({ fields, path: 'layout.hero.title' })).toBe(false)
  })
})
