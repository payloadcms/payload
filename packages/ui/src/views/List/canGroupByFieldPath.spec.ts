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
  { name: 'category', type: 'relationship' },
] as unknown as FlattenedField[]

describe('canGroupByFieldPath', () => {
  it('allows top-level fields and fields inside groups', () => {
    expect(canGroupByFieldPath({ fields, path: 'title' })).toBe(true)
    expect(canGroupByFieldPath({ fields, path: '-title' })).toBe(true)
    expect(canGroupByFieldPath({ fields, path: 'meta.robots' })).toBe(true)
  })

  it('allows paths through relationships (virtual fields)', () => {
    expect(canGroupByFieldPath({ fields, path: 'category.title' })).toBe(true)
  })

  it('rejects fields inside arrays and blocks', () => {
    expect(canGroupByFieldPath({ fields, path: 'breadcrumbs.url' })).toBe(false)
    expect(canGroupByFieldPath({ fields, path: '-breadcrumbs.url' })).toBe(false)
    expect(canGroupByFieldPath({ fields, path: 'breadcrumbs' })).toBe(false)
    expect(canGroupByFieldPath({ fields, path: 'layout.hero.title' })).toBe(false)
  })
})
