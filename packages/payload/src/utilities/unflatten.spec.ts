import { describe, expect, it } from 'vitest'

import { unflatten } from './unflatten.js'
import { unflattenData } from './unflattenData.js'

describe('unflatten', () => {
  it('should continue merging descendant paths into explicit empty objects', () => {
    expect(unflatten({ person: {}, 'person.me': true })).toEqual({ person: { me: true } })
  })

  it.each([undefined, false])(
    'should preserve an explicit empty array when overwrite is %s',
    (overwrite) => {
      const target = { items: [], 'items.0.name': 'Milk' }

      expect(unflatten(target, { overwrite })).toEqual({ items: [] })
      expect(target.items).toEqual([])
    },
  )

  it('should preserve an explicit nested empty array without discarding sibling rows', () => {
    expect(
      unflatten({
        'sections.0.items.0.name': 'Stale',
        'sections.0.items': [],
        'sections.0.title': 'First',
        'sections.1.items.0.name': 'Keep',
      }),
    ).toEqual({
      sections: [{ items: [], title: 'First' }, { items: [{ name: 'Keep' }] }],
    })
  })

  it('should populate arrays created from descendant paths', () => {
    expect(unflatten({ 'items.0.name': 'Milk', 'items.1.name': 'Bread' })).toEqual({
      items: [{ name: 'Milk' }, { name: 'Bread' }],
    })
  })

  it.each([
    { expected: { items: 0 }, overwrite: false },
    { expected: { items: [{ name: 'Milk' }] }, overwrite: true },
  ])(
    'should resolve scalar parent conflicts with overwrite=$overwrite',
    ({ expected, overwrite }) => {
      expect(unflatten({ items: 0, 'items.0.name': 'Milk' }, { overwrite })).toEqual(expected)
    },
  )

  it('should allow overwriting explicit empty arrays when requested', () => {
    expect(unflatten({ items: [], 'items.0.name': 'Milk' }, { overwrite: true })).toEqual({
      items: [{ name: 'Milk' }],
    })
  })

  it('should continue merging descendant paths into nonempty arrays', () => {
    expect(unflatten({ items: [{ name: 'Milk' }], 'items.1.name': 'Bread' })).toEqual({
      items: [{ name: 'Milk' }, { name: 'Bread' }],
    })
  })

  it('should preserve explicit empty arrays with a custom delimiter', () => {
    expect(
      unflatten({ 'group/items': [], 'group/items/0/name': 'Milk' }, { delimiter: '/' }),
    ).toEqual({ group: { items: [] } })
  })

  it('should preserve explicit empty arrays when recursively unflattening object values', () => {
    expect(
      unflatten({ group: { items: [], 'items.0.name': 'Milk' } }, { recursive: true }),
    ).toEqual({ group: { items: [] } })
  })

  it('should preserve explicit empty arrays when expanding submitted dotted data', () => {
    const data = { items: [], 'items.0.name': 'Stale', title: 'Keep' }
    const result = unflattenData(data)

    expect(result).toBe(data)
    expect(result).toEqual({ items: [], title: 'Keep' })
  })

  it.each(['items.0.name', '__proto__.name'])(
    'should not evaluate a skipped descendant value at %s',
    (path) => {
      const target = Object.defineProperty({ items: 0 }, path, {
        enumerable: true,
        get() {
          throw new Error('Skipped value was read')
        },
      })

      expect(unflatten(target)).toEqual({ items: 0 })
    },
  )

  it('should preserve an explicit empty array returned by a getter', () => {
    const target = {
      get items() {
        return []
      },
      'items.0.name': 'Milk',
    }

    expect(unflatten(target)).toEqual({ items: [] })
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
