import { describe, expect, it } from 'vitest'

import { hasCropOrResizeEdit } from './hasCropOrResizeEdit.js'

describe('hasCropOrResizeEdit', () => {
  it('returns true when a crop is present', () => {
    expect(hasCropOrResizeEdit({ crop: { height: 10, unit: 'px', width: 10, x: 0, y: 0 } })).toBe(
      true,
    )
  })

  it('returns true when heightInPixels is present', () => {
    expect(hasCropOrResizeEdit({ heightInPixels: 100 })).toBe(true)
  })

  it('returns true when widthInPixels is present', () => {
    expect(hasCropOrResizeEdit({ widthInPixels: 100 })).toBe(true)
  })

  it('returns false when only focalPoint is present', () => {
    expect(hasCropOrResizeEdit({ focalPoint: { x: 50, y: 50 } })).toBe(false)
  })

  it('returns false for an empty uploadEdits object', () => {
    expect(hasCropOrResizeEdit({})).toBe(false)
  })

  it('returns false when uploadEdits is undefined', () => {
    expect(hasCropOrResizeEdit(undefined)).toBe(false)
  })
})
