import { describe, expect, it } from 'vitest'

import {
  isMultiValueOperator,
  resolveSelectFilterValue,
  shouldWriteSelectScalar,
} from './normalizeSelectValue.js'

describe('normalizeSelectValue', () => {
  describe('isMultiValueOperator', () => {
    it('treats in / not_in as multi', () => {
      expect(isMultiValueOperator('in')).toBe(true)
      expect(isMultiValueOperator('not_in')).toBe(true)
      expect(isMultiValueOperator('equals')).toBe(false)
      expect(isMultiValueOperator('not_equals')).toBe(false)
    })
  })

  describe('resolveSelectFilterValue', () => {
    it('unwraps array values under single-value operators', () => {
      expect(resolveSelectFilterValue('equals', ['a', 'b'])).toBe('a')
      expect(resolveSelectFilterValue('equals', [])).toBeUndefined()
    })

    it('keeps arrays under multi-value operators', () => {
      expect(resolveSelectFilterValue('in', ['a', 'b'])).toEqual(['a', 'b'])
    })

    it('passes scalars through', () => {
      expect(resolveSelectFilterValue('equals', 'a')).toBe('a')
      expect(resolveSelectFilterValue('in', 'a')).toBe('a')
    })
  })

  describe('shouldWriteSelectScalar', () => {
    it('writes once when a multi value is left under a single-value operator', () => {
      expect(shouldWriteSelectScalar('equals', ['a', 'b'], undefined)).toEqual({
        write: true,
        next: 'a',
      })
    })

    it('does not re-write the same scalar (breaks max-update-depth loops)', () => {
      expect(shouldWriteSelectScalar('equals', ['a', 'b'], 'a')).toEqual({ write: false })
    })

    it('does not write under multi-value operators', () => {
      expect(shouldWriteSelectScalar('in', ['a', 'b'], undefined)).toEqual({ write: false })
    })
  })
})
