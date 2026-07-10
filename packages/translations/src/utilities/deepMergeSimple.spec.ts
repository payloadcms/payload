import { describe, expect, it } from 'vitest'

import { deepMergeSimple } from './deepMergeSimple.js'

describe('deepMergeSimple', () => {
  it('should merge two flat objects', () => {
    const result = deepMergeSimple({ a: 1 }, { b: 2 })
    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('should let obj2 override obj1 keys', () => {
    const result = deepMergeSimple({ a: 1 }, { a: 2 })
    expect(result).toEqual({ a: 2 })
  })

  it('should recursively merge nested objects', () => {
    const result = deepMergeSimple({ a: { b: 1, c: 2 } }, { a: { c: 3, d: 4 } })
    expect(result).toEqual({ a: { b: 1, c: 3, d: 4 } })
  })

  it('should not mutate the input objects', () => {
    const obj1 = { a: 1 }
    const obj2 = { b: 2 }
    deepMergeSimple(obj1, obj2)
    expect(obj1).toEqual({ a: 1 })
    expect(obj2).toEqual({ b: 2 })
  })

  it('should not pollute global Object.prototype via __proto__', () => {
    const malicious = JSON.parse('{"__proto__": {"isAdmin": true}}')
    deepMergeSimple({}, malicious)
    expect(({} as any).isAdmin).toBeUndefined()
  })

  it('should not hijack the returned object prototype via __proto__', () => {
    const malicious = JSON.parse('{"__proto__": {"isAdmin": true}}')
    const result = deepMergeSimple({}, malicious) as any
    expect(result.isAdmin).toBeUndefined()
  })

  it('should not hijack prototype via nested __proto__ key', () => {
    const malicious = JSON.parse('{"a": {"__proto__": {"isAdmin": true}}}')
    const base = { a: {} }
    const result = deepMergeSimple(base, malicious) as any
    expect(result.a.isAdmin).toBeUndefined()
    expect(({} as any).isAdmin).toBeUndefined()
  })
})
