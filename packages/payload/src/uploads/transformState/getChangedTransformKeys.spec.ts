import { describe, expect, it } from 'vitest'

import { getChangedTransformKeys } from './getChangedTransformKeys.js'

const clip = { endMs: 10, startMs: 0 }
const crop = { height: 2, width: 2, x: 0, y: 0 }
const focalPoint = { x: 1, y: 1 }

describe('getChangedTransformKeys', () => {
  it.for([
    { name: 'no keys when both values are null', next: null, previous: null, expected: [] },
    {
      name: 'no keys when the values are deeply equal',
      next: { crop, watermark: { text: 'a' } },
      previous: { crop: { ...crop }, watermark: { text: 'a' } },
      expected: [],
    },
    {
      name: 'an added key',
      next: { clip, focalPoint },
      previous: { focalPoint },
      expected: ['clip'],
    },
    {
      name: 'a removed key',
      next: { focalPoint },
      previous: { clip, focalPoint },
      expected: ['clip'],
    },
    {
      name: 'a key whose nested value changed',
      next: { watermark: { position: { x: 2 } } },
      previous: { watermark: { position: { x: 1 } } },
      expected: ['watermark'],
    },
    {
      name: 'every key when the value changes from null to an object',
      next: { clip, focalPoint },
      previous: null,
      expected: ['clip', 'focalPoint'],
    },
    {
      name: 'every key when the value changes from an object to null',
      next: null,
      previous: { crop },
      expected: ['crop'],
    },
  ])('should return $name', ({ expected, next, previous }) => {
    expect(getChangedTransformKeys({ next, previous })).toEqual(expected)
  })
})
