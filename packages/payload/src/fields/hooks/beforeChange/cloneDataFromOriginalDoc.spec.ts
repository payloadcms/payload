import { describe, expect, it } from 'vitest'

import { cloneDataFromOriginalDoc } from './cloneDataFromOriginalDoc.js'

describe('cloneDataFromOriginalDoc', () => {
  it('should preserve nested arrays rather than spreading them into index-keyed objects', () => {
    expect(
      cloneDataFromOriginalDoc([
        [1, 2],
        [3, 4],
      ]),
    ).toStrictEqual([
      [1, 2],
      [3, 4],
    ])
  })

  it('should clone a nested array instead of reusing the original reference', () => {
    const inner = [1, 2]
    const cloned = cloneDataFromOriginalDoc([inner]) as number[][]

    expect(cloned[0]).toStrictEqual([1, 2])
    expect(cloned[0]).not.toBe(inner)
  })

  it('should shallow clone object rows', () => {
    const row = { lat: 2, lng: 1 }
    const cloned = cloneDataFromOriginalDoc([row]) as Array<Record<string, number>>

    expect(cloned[0]).toStrictEqual(row)
    expect(cloned[0]).not.toBe(row)
  })

  it('should leave primitive rows untouched', () => {
    expect(cloneDataFromOriginalDoc([1, 'a', null, true])).toStrictEqual([1, 'a', null, true])
  })

  it('should shallow clone a plain object and keep its array values intact', () => {
    const original = { coordinates: [[1, 2]], name: 'a' }
    const cloned = cloneDataFromOriginalDoc(original)

    expect(cloned).toStrictEqual(original)
    expect(cloned).not.toBe(original)
  })
})
