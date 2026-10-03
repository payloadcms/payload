import { describe, expect, it } from 'vitest'

import { cloneDataFromOriginalDoc } from './cloneDataFromOriginalDoc.js'

describe('cloneDataFromOriginalDoc', () => {
  it('preserves nested arrays instead of converting them to index-keyed objects', () => {
    const data = [
      [1, 2],
      [3, 4],
    ]
    const cloned = cloneDataFromOriginalDoc(data)
    expect(cloned).toEqual([
      [1, 2],
      [3, 4],
    ])
    expect(Array.isArray(cloned)).toBe(true)
    expect(Array.isArray((cloned as unknown[][])[0])).toBe(true)
    expect(Array.isArray((cloned as unknown[][])[1])).toBe(true)
  })

  it('preserves deeply nested arrays', () => {
    const data = [[[1, 2]], [[3, [4, 5]]]]
    const cloned = cloneDataFromOriginalDoc(data)
    expect(cloned).toEqual([[[1, 2]], [[3, [4, 5]]]])
    expect(Array.isArray(cloned)).toBe(true)
    expect(Array.isArray((cloned as unknown[][])[0])).toBe(true)
    expect(Array.isArray(((cloned as unknown[][])[0] as unknown[][])[0])).toBe(true)
  })

  it('handles empty arrays and nested empty arrays', () => {
    expect(cloneDataFromOriginalDoc([])).toEqual([])
    expect(cloneDataFromOriginalDoc([[], [[]]])).toEqual([[], [[]]])
  })

  it('shallow-clones plain objects within arrays', () => {
    const row1 = { id: '1', title: 'First' }
    const row2 = { id: '2', title: 'Second' }
    const data = [row1, row2]

    const cloned = cloneDataFromOriginalDoc(data) as typeof data
    expect(cloned).toEqual(data)
    expect(cloned).not.toBe(data)
    expect(cloned[0]).not.toBe(row1)
    expect(cloned[0]).toEqual(row1)
    expect(cloned[1]).not.toBe(row2)
    expect(cloned[1]).toEqual(row2)
  })

  it('preserves primitives within arrays', () => {
    const data = [1, 'string', true, false, null, undefined] as any
    const cloned = cloneDataFromOriginalDoc(data)
    expect(cloned).toEqual(data)
  })

  it('shallow-clones top-level plain objects', () => {
    const obj = { foo: 'bar', num: 42 }
    const cloned = cloneDataFromOriginalDoc(obj)
    expect(cloned).toEqual(obj)
    expect(cloned).not.toBe(obj)
  })

  it('returns primitives as-is when passed at top level', () => {
    expect(cloneDataFromOriginalDoc(null as any)).toBe(null)
    expect(cloneDataFromOriginalDoc(undefined as any)).toBe(undefined)
    expect(cloneDataFromOriginalDoc(123 as any)).toBe(123)
    expect(cloneDataFromOriginalDoc('str' as any)).toBe('str')
    expect(cloneDataFromOriginalDoc(true as any)).toBe(true)
  })
})
