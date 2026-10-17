import { describe, expect, it } from 'vitest'

import { cloneDataFromOriginalDoc } from './cloneDataFromOriginalDoc.js'

/**
 * Regression suite for cloneDataFromOriginalDoc.
 *
 * Previously the function shallow-spread each array element: `{ ...row }`.
 * This meant nested objects/arrays inside a row were still the same reference.
 * When beforeValidate/promise.ts ran `delete siblingData[field.name]` on a
 * nested field, it silently deleted the same key from the original document
 * (siblingDoc), causing getFallbackValue to fall through to defaultValue and
 * reset protected fields (#18415, #17475).
 *
 * Replaced with `structuredClone`, which produces a fully independent deep copy.
 */
describe('cloneDataFromOriginalDoc', () => {
  it('returns an array for an array input', () => {
    const result = cloneDataFromOriginalDoc([{ id: '1', code: 'A' }])
    expect(Array.isArray(result)).toBe(true)
  })

  it('returns an object for an object input', () => {
    const result = cloneDataFromOriginalDoc({ code: 'A' })
    expect(typeof result).toBe('object')
    expect(Array.isArray(result)).toBe(false)
  })

  it('shallow mutation of a cloned array row does not affect the original', () => {
    const original = [{ code: 'A', text: 'hello' }]
    const cloned = cloneDataFromOriginalDoc(original) as typeof original
    cloned[0]!.code = 'MUTATED'
    expect(original[0]!.code).toBe('A')
  })

  it('deep mutation of a nested object inside a row does not affect the original (#18415)', () => {
    const original = [{ inner: [{ code: 'original-1' }, { code: 'original-2' }] }]
    const cloned = cloneDataFromOriginalDoc(original) as typeof original
    // Simulate what beforeValidate/promise.ts does on access-denied:
    // delete the field from the cloned (siblingData) row
    delete (cloned[0] as any).inner[0].code
    // The original document must be unaffected
    expect(original[0]!.inner[0]!.code).toBe('original-1')
    expect(original[0]!.inner[1]!.code).toBe('original-2')
  })

  it('nested array-of-arrays are deep-copied, not shared (#17475)', () => {
    const original = [{ coords: [[1, 2], [3, 4]] }]
    const cloned = cloneDataFromOriginalDoc(original) as typeof original
    ;(cloned[0] as any).coords[0][0] = 99
    expect((original[0]! as any).coords[0][0]).toBe(1)
  })

  it('returns an independent deep copy of a plain object', () => {
    const original = { nested: { deep: { value: 42 } } }
    const cloned = cloneDataFromOriginalDoc(original) as typeof original
    ;(cloned as any).nested.deep.value = 0
    expect(original.nested.deep.value).toBe(42)
  })

  it('handles an empty array', () => {
    const result = cloneDataFromOriginalDoc([])
    expect(result).toEqual([])
  })

  it('handles an empty object', () => {
    const result = cloneDataFromOriginalDoc({})
    expect(result).toEqual({})
  })

  it('clones arrays containing non-object primitives', () => {
    const original = ['a', 'b', 'c'] as unknown as Parameters<typeof cloneDataFromOriginalDoc>[0]
    const cloned = cloneDataFromOriginalDoc(original)
    expect(cloned).toEqual(['a', 'b', 'c'])
  })
})
