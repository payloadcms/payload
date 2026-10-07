import { describe, expect, it } from 'vitest'

import { toPercentCrop, toPixelCrop } from './cropState.js'

describe('canonical crop conversion', () => {
  it('should map original pixels to editor percentages', () => {
    expect(
      toPercentCrop({ crop: { x: 10, y: 5, width: 20, height: 10 }, height: 20, width: 40 }),
    ).toEqual({ x: 25, y: 25, width: 50, height: 50, unit: '%' })
  })

  it('should round and clamp edits to original bounds', () => {
    expect(
      toPixelCrop({
        crop: { x: 99.9, y: 99.9, width: 10, height: 10, unit: '%' },
        height: 40,
        width: 80,
      }),
    ).toEqual({ x: 79, y: 39, width: 1, height: 1 })
  })

  it('should round trip a one-pixel rectangle in a large image', () => {
    const crop = { x: 1777, y: 1234, width: 1, height: 1 }

    expect(
      toPixelCrop({
        crop: toPercentCrop({ crop, height: 3000, width: 4000 }),
        height: 3000,
        width: 4000,
      }),
    ).toEqual(crop)
  })
})
