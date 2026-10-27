import { describe, expect, it } from 'vitest'

import { cropToPercent, cropToPixels } from './cropUnits.js'

const original = { height: 3000, width: 4000 }

describe('cropToPixels', () => {
  it('should convert a percent crop to original pixels', () => {
    const crop = cropToPixels({
      crop: { height: 40, unit: '%', width: 50, x: 10, y: 15 },
      original,
    })

    expect(crop).toEqual({ height: 1200, width: 2000, x: 400, y: 450 })
  })

  it('should keep a crop inside the original after rounding', () => {
    const crop = cropToPixels({
      crop: { height: 33.34, unit: '%', width: 33.34, x: 66.67, y: 66.67 },
      original: { height: 3, width: 3 },
    })

    expect(crop.x + crop.width).toBeLessThanOrEqual(3)
    expect(crop.y + crop.height).toBeLessThanOrEqual(3)
    expect(crop.width).toBeGreaterThan(0)
    expect(crop.height).toBeGreaterThan(0)
  })

  it('should return a pixel crop without changes', () => {
    const crop = cropToPixels({
      crop: { height: 10, unit: 'px', width: 20, x: 1, y: 2 },
      original,
    })

    expect(crop).toEqual({ height: 10, width: 20, x: 1, y: 2 })
  })
})

describe('cropToPercent', () => {
  it('should convert original pixels to a percent crop', () => {
    const crop = cropToPercent({
      crop: { height: 1200, width: 2000, x: 400, y: 450 },
      original,
    })

    expect(crop).toEqual({ height: 40, unit: '%', width: 50, x: 10, y: 15 })
  })

  it('should give the same pixels after converting to percent and back', () => {
    const pixels = { height: 777, width: 1333, x: 123, y: 457 }

    const roundTrip = cropToPixels({ crop: cropToPercent({ crop: pixels, original }), original })

    expect(roundTrip).toEqual(pixels)
  })
})
