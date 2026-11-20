import { describe, expect, it } from 'vitest'

import { getNextTransformState, toSavedTransformState } from './transformStateInput.js'

const center = { x: 50, y: 50 }
const crop = { height: 500, width: 1000, x: 200, y: 100 }

describe('getNextTransformState', () => {
  it.each([
    {
      name: 'save an empty object as null',
      args: { previous: null, submitted: {} },
      expected: null,
    },
    {
      name: 'replace the whole saved state with a submitted object',
      args: { previous: { crop, focalPoint: center }, submitted: { focalPoint: { x: 60, y: 70 } } },
      expected: { focalPoint: { x: 60, y: 70 } },
    },
  ])('should $name', ({ args, expected }) => {
    expect(toSavedTransformState({ state: getNextTransformState(args) })).toEqual(expected)
  })
})
