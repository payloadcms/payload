import { describe, expect, it } from 'vitest'

import { resolveFocalPoint } from './resolveFocalPoint.js'

describe('focal points after saved resizing', () => {
  it('should map a point into the cover crop used by the saved default', () => {
    expect(
      resolveFocalPoint({
        width: 20,
        height: 10,
        state: { focalPoint: { x: 75, y: 50 }, resize: { width: 10, height: 10 } },
      }),
    ).toEqual({ x: 50, y: 50 })
  })

  it('should retain an edge point when the cover crop is clamped to the source', () => {
    expect(
      resolveFocalPoint({
        width: 20,
        height: 10,
        state: { focalPoint: { x: 0, y: 0 }, resize: { width: 10, height: 10 } },
      }),
    ).toEqual({ x: 0, y: 0 })
  })
})
