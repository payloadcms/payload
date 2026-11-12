import { describe, expect, it } from 'vitest'

import { transformPointDataToPayload } from './transformPointDataToPayload.js'

describe('transformPointDataToPayload', () => {
  it('should convert point objects to tuples', () => {
    expect(transformPointDataToPayload({ location: { latitude: 49, longitude: 8.4 } })).toEqual({
      location: [8.4, 49],
    })
  })

  it('should convert point objects inside arrays', () => {
    expect(transformPointDataToPayload({ stops: [{ at: { latitude: 2, longitude: 1 } }] })).toEqual(
      { stops: [{ at: [1, 2] }] },
    )
  })

  it('should preserve nested arrays', () => {
    const data = {
      json: {
        matrix: [[[1, 2]], [[3, 4]]],
        polygon: [
          [0, 0],
          [2, 0],
          [1, 1],
        ],
      },
      layout: [
        {
          blockType: 'shape',
          points: [
            [0, 0],
            [1, 0],
          ],
        },
      ],
    }

    expect(transformPointDataToPayload(data)).toEqual(data)
  })

  it('should keep null and primitive array items unchanged', () => {
    const data = { items: [null, 1, 'text', true, [null, [2]]], value: null }

    expect(transformPointDataToPayload(data)).toEqual(data)
  })
})
