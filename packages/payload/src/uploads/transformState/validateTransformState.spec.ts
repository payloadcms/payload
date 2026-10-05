import { describe, expect, it } from 'vitest'

import { getTransformStateErrors } from './validateTransformState.js'

describe('transform state validation', () => {
  it('should accept arbitrary custom keys and nested JSON without registration', () => {
    expect(getTransformStateErrors({ value: { custom: { steps: [1, 'a', null, true] } } })).toEqual(
      [],
    )
  })

  it('should validate standard shapes under built-in keys', () => {
    expect(getTransformStateErrors({ value: { crop: 'custom' } })).toEqual([
      expect.objectContaining({ path: '_transforms.crop' }),
    ])
    expect(
      getTransformStateErrors({ value: { crop: { x: 0, y: 0, width: 2, height: 2 } } }),
    ).toEqual([])
  })

  it('should reject crop overflow against the retained original', () => {
    expect(
      getTransformStateErrors({
        doc: { original: { width: 20, height: 10 } },
        value: { crop: { x: 10, y: 0, width: 11, height: 10 } },
      }),
    ).toEqual([expect.objectContaining({ path: '_transforms.crop.width' })])
  })

  it.each([
    { resize: {} },
    { flip: { horizontal: false, vertical: false } },
    { focalPoint: { x: 101, y: 0 } },
    { clip: { startMs: 2, endMs: 1 } },
    { pageRange: { startPage: 0, endPage: 1 } },
    { encoding: { quality: 101 } },
    { rotate: { angle: Infinity } },
    { crop: { x: 0, y: 0, width: 1, height: 1, unit: '%' } },
  ])('should reject invalid built-in intent %j', (value) => {
    expect(getTransformStateErrors({ value })).not.toEqual([])
  })

  it.each([undefined, null, {}, { rotate: { angle: -450 } }])(
    'should accept absent, cleared, or valid state %j',
    (value) => {
      expect(getTransformStateErrors({ value })).toEqual([])
    },
  )

  it.each([
    [],
    'x',
    { custom: NaN },
    { custom: undefined },
    { custom: new Date() },
    { custom: () => 1 },
  ])('should reject non-JSON containers or values %j', (value) => {
    expect(getTransformStateErrors({ value })).not.toEqual([])
  })

  it('should reject cycles without recursing indefinitely', () => {
    const value: Record<string, unknown> = {}
    value.self = value
    expect(getTransformStateErrors({ value })).toEqual([
      expect.objectContaining({ path: '_transforms.self' }),
    ])
  })
})
