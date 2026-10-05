import { describe, expect, it } from 'vitest'

import { migrateLegacyFocalPoint } from './migrateLegacyFocalPoint.js'

describe('legacy focal read compatibility', () => {
  it('should preserve zero and the original document', () => {
    const doc = { focalX: 0, focalY: 100 }

    expect(migrateLegacyFocalPoint({ doc })).toEqual({
      ...doc,
      _transforms: { focalPoint: { x: 0, y: 100 } },
    })
    expect(doc).toEqual({ focalX: 0, focalY: 100 })
  })
  it('should preserve canonical replacements that omit focalPoint', () => {
    const doc = {
      focalX: 10,
      focalY: 20,
      _transforms: { crop: { x: 0, y: 0, width: 2, height: 2 } },
    }

    expect(migrateLegacyFocalPoint({ doc })).toBe(doc)
  })
  it.each([
    { focalX: 0 },
    { focalX: '0', focalY: 100 },
    { focalX: -1, focalY: 100 },
    { focalX: NaN, focalY: 100 },
  ])('should ignore malformed legacy data %j', (doc) => {
    expect(migrateLegacyFocalPoint({ doc })).toBe(doc)
  })
})
