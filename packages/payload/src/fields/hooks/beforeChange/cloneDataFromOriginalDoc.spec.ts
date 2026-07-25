import { describe, expect, it } from 'vitest'

import { cloneDataFromOriginalDoc } from './cloneDataFromOriginalDoc.js'

describe('cloneDataFromOriginalDoc', () => {
  it('preserves nested arrays instead of converting them to index-keyed objects', () => {
    const original = [
      [1, 2],
      [3, 4],
    ]

    const cloned = cloneDataFromOriginalDoc(original)

    expect(cloned).toEqual([
      [1, 2],
      [3, 4],
    ])
    expect(Array.isArray((cloned as unknown[])[0])).toBe(true)
  })

  it('does not mutate the original array when cloning nested arrays', () => {
    const original = [[1, 2]]

    const cloned = cloneDataFromOriginalDoc(original) as unknown[][]
    cloned[0]!.push(999)

    expect(original[0]).toEqual([1, 2])
  })

  it('shallow clones object rows as before', () => {
    const original = [{ id: '1', text: 'hello' }]

    const cloned = cloneDataFromOriginalDoc(original)

    expect(cloned).toEqual(original)
    expect(cloned[0]).not.toBe(original[0])
  })

  it('shallow clones a plain object', () => {
    const original = { foo: 'bar' }

    const cloned = cloneDataFromOriginalDoc(original)

    expect(cloned).toEqual(original)
    expect(cloned).not.toBe(original)
  })

  it('returns primitives and null rows untouched', () => {
    expect(cloneDataFromOriginalDoc(null as any)).toBe(null)
    expect(cloneDataFromOriginalDoc(['a', 1, null] as any)).toEqual(['a', 1, null])
  })
})
