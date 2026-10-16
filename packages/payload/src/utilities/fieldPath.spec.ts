import { describe, expect, it } from 'vitest'

import { expandOwnDottedKey, hasUnsupportedFieldPathSegment, setOwnProperty } from './fieldPath.js'

describe('hasUnsupportedFieldPathSegment', () => {
  it('should identify constrained field path segments', () => {
    expect(hasUnsupportedFieldPathSegment({ segments: ['__proto__', 'value'] })).toBe(true)
    expect(hasUnsupportedFieldPathSegment({ segments: ['value', '__proto__', 'child'] })).toBe(true)
    expect(hasUnsupportedFieldPathSegment({ segments: ['value', '__proto__'] })).toBe(true)
    expect(hasUnsupportedFieldPathSegment({ segments: ['constructor', 'value'] })).toBe(false)
    expect(hasUnsupportedFieldPathSegment({ segments: ['value', 'constructor', 'child'] })).toBe(
      false,
    )
    expect(hasUnsupportedFieldPathSegment({ segments: ['value', 'constructor'] })).toBe(false)
    expect(hasUnsupportedFieldPathSegment({ segments: ['prototype', 'value'] })).toBe(false)
    expect(hasUnsupportedFieldPathSegment({ segments: ['value', 'prototype', 'child'] })).toBe(
      false,
    )
    expect(hasUnsupportedFieldPathSegment({ segments: ['value', 'prototype'] })).toBe(false)
    expect(hasUnsupportedFieldPathSegment({ segments: ['profile', 'preferences', 'color'] })).toBe(
      false,
    )
  })
})

describe('expandOwnDottedKey', () => {
  it('should expand owned dotted keys', () => {
    const target = { 'profile.name': 'Ada' }

    expect(expandOwnDottedKey({ key: 'profile.name', target })).toBe(true)
    expect(target).toEqual({ profile: { name: 'Ada' } })
  })
})

describe('setOwnProperty', () => {
  it('should use descriptor writes only for inherited properties', () => {
    const assignments: PropertyKey[] = []
    const definitions: PropertyKey[] = []
    const ordinaryTarget = new Proxy<Record<string, unknown>>(
      {},
      {
        defineProperty: (target, key, descriptor) => {
          definitions.push(key)
          return Reflect.defineProperty(target, key, descriptor)
        },
        set: (target, key, value) => {
          assignments.push(key)
          return Reflect.set(target, key, value, target)
        },
      },
    )

    setOwnProperty({ key: 'title', target: ordinaryTarget, value: 'value' })

    expect(assignments).toEqual(['title'])
    expect(definitions).toEqual([])
    expect(ordinaryTarget).toEqual({ title: 'value' })

    let inheritedSetterCalls = 0
    const inheritedPrototype = Object.create(null) as Record<string, unknown>
    Object.defineProperty(inheritedPrototype, 'managedValue', {
      configurable: true,
      set: () => {
        inheritedSetterCalls += 1
      },
    })
    const inheritedTarget = Object.create(inheritedPrototype) as Record<string, unknown>

    setOwnProperty({ key: 'managedValue', target: inheritedTarget, value: 'protected' })
    setOwnProperty({ key: '__proto__', target: inheritedTarget, value: { protected: true } })
    setOwnProperty({ key: 'constructor', target: inheritedTarget, value: 'constructor-value' })

    expect(inheritedSetterCalls).toBe(0)
    expect(Object.getOwnPropertyDescriptor(inheritedTarget, 'managedValue')).toMatchObject({
      configurable: true,
      enumerable: true,
      value: 'protected',
      writable: true,
    })
    expect(Object.hasOwn(inheritedTarget, '__proto__')).toBe(true)
    expect(Reflect.get(inheritedTarget, '__proto__')).toEqual({ protected: true })
    expect(Object.hasOwn(inheritedTarget, 'constructor')).toBe(true)
    expect(Reflect.get(inheritedTarget, 'constructor')).toBe('constructor-value')
  })
})
