import { describe, expect, it } from 'vitest'

import { cloneDataFromOriginalDoc } from './cloneDataFromOriginalDoc.js'

/**
 * Regression tests for cloneDataFromOriginalDoc.
 *
 * Previously the function used `{...row}` to shallow-clone each array element.
 * When a json field held array-of-arrays (e.g. coordinate tuples), spread
 * converted each inner array into an index-keyed object `{"0": x, "1": y}`.
 *
 * Fix: replace the manual shallow clone with structuredClone so all nested
 * shapes — arrays inside arrays, nested objects, primitives — are preserved.
 *
 * Ref: https://github.com/payloadcms/payload/issues/17475
 */

describe('cloneDataFromOriginalDoc', () => {
  describe('primitive values', () => {
    it('clones a flat object', () => {
      const input = { a: 1, b: 'hello' }
      const result = cloneDataFromOriginalDoc(input)
      expect(result).toEqual(input)
      expect(result).not.toBe(input)
    })

    it('clones a flat array of primitives', () => {
      const input = [1, 2, 3]
      const result = cloneDataFromOriginalDoc(input)
      expect(result).toEqual(input)
      expect(result).not.toBe(input)
    })
  })

  describe('nested arrays (regression: previously mangled to index-keyed objects)', () => {
    it('preserves array-of-arrays (coordinate tuples)', () => {
      const input = [
        [1, 2],
        [3, 4],
        [5, 6],
      ]
      const result = cloneDataFromOriginalDoc(input)
      expect(result).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
      ])
      expect(Array.isArray((result as unknown[])[0])).toBe(true)
    })

    it('preserves deeply nested arrays inside objects', () => {
      const input = {
        coords: [
          [10, 20],
          [30, 40],
        ],
      }
      const result = cloneDataFromOriginalDoc(input)
      expect(result).toEqual({
        coords: [
          [10, 20],
          [30, 40],
        ],
      })
      expect(Array.isArray((result as Record<string, unknown>).coords)).toBe(true)
    })

    it('returns a deep clone - mutating the clone does not affect the original', () => {
      const input = [
        [1, 2],
        [3, 4],
      ]
      const result = cloneDataFromOriginalDoc(input) as number[][]
      result[0]![0] = 99
      expect((input as number[][])[0]![0]).toBe(1)
    })
  })

  describe('mixed json shapes', () => {
    it('clones an array of mixed objects and arrays', () => {
      const input = [{ a: 1 }, [2, 3], 'string', 42]
      const result = cloneDataFromOriginalDoc(input)
      expect(result).toEqual([{ a: 1 }, [2, 3], 'string', 42])
      expect(Array.isArray((result as unknown[])[1])).toBe(true)
    })
  })
})
