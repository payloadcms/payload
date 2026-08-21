import { describe, expect, it } from 'vitest'

import { getCropState } from './getCropState.js'

describe('getCropState', () => {
  it('should default to the full image when no crop is provided', () => {
    expect(getCropState()).toEqual({
      height: 100,
      unit: '%',
      width: 100,
      x: 0,
      y: 0,
    })
  })

  it('should use a persisted crop when it becomes available', () => {
    expect(getCropState({ height: 40, unit: '%', width: 50, x: 10, y: 15 })).toEqual({
      height: 40,
      unit: '%',
      width: 50,
      x: 10,
      y: 15,
    })
  })
})
