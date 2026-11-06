import { describe, expect, it } from 'vitest'

import { cloneDataFromOriginalDoc } from './cloneDataFromOriginalDoc.js'

describe('cloneDataFromOriginalDoc', () => {
  it('should preserve nested arrays and mixed JSON values', () => {
    const original = [[100, 200], [[300, 400]], { coordinates: [[500, 600]] }, null, true]

    const cloned = cloneDataFromOriginalDoc(original)

    expect(cloned).toStrictEqual(original)
  })

  it('should isolate nested array rows from the original document', () => {
    const original = [{ children: [{ code: 'stored' }] }]

    const cloned = cloneDataFromOriginalDoc(original) as typeof original

    Reflect.deleteProperty(cloned[0].children[0], 'code')

    expect(original[0].children[0].code).toBe('stored')
  })

  it('should isolate nested objects from the original document', () => {
    const original = { group: { coordinates: [[100, 200]] } }

    const cloned = cloneDataFromOriginalDoc(original) as typeof original

    cloned.group.coordinates[0][0] = 300

    expect(original.group.coordinates).toStrictEqual([[100, 200]])
  })
})
