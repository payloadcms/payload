import { describe, expect, it } from 'vitest'

import { cropToPercent, cropToPixels } from './cropUnits.js'

const original = { height: 3000, width: 4000 }

describe('cropToPixels', () => {
  it.each([
    {
      // 50% of 3px rounds to 2px, and 2 + 2 would pass the far edge.
      name: 'keep a crop inside the original after rounding',
      crop: { height: 50, unit: '%' as const, width: 50, x: 50, y: 50 },
      original: { height: 3, width: 3 },
      expected: { height: 1, width: 1, x: 2, y: 2 },
    },
    {
      name: 'return a pixel crop without changes',
      crop: { height: 10, unit: 'px' as const, width: 20, x: 1, y: 2 },
      original,
      expected: { height: 10, width: 20, x: 1, y: 2 },
    },
  ])('should $name', ({ crop, expected, original }) => {
    expect(cropToPixels({ crop, original })).toEqual(expected)
  })
})

describe('cropToPercent', () => {
  it('should give the same pixels after converting to percent and back', () => {
    const pixels = { height: 777, width: 1333, x: 123, y: 457 }

    const roundTrip = cropToPixels({ crop: cropToPercent({ crop: pixels, original }), original })

    expect(roundTrip).toEqual(pixels)
  })
})
