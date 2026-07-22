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

    expect(markActivity('input')).toBe(true)
    expect(onActivity).toHaveBeenCalledWith('input', 100)
  })

  it('should ignore activity within the throttle period', () => {
    let now = 100
    const onActivity = vi.fn()
    const markActivity = createSessionActivityTracker({
      now: () => now,
      onActivity,
    })

    markActivity('input')
    now += sessionActivityThrottleMs - 1

    expect(markActivity('keydown')).toBe(false)
    expect(onActivity).toHaveBeenCalledTimes(1)
  })

  it('should process activity at the throttle boundary', () => {
    let now = 100
    const onActivity = vi.fn()
    const markActivity = createSessionActivityTracker({
      now: () => now,
      onActivity,
    })

    markActivity('input')
    now += sessionActivityThrottleMs

    expect(markActivity('keydown')).toBe(true)
    expect(onActivity).toHaveBeenLastCalledWith('keydown', now)
  })
})

describe('registerSessionActivityListeners', () => {
  it('should register activity listeners in capture mode and wheel as passive', () => {
    const document = createDocument()
    const window = createWindow()
    const markActivity = vi.fn()

    registerSessionActivityListeners({ document, markActivity, window })

    expect(window.addEventListener).toHaveBeenCalledWith('pointerdown', expect.any(Function), true)
    expect(window.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function), true)
    expect(window.addEventListener).toHaveBeenCalledWith('input', expect.any(Function), true)
    expect(window.addEventListener).toHaveBeenCalledWith('wheel', expect.any(Function), {
      capture: true,
      passive: true,
    })
    expect(document.addEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
      true,
    )
  })

  it('should only mark visibility activity when the document becomes visible', () => {
    const document = createDocument()
    const window = createWindow()
    const markActivity = vi.fn()

    registerSessionActivityListeners({ document, markActivity, window })
    document.visibilityState = 'hidden'
    document.dispatch('visibilitychange')
    document.visibilityState = 'visible'
    document.dispatch('visibilitychange')

    expect(markActivity).toHaveBeenCalledTimes(1)
    expect(markActivity).toHaveBeenCalledWith('visibility')
  })

  it('should remove every registered listener during cleanup', () => {
    const document = createDocument()
    const window = createWindow()
    const markActivity = vi.fn()

    const cleanup = registerSessionActivityListeners({ document, markActivity, window })

    cleanup()

    expect(window.removeEventListener).toHaveBeenCalledTimes(4)
    expect(document.removeEventListener).toHaveBeenCalledTimes(1)
    expect(window.removeEventListener).toHaveBeenCalledWith(
      'pointerdown',
      expect.any(Function),
      true,
    )
    expect(window.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function), true)
    expect(window.removeEventListener).toHaveBeenCalledWith('input', expect.any(Function), true)
    expect(window.removeEventListener).toHaveBeenCalledWith('wheel', expect.any(Function), {
      capture: true,
      passive: true,
    })
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
      true,
    )
  })
})

function createDocument() {
  const listeners = new Map<string, EventListener>()

  return {
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      listeners.set(type, listener)
    }),
    dispatch: (type: string) => listeners.get(type)?.(new Event(type)),
    removeEventListener: vi.fn((type: string) => {
      listeners.delete(type)
    }),
    visibilityState: 'visible' as DocumentVisibilityState,
  } as unknown as Document & {
    dispatch: (type: string) => void
    visibilityState: DocumentVisibilityState
  }
}

function createWindow() {
  return {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as Window
}
