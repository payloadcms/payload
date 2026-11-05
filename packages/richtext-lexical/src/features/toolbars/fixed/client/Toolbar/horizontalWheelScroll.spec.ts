import { describe, expect, it } from 'vitest'

import { getHorizontalScrollDelta } from './horizontalWheelScroll.js'

describe('getHorizontalScrollDelta', () => {
  describe('deltaMode 0 (pixel)', () => {
    it('should pass deltaY through unchanged for LTR', () => {
      const delta = getHorizontalScrollDelta({
        clientWidth: 300,
        deltaMode: 0,
        deltaY: 15,
        isRightToLeft: false,
      })

      expect(delta).toBe(15)
    })

    it('should negate deltaY for RTL', () => {
      const delta = getHorizontalScrollDelta({
        clientWidth: 300,
        deltaMode: 0,
        deltaY: 15,
        isRightToLeft: true,
      })

      expect(delta).toBe(-15)
    })
  })

  describe('deltaMode 1 (line)', () => {
    it('should scale deltaY by the pixels-per-line factor for LTR', () => {
      const delta = getHorizontalScrollDelta({
        clientWidth: 300,
        deltaMode: 1,
        deltaY: 3,
        isRightToLeft: false,
      })

      expect(delta).toBe(120)
    })

    it('should scale and negate deltaY for RTL', () => {
      const delta = getHorizontalScrollDelta({
        clientWidth: 300,
        deltaMode: 1,
        deltaY: 3,
        isRightToLeft: true,
      })

      expect(delta).toBe(-120)
    })
  })

  describe('deltaMode 2 (page)', () => {
    it('should scale deltaY by the scroll container width for LTR', () => {
      const delta = getHorizontalScrollDelta({
        clientWidth: 300,
        deltaMode: 2,
        deltaY: 2,
        isRightToLeft: false,
      })

      expect(delta).toBe(600)
    })

    it('should scale and negate deltaY for RTL', () => {
      const delta = getHorizontalScrollDelta({
        clientWidth: 300,
        deltaMode: 2,
        deltaY: 2,
        isRightToLeft: true,
      })

      expect(delta).toBe(-600)
    })
  })
})
