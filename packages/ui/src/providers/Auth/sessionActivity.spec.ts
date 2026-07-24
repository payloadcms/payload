import { describe, expect, it, vi } from 'vitest'

import {
  createSessionActivityTracker,
  registerSessionActivityListeners,
  sessionActivityThrottleMs,
} from './sessionActivity.js'

describe('createSessionActivityTracker', () => {
  it('should throttle activity for five seconds', () => {
    let now = 100
    const onActivity = vi.fn()
    const markActivity = createSessionActivityTracker({
      now: () => now,
      onActivity,
    })

    expect(markActivity('mousemove')).toBe(true)
    expect(onActivity).toHaveBeenCalledWith('mousemove', 100)

    now += sessionActivityThrottleMs - 1

    expect(markActivity('focus')).toBe(false)
    expect(onActivity).toHaveBeenCalledTimes(1)

    now += 1

    expect(markActivity('focus')).toBe(true)
    expect(onActivity).toHaveBeenLastCalledWith('focus', now)
  })
})

describe('registerSessionActivityListeners', () => {
  it('should register and remove focus and mouse movement listeners', () => {
    const window = createWindow()
    const markActivity = vi.fn()

    const cleanup = registerSessionActivityListeners({ markActivity, window })

    expect(window.addEventListener).toHaveBeenCalledTimes(2)
    expect(window.addEventListener).toHaveBeenCalledWith('focus', expect.any(Function), true)
    expect(window.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function), {
      capture: true,
      passive: true,
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
