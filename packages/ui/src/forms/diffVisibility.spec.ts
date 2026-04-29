import { describe, expect, it } from 'vitest'

import { diffVisibility } from './diffVisibility.js'

describe('diffVisibility', () => {
  it('returns paths that flipped false → true', () => {
    const prev = new Map([
      ['a', false],
      ['b', true],
    ])
    const next = new Map([
      ['a', true],
      ['b', true],
    ])
    expect(diffVisibility(prev, next).newlyVisible).toEqual(['a'])
    expect(diffVisibility(prev, next).newlyHidden).toEqual([])
  })

  it('returns paths that flipped true → false', () => {
    const prev = new Map([['a', true]])
    const next = new Map([['a', false]])
    expect(diffVisibility(prev, next).newlyHidden).toEqual(['a'])
    expect(diffVisibility(prev, next).newlyVisible).toEqual([])
  })

  it('treats absent prev keys as not-visible-before (so true → newlyVisible)', () => {
    const prev = new Map<string, boolean>()
    const next = new Map([['a', true]])
    expect(diffVisibility(prev, next).newlyVisible).toEqual(['a'])
  })

  it('does not flag paths that stayed visible across both states', () => {
    const prev = new Map([['a', true]])
    const next = new Map([['a', true]])
    const result = diffVisibility(prev, next)
    expect(result.newlyVisible).toEqual([])
    expect(result.newlyHidden).toEqual([])
  })

  it('does not flag paths that stayed hidden across both states', () => {
    const prev = new Map([['a', false]])
    const next = new Map([['a', false]])
    const result = diffVisibility(prev, next)
    expect(result.newlyVisible).toEqual([])
    expect(result.newlyHidden).toEqual([])
  })

  it('handles a path present in prev but absent in next as newlyHidden', () => {
    const prev = new Map([['a', true]])
    const next = new Map<string, boolean>()
    expect(diffVisibility(prev, next).newlyHidden).toEqual(['a'])
  })

  it('emits multiple flipped paths in one diff', () => {
    const prev = new Map([
      ['a', false],
      ['b', true],
      ['c', false],
    ])
    const next = new Map([
      ['a', true],
      ['b', false],
      ['c', false],
    ])
    const result = diffVisibility(prev, next)
    expect(result.newlyVisible).toEqual(['a'])
    expect(result.newlyHidden).toEqual(['b'])
  })
})
