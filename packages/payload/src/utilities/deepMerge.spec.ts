import { describe, expect, it } from 'vitest'

import {
  deepMerge,
  deepMergeWithCombinedArrays,
  deepMergeWithReactComponents,
  deepMergeWithSourceArrays,
  deepMergeWithSourceArraysIgnoringUndefined,
} from './deepMerge.js'

describe('deepMerge', () => {
  it('should deeply merge nested objects with source taking precedence', () => {
    const result = deepMerge<Record<string, unknown>>(
      { a: { b: 1, c: 2 }, d: 1 },
      { a: { c: 3, e: 4 }, f: 5 },
    )

    expect(result).toStrictEqual({ a: { b: 1, c: 3, e: 4 }, d: 1, f: 5 })
  })

  it('should not mutate its arguments and should clone nested values', () => {
    const target = { nested: { value: 1 } }
    const source = { other: { value: 2 } }

    const result = deepMerge<Record<string, any>>(target, source)

    expect(target).toStrictEqual({ nested: { value: 1 } })
    expect(source).toStrictEqual({ other: { value: 2 } })
    expect(result.nested).not.toBe(target.nested)
    expect(result.other).not.toBe(source.other)
  })

  it('should keep references when clone is false', () => {
    const nested = { value: 1 }

    const result = deepMerge<Record<string, any>>({}, { nested }, { clone: false })

    expect(result.nested).toBe(nested)
  })

  it('should concatenate arrays by default', () => {
    const result = deepMerge<Record<string, unknown>>({ list: [1, 2] }, { list: [3] })

    expect(result).toStrictEqual({ list: [1, 2, 3] })
  })

  it('should not deeply merge dates and regular expressions', () => {
    const date = new Date()
    const regex = /test/

    const result = deepMerge<Record<string, unknown>>({ date: {}, regex: {} }, { date, regex })

    expect(result.date).toBe(date)
    expect(result.regex).toBe(regex)
  })

  it('should merge enumerable symbol keys', () => {
    const symbol = Symbol('key')

    const result = deepMerge<Record<symbol, unknown>>(
      { [symbol]: { a: 1 } },
      { [symbol]: { b: 2 } },
    )

    expect(result[symbol]).toStrictEqual({ a: 1, b: 2 })
  })

  it('should use customMerge for matching keys', () => {
    const result = deepMerge<Record<string, unknown>>(
      { a: { x: 1 }, b: { x: 1 } },
      { a: { y: 2 }, b: { y: 2 } },
      { customMerge: (key) => (key === 'a' ? (_x, y) => y : undefined) },
    )

    expect(result).toStrictEqual({ a: { y: 2 }, b: { x: 1, y: 2 } })
  })

  it('should merge all objects with deepMerge.all', () => {
    const result = deepMerge.all<Record<string, unknown>>([
      { a: { x: 1 } },
      { a: { y: 2 } },
      { b: 3 },
    ])

    expect(result).toStrictEqual({ a: { x: 1, y: 2 }, b: 3 })
  })

  it('should not poison the prototype of the result via a __proto__ key in the source', () => {
    const target = JSON.parse('{"__proto__": {}}')
    const source = JSON.parse('{"__proto__": {"isAdmin": true}}')

    const result = deepMerge<Record<string, unknown>>(target, source)

    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(result.isAdmin).toBeUndefined()
  })

  it('should not poison the prototype of the result via a __proto__ key in the target', () => {
    const target = JSON.parse('{"__proto__": {"isAdmin": true}}')

    const result = deepMerge<Record<string, unknown>>(target, {})

    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(result.isAdmin).toBeUndefined()
  })

  it('should not pollute Object.prototype via constructor.prototype', () => {
    const source = JSON.parse('{"constructor": {"prototype": {"polluted": true}}}')

    deepMerge({}, source)

    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})

describe('deepMergeWithSourceArrays', () => {
  it('should replace target arrays with source arrays', () => {
    const result = deepMergeWithSourceArrays<Record<string, unknown>>(
      { list: [1, 2], keep: true },
      { list: [3] },
    )

    expect(result).toStrictEqual({ keep: true, list: [3] })
  })
})

describe('deepMergeWithSourceArraysIgnoringUndefined', () => {
  it('should retain target values when the source value is undefined', () => {
    const result = deepMergeWithSourceArraysIgnoringUndefined<Record<string, unknown>>(
      { a: 1, b: { c: 2 } },
      { a: undefined, b: { c: undefined, d: 3 } },
    )

    expect(result).toStrictEqual({ a: 1, b: { c: 2, d: 3 } })
  })
})

describe('deepMergeWithCombinedArrays', () => {
  it('should merge array items by index and append new primitives', () => {
    const result = deepMergeWithCombinedArrays<Record<string, unknown>>(
      { list: [{ a: 1 }, 'x'] },
      { list: [{ b: 2 }, 'y', 'z'] },
    )

    expect(result).toStrictEqual({ list: [{ a: 1, b: 2 }, 'x', 'y', 'z'] })
  })
})

describe('deepMergeWithReactComponents', () => {
  it('should not clone functions', () => {
    const Component = () => null

    const result = deepMergeWithReactComponents<Record<string, unknown>>(
      { admin: { components: {} } },
      { admin: { components: { Field: Component } } },
    )

    expect((result.admin as any).components.Field).toBe(Component)
  })
})
