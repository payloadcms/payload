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
    const activityWindow = createWindow()
    const markActivity = vi.fn()

    const cleanup = registerSessionActivityListeners({
      markActivity,
      window: activityWindow.window,
    })

    expect(activityWindow.addedListeners).toHaveLength(2)
    expect(activityWindow.addedListeners).toEqual([
      { listener: expect.any(Function), options: true, type: 'focus' },
      {
        listener: expect.any(Function),
        options: { capture: true, passive: true },
        type: 'mousemove',
      },
    ])

    cleanup()

    expect(activityWindow.removedListeners).toHaveLength(2)
    expect(activityWindow.removedListeners).toEqual(activityWindow.addedListeners)
  })
})

function createWindow() {
  const addedListeners: ListenerRegistration[] = []
  const removedListeners: ListenerRegistration[] = []

  return {
    addedListeners,
    removedListeners,
    window: {
      addEventListener: (
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: AddEventListenerOptions | boolean,
      ) => {
        addedListeners.push({ listener, options, type })
      },
      removeEventListener: (
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: EventListenerOptions | boolean,
      ) => {
        removedListeners.push({ listener, options, type })
      },
    } as unknown as Window,
  }
}

type ListenerRegistration = {
  listener: EventListenerOrEventListenerObject | null
  options: AddEventListenerOptions | EventListenerOptions | boolean | undefined
  type: string
}
