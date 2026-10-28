import { describe, expect, it } from 'vitest'

import { getChangedTransformKeys } from './getChangedTransformKeys.js'

describe('getChangedTransformKeys', () => {
  it('should return no keys when both values are null', () => {
    expect(getChangedTransformKeys({ next: null, previous: null })).toEqual([])
  })

  it('should return no keys when the values are deeply equal', () => {
    const changed = getChangedTransformKeys({
      next: { crop: { height: 2, width: 2, x: 0, y: 0 }, watermark: { text: 'a' } },
      previous: { crop: { height: 2, width: 2, x: 0, y: 0 }, watermark: { text: 'a' } },
    })

    expect(changed).toEqual([])
  })

  it('should return an added key', () => {
    const changed = getChangedTransformKeys({
      next: { clip: { endMs: 10, startMs: 0 }, focalPoint: { x: 1, y: 1 } },
      previous: { focalPoint: { x: 1, y: 1 } },
    })

    expect(changed).toEqual(['clip'])
  })

  it('should return a removed key', () => {
    const changed = getChangedTransformKeys({
      next: { focalPoint: { x: 1, y: 1 } },
      previous: { clip: { endMs: 10, startMs: 0 }, focalPoint: { x: 1, y: 1 } },
    })

    expect(changed).toEqual(['clip'])
  })

  it('should return a key whose nested value changed', () => {
    const changed = getChangedTransformKeys({
      next: { watermark: { position: { x: 2 } } },
      previous: { watermark: { position: { x: 1 } } },
    })

    expect(changed).toEqual(['watermark'])
  })

  it('should return every key when the value changes from null to an object', () => {
    const changed = getChangedTransformKeys({
      next: { clip: { endMs: 10, startMs: 0 }, focalPoint: { x: 1, y: 1 } },
      previous: null,
    })

    expect(changed).toEqual(['clip', 'focalPoint'])
  })

  it('should return every key when the value changes from an object to null', () => {
    const changed = getChangedTransformKeys({
      next: null,
      previous: { crop: { height: 2, width: 2, x: 0, y: 0 } },
    })

    expect(changed).toEqual(['crop'])
  })
})
