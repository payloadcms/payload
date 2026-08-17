// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'

import {
  createSessionActivityTracker,
  registerSessionActivityListeners,
  sessionActivityThrottleMs,
} from './sessionActivity.js'

describe('createSessionActivityTracker', () => {
  it('should throttle activity for five seconds', () => {
    expect(sessionActivityThrottleMs).toBe(5_000)

    let now = 100
    const onActivity = vi.fn()
    const activityTracker = createSessionActivityTracker({
      now: () => now,
      onActivity,
    })

    expect(activityTracker.record('mousemove')).toBe(true)
    expect(onActivity).toHaveBeenCalledWith('mousemove', 100)

    now += sessionActivityThrottleMs - 1

    expect(activityTracker.record('focus')).toBe(false)
    expect(onActivity).toHaveBeenCalledTimes(1)

    activityTracker.reset()

    expect(activityTracker.record('focus')).toBe(true)
    expect(onActivity).toHaveBeenCalledTimes(2)

    now += 1

    expect(activityTracker.record('focus')).toBe(false)
  })
})

describe('registerSessionActivityListeners', () => {
  it('should register and remove focus, keyboard, and mouse movement listeners', () => {
    const markActivity = vi.fn()

    const cleanup = registerSessionActivityListeners({
      markActivity,
      window,
    })

    window.dispatchEvent(new Event('focus'))
    window.dispatchEvent(new KeyboardEvent('keydown'))
    window.dispatchEvent(new MouseEvent('mousemove'))

    expect(markActivity.mock.calls).toEqual([['focus'], ['keydown'], ['mousemove']])

    cleanup()
    markActivity.mockClear()

    window.dispatchEvent(new Event('focus'))
    window.dispatchEvent(new KeyboardEvent('keydown'))
    window.dispatchEvent(new MouseEvent('mousemove'))

    expect(markActivity).not.toHaveBeenCalled()
  })
})
