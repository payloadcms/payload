// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SessionTimingController } from './useSessionTiming.js'

import { useSessionTiming } from './useSessionTiming.js'

const timingCleanups: Array<() => void> = []

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
})

afterEach(() => {
  for (const cleanup of timingCleanups.splice(0)) {
    cleanup()
  }

  vi.useRealTimers()
})

describe('useSessionTiming', () => {
  it('should refresh at the checkpoint when activity occurred in the refresh window', () => {
    const onActivityRefresh = vi.fn()
    const timing = renderSessionTiming({ onActivityRefresh })

    timing.applyExpiration(Date.now() + 300_000)
    act(() => {
      vi.advanceTimersByTime(120_000)
      window.dispatchEvent(new MouseEvent('mousemove'))
      vi.advanceTimersByTime(60_000)
      vi.advanceTimersByTime(1_000)
    })

    expect(onActivityRefresh).toHaveBeenCalledTimes(1)
  })

  it('should clear timers and listeners on logout', () => {
    const onActivityRefresh = vi.fn()
    const onExpire = vi.fn()
    const timing = renderSessionTiming({ onActivityRefresh, onExpire })

    timing.applyExpiration(Date.now() + 300_000)
    timing.clear()
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove'))
      vi.advanceTimersByTime(300_000)
    })

    expect(onActivityRefresh).not.toHaveBeenCalled()
    expect(onExpire).not.toHaveBeenCalled()
  })

  it('should schedule the reminder and expiration from the current expiration', () => {
    const onExpire = vi.fn()
    const onReminder = vi.fn()
    const timing = renderSessionTiming({ onExpire, onReminder })
    const expirationMs = Date.now() + 300_000

    timing.applyExpiration(expirationMs)
    act(() => {
      vi.advanceTimersByTime(240_000)
    })

    expect(onReminder).toHaveBeenCalledTimes(1)
    expect(onExpire).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(onExpire).toHaveBeenCalledWith(expirationMs)
  })

  it('should keep its controller and activity throttle across rerenders', () => {
    const onActivityRefresh = vi.fn()
    const timing = renderSessionTiming({ onActivityRefresh })
    const initialController = timing.getController()

    timing.applyExpiration(Date.now() + 300_000)
    act(() => {
      vi.advanceTimersByTime(240_000)
      window.dispatchEvent(new MouseEvent('mousemove'))
    })
    timing.rerender()

    expect(timing.getController()).toBe(initialController)

    act(() => {
      vi.advanceTimersByTime(1)
      window.dispatchEvent(new MouseEvent('mousemove'))
      vi.advanceTimersByTime(999)
    })

    expect(onActivityRefresh).toHaveBeenCalledTimes(1)
  })

  it('should synchronously replace the current expiration', () => {
    const timing = renderSessionTiming()
    const firstExpirationMs = Date.now() + 300_000
    const replacementExpirationMs = Date.now() + 600_000

    timing.applyExpiration(firstExpirationMs)
    timing.applyExpiration(replacementExpirationMs)

    expect(timing.getCurrentExpirationMs()).toBe(replacementExpirationMs)
  })
})

function renderSessionTiming({
  isAuthenticated = true,
  onActivityRefresh = vi.fn(),
  onExpire = vi.fn(),
  onReminder = vi.fn(),
}: {
  isAuthenticated?: boolean
  onActivityRefresh?: () => void
  onExpire?: (expirationMs: number) => void
  onReminder?: () => void
} = {}): RenderedSessionTiming {
  let controller: SessionTimingController | undefined
  const container = document.createElement('div')
  const root = createRoot(container)

  function SessionTiming() {
    controller = useSessionTiming({ isAuthenticated, onActivityRefresh, onExpire, onReminder })

    return null
  }

  act(() => {
    root.render(React.createElement(SessionTiming))
  })

  timingCleanups.push(() => {
    act(() => {
      root.unmount()
    })
  })

  const getController = (): SessionTimingController => {
    if (!controller) {
      throw new Error('Expected session timing controller.')
    }

    return controller
  }

  return {
    applyExpiration: (expirationMs) => getController().applyExpiration(expirationMs),
    clear: () => getController().clear(),
    getController,
    getCurrentExpirationMs: () => getController().getCurrentExpirationMs(),
    getKnownExpirationMs: () => getController().getKnownExpirationMs(),
    refreshCookie: (forceRefresh) => getController().refreshCookie(forceRefresh),
    rerender: () => {
      act(() => {
        root.render(React.createElement(SessionTiming))
      })
    },
  }
}

type RenderedSessionTiming = SessionTimingController & {
  getController: () => SessionTimingController
  rerender: () => void
}
