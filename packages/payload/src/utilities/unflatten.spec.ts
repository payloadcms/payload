import { describe, expect, it } from 'vitest'

import { unflatten } from './unflatten.js'

describe('unflatten', () => {
  it('should preserve an explicit empty array instead of populating it from descendant paths', () => {
    const target = { items: [], 'items.0.name': 'Milk' }

    expect(unflatten(target, { preserveEmptyArrays: true })).toEqual({ items: [] })
    expect(target.items).toEqual([])
  })

  it('should preserve an explicit nested empty array without discarding sibling rows', () => {
    expect(
      unflatten(
        {
          'sections.0.items.0.name': 'Stale',
          'sections.0.items': [],
          'sections.0.title': 'First',
          'sections.1.items.0.name': 'Keep',
        },
        { preserveEmptyArrays: true },
      ),
    ).toEqual({
      sections: [{ items: [], title: 'First' }, { items: [{ name: 'Keep' }] }],
    })
  })

  it('should populate arrays created from descendant paths when preserving explicit empty arrays', () => {
    expect(
      unflatten({ 'items.0.name': 'Milk', 'items.1.name': 'Bread' }, { preserveEmptyArrays: true }),
    ).toEqual({ items: [{ name: 'Milk' }, { name: 'Bread' }] })
  })

  it.each([undefined, false])(
    'should merge descendant paths into explicit empty arrays when preserveEmptyArrays is %s',
    (preserveEmptyArrays) => {
      expect(unflatten({ items: [], 'items.0.name': 'Milk' }, { preserveEmptyArrays })).toEqual({
        items: [{ name: 'Milk' }],
      })
    },
  )

  it('should allow overwriting explicit empty arrays when requested', () => {
    expect(
      unflatten(
        { items: [], 'items.0.name': 'Milk' },
        { overwrite: true, preserveEmptyArrays: true },
      ),
    ).toEqual({ items: [{ name: 'Milk' }] })
  })

  it('should continue merging descendant paths into nonempty arrays', () => {
    expect(
      unflatten(
        { items: [{ name: 'Milk' }], 'items.1.name': 'Bread' },
        { preserveEmptyArrays: true },
      ),
    ).toEqual({ items: [{ name: 'Milk' }, { name: 'Bread' }] })
  })

  it('should preserve explicit empty arrays with a custom delimiter', () => {
    expect(
      unflatten(
        { 'group/items': [], 'group/items/0/name': 'Milk' },
        { delimiter: '/', preserveEmptyArrays: true },
      ),
    ).toEqual({ group: { items: [] } })
  })

  it('should preserve explicit empty arrays when recursively unflattening object values', () => {
    expect(
      unflatten(
        { group: { items: [], 'items.0.name': 'Milk' } },
        { preserveEmptyArrays: true, recursive: true },
      ),
    ).toEqual({ group: { items: [] } })
  })

  it('should handle constrained object paths', () => {
    const marker = 'constrainedUnflattenMarker'
    const originalDescriptor = Object.getOwnPropertyDescriptor(Object.prototype, marker)
    const target = JSON.parse(
      `{"__proto__.${marker}":"value","constructor.value":"local","prototype.value":"local","profile.displayName":"Ada"}`,
    ) as Record<string, unknown>
    let result: Record<string, unknown> | undefined
    let processStateChanged = false

    try {
      result = unflatten(target)
      processStateChanged = Object.hasOwn(Object.prototype, marker)
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(Object.prototype, marker, originalDescriptor)
      } else {
        delete (Object.prototype as Record<string, unknown>)[marker]
      }
    }

    expect(processStateChanged).toBe(false)
    expect(Object.getOwnPropertyDescriptor(Object.prototype, marker)).toEqual(originalDescriptor)
    expect(result).toEqual({
      constructor: { value: 'local' },
      profile: {
        displayName: 'Ada',
      },
      prototype: { value: 'local' },
    })
    expect(Object.hasOwn(result as object, 'constructor')).toBe(true)
    expect(Object.hasOwn(result as object, 'prototype')).toBe(true)
  })
})
