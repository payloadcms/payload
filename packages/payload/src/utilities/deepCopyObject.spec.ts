import { describe, expect, it } from 'vitest'

import {
  deepCopyObject,
  deepCopyObjectComplex,
  deepCopyObjectSimple,
  deepCopyObjectSimpleWithoutReactComponents,
} from './deepCopyObject.js'

describe('deepCopyObject utilities', () => {
  it('should copy special JSON keys as own data', () => {
    const input = JSON.parse(
      '{"__proto__":{"managedValue":"value"},"constructor":"constructor-value","prototype":"prototype-value"}',
    )
    const cloneFunctions = [
      deepCopyObject,
      deepCopyObjectSimple,
      deepCopyObjectSimpleWithoutReactComponents,
      deepCopyObjectComplex,
    ]

    for (const cloneFunction of cloneFunctions) {
      const clone = cloneFunction(input)

      expect(Object.getPrototypeOf(clone)).toBe(Object.prototype)
      expect(Object.hasOwn(clone, '__proto__')).toBe(true)
      expect(Reflect.get(clone, '__proto__')).toEqual({ managedValue: 'value' })
      expect(Object.getOwnPropertyDescriptor(clone, '__proto__')).toEqual({
        configurable: true,
        enumerable: true,
        value: { managedValue: 'value' },
        writable: true,
      })
      expect(Object.hasOwn(clone, 'constructor')).toBe(true)
      expect(Reflect.get(clone, 'constructor')).toBe('constructor-value')
      expect(Object.hasOwn(clone, 'prototype')).toBe(true)
      expect(Reflect.get(clone, 'prototype')).toBe('prototype-value')
      expect(Reflect.get(clone, 'managedValue')).toBeUndefined()
    }
  })

  it('should copy only own enumerable JSON data', () => {
    const input = Object.assign(Object.create({ inheritedValue: 'inherited' }), {
      ownValue: 'own',
    })

    for (const cloneFunction of [
      deepCopyObjectSimple,
      deepCopyObjectSimpleWithoutReactComponents,
    ]) {
      const clone = cloneFunction(input)

      expect(clone).toEqual({ ownValue: 'own' })
      expect(Object.hasOwn(clone, 'inheritedValue')).toBe(false)
    }
  })

  it('should ignore inherited array elements', () => {
    let inheritedGetterCalls = 0
    const inheritedElements: unknown[] = []
    const input: unknown[] = []

    Object.defineProperty(inheritedElements, 0, {
      configurable: true,
      enumerable: true,
      get() {
        inheritedGetterCalls += 1
        return { value: 'inherited' }
      },
    })
    input.length = 1
    Object.setPrototypeOf(input, inheritedElements)

    for (const cloneFunction of [
      deepCopyObjectSimple,
      deepCopyObjectSimpleWithoutReactComponents,
    ]) {
      const clone = cloneFunction(input as never) as unknown[]

      expect(clone).toHaveLength(1)
      expect(Object.hasOwn(clone, 0)).toBe(false)
    }
    expect(inheritedGetterCalls).toBe(0)
  })

  it('should create owned array elements without invoking inherited setters', () => {
    let inheritedSetterCalls = 0
    const input: unknown[] = []

    Object.defineProperty(input, 0, {
      configurable: true,
      enumerable: true,
      value: { value: 'owned' },
      writable: true,
    })

    const originalArrayIndexDescriptor = Object.getOwnPropertyDescriptor(Array.prototype, 0)
    let clones: unknown[][] = []

    try {
      Object.defineProperty(Array.prototype, 0, {
        configurable: true,
        set() {
          inheritedSetterCalls += 1
        },
      })

      clones = [
        deepCopyObjectSimple(input as never) as unknown[],
        deepCopyObjectSimpleWithoutReactComponents(input as never) as unknown[],
      ]
    } finally {
      if (originalArrayIndexDescriptor) {
        Object.defineProperty(Array.prototype, 0, originalArrayIndexDescriptor)
      } else {
        delete Array.prototype[0]
      }
    }

    expect(inheritedSetterCalls).toBe(0)
    for (const clone of clones) {
      expect(Object.hasOwn(clone, 0)).toBe(true)
      expect(clone[0]).toEqual({ value: 'owned' })
    }
  })

  it('should preserve supported object values', () => {
    const buffer = Buffer.from('value')
    const date = new Date('2026-01-01T00:00:00.000Z')
    const map = new Map([['key', { nested: true }]])
    const regexp = /value/gi
    const set = new Set([{ nested: true }])
    const typedArray = new Uint8Array([1, 2, 3])

    const clone = deepCopyObject({ buffer, date, map, regexp, set, typedArray })

    expect(clone.buffer).not.toBe(buffer)
    expect(clone.buffer).toEqual(buffer)
    expect(clone.date).not.toBe(date)
    expect(clone.date).toEqual(date)
    expect(clone.map).not.toBe(map)
    expect(clone.map).toEqual(map)
    expect(clone.regexp).not.toBe(regexp)
    expect(clone.regexp).toEqual(regexp)
    expect(clone.set).not.toBe(set)
    expect(clone.set).toEqual(set)
    expect(clone.typedArray).not.toBe(typedArray)
    expect(clone.typedArray).toEqual(typedArray)
  })

  it('should preserve simple clone options', () => {
    const input = {
      date: new Date('2026-01-01T00:00:00.000Z'),
      keep: 'value',
      nested: [{ value: true }],
      omit: undefined,
    }

    const clone = deepCopyObjectSimple(input as never, true) as unknown as typeof input

    expect(clone).toEqual({
      date: input.date,
      keep: 'value',
      nested: [{ value: true }],
    })
    expect(clone.date).not.toBe(input.date)
    expect(clone.nested).not.toBe(input.nested)
    expect(clone.nested[0]).not.toBe(input.nested[0])
  })

  it('should preserve BSON value conversion', () => {
    const bsonValue = Object.create({
      _bsontype: 'ObjectId',
      toHexString: () => '507f1f77bcf86cd799439011',
    })

    expect(deepCopyObjectSimple(bsonValue)).toBe('507f1f77bcf86cd799439011')
    expect(deepCopyObjectSimpleWithoutReactComponents(bsonValue)).toBe('507f1f77bcf86cd799439011')
  })

  it('should preserve React component and file handling', () => {
    const reactComponent = {
      $$typeof: Symbol.for('react.element'),
      type: 'div',
    }
    const file = new File(['value'], 'value.txt')

    expect(deepCopyObjectSimpleWithoutReactComponents(reactComponent as never)).toBeUndefined()
    expect(deepCopyObjectSimpleWithoutReactComponents(file as never)).toBe(file)
    expect(
      deepCopyObjectSimpleWithoutReactComponents(file as never, { excludeFiles: true }),
    ).toBeUndefined()
  })

  it('should preserve circular references and custom prototypes', () => {
    const prototype = { inheritedValue: 'value' }
    const input = Object.assign(Object.create(prototype), { ownValue: 'own' }) as {
      inheritedValue: string
      ownValue: string
      self?: unknown
    }
    input.self = input

    const clone = deepCopyObjectComplex(input)

    expect(clone).not.toBe(input)
    expect(Object.getPrototypeOf(clone)).toBe(prototype)
    expect(clone.inheritedValue).toBe('value')
    expect(Object.hasOwn(clone, 'inheritedValue')).toBe(false)
    expect(clone.ownValue).toBe('own')
    expect(clone.self).toBe(clone)
  })
})
