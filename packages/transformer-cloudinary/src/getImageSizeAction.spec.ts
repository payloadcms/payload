import { describe, expect, it } from 'vitest'

import { getImageSizeAction } from './getImageSizeAction.js'

const dimensions = { height: 500, width: 1000 }

describe('getImageSizeAction', () => {
  it('should omit when the source is smaller in both dimensions', () => {
    expect(getImageSizeAction({ dimensions, size: { height: 800, width: 1200 } })).toBe('omit')
  })

  it('should resize when the source is larger in one dimension', () => {
    expect(getImageSizeAction({ dimensions, size: { height: 800, width: 900 } })).toBe('resize')
  })

  it('should omit a single-dimension size larger than the source', () => {
    expect(getImageSizeAction({ dimensions, size: { width: 1200 } })).toBe('omit')
  })

  it.each([true, false])(
    'should always resize when withoutEnlargement is %s',
    (withoutEnlargement) => {
      expect(
        getImageSizeAction({
          dimensions,
          size: { height: 800, width: 1200, withoutEnlargement },
        }),
      ).toBe('resize')
    },
  )
})
