// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'

import {
  createSessionActivityTracker,
  registerSessionActivityListeners,
  sessionActivityThrottleMs,
} from './sessionActivity.js'

describe('createSessionActivityTracker', () => {
  it('should process the first activity immediately', () => {
    const onActivity = vi.fn()
    const markActivity = createSessionActivityTracker({
      now: () => 100,
      onActivity,
    })

    expect(markActivity('mousemove')).toBe(true)
    expect(onActivity).toHaveBeenCalledWith('mousemove', 100)
  })

  it('should ignore activity within the throttle period', () => {
    let now = 100
    const onActivity = vi.fn()
    const markActivity = createSessionActivityTracker({
      now: () => now,
      onActivity,
    })

    markActivity('mousemove')
    now += sessionActivityThrottleMs - 1

    expect(markActivity('focus')).toBe(false)
    expect(onActivity).toHaveBeenCalledTimes(1)
  })

  it('should process activity at the throttle boundary', () => {
    let now = 100
    const onActivity = vi.fn()
    const markActivity = createSessionActivityTracker({
      now: () => now,
      onActivity,
    })

    markActivity('mousemove')
    now += sessionActivityThrottleMs

    expect(markActivity('focus')).toBe(true)
    expect(onActivity).toHaveBeenLastCalledWith('focus', now)
  })
})

describe('registerSessionActivityListeners', () => {
  it('should register only focus and mouse movement listeners', () => {
    const window = createWindow()
    const markActivity = vi.fn()

    registerSessionActivityListeners({ markActivity, window })

    expect(window.addEventListener).toHaveBeenCalledTimes(2)
    expect(window.addEventListener).toHaveBeenCalledWith('focus', expect.any(Function), true)
    expect(window.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function), {
      capture: true,
      passive: true,
    })
  })

  it('should remove focus and mouse movement listeners', () => {
    const window = createWindow()

    const cleanup = registerSessionActivityListeners({
      markActivity: vi.fn(),
      window,
    })

    cleanup()

    expect(window.removeEventListener).toHaveBeenCalledTimes(2)
    expect(window.removeEventListener).toHaveBeenCalledWith('focus', expect.any(Function), true)
    expect(window.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function), {
      capture: true,
      passive: true,
    })
  })
})

function createWindow() {
  return {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as Window
}
