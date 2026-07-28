// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthSessionTimers } from './useAuthSessionTimers.js'

import { useAuthSessionTimers } from './useAuthSessionTimers.js'

const timerCleanups: Array<() => void> = []

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
})

afterEach(() => {
  for (const cleanup of timerCleanups.splice(0)) {
    cleanup()
  }

  vi.useRealTimers()
})

describe('useAuthSessionTimers', () => {
  it('should refresh at the checkpoint when activity occurred in the refresh window', () => {
    const onActivityRefresh = vi.fn()
    const timers = renderAuthSessionTimers({ onActivityRefresh })

    timers.setExpiration(Date.now() + 300_000)
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
    const timers = renderAuthSessionTimers({ onActivityRefresh, onExpire })

    timers.setExpiration(Date.now() + 300_000)
    timers.clear()
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
    const timers = renderAuthSessionTimers({ onExpire, onReminder })
    const expirationMs = Date.now() + 300_000

    timers.setExpiration(expirationMs)
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

  it('should schedule expiration when the token expires exactly now', () => {
    const onActivityRefresh = vi.fn()
    const onExpire = vi.fn()
    const onReminder = vi.fn()
    const timers = renderAuthSessionTimers({
      isAuthenticated: false,
      onActivityRefresh,
      onExpire,
      onReminder,
    })
    const expirationMs = Date.now()

    timers.setExpiration(expirationMs)

    expect(onExpire).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(0)
    })

    expect(onExpire).toHaveBeenCalledOnce()
    expect(onExpire).toHaveBeenCalledWith(expirationMs)
    expect(onActivityRefresh).not.toHaveBeenCalled()
    expect(onReminder).not.toHaveBeenCalled()
  })

  it('should schedule expiration when the token is already past', () => {
    const onActivityRefresh = vi.fn()
    const onExpire = vi.fn()
    const onReminder = vi.fn()
    const timers = renderAuthSessionTimers({
      isAuthenticated: false,
      onActivityRefresh,
      onExpire,
      onReminder,
    })
    const expirationMs = Date.now() - 1

    timers.setExpiration(expirationMs)

    act(() => {
      vi.advanceTimersByTime(0)
    })

    expect(onExpire).toHaveBeenCalledOnce()
    expect(onExpire).toHaveBeenCalledWith(expirationMs)
    expect(onActivityRefresh).not.toHaveBeenCalled()
    expect(onReminder).not.toHaveBeenCalled()
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'should reject a non-finite expiration without activating the session',
    (expirationMs) => {
      const onActivityRefresh = vi.fn()
      const onExpire = vi.fn()
      const timers = renderAuthSessionTimers({
        isAuthenticated: false,
        onActivityRefresh,
        onExpire,
      })

      timers.setExpiration(expirationMs)
      timers.scheduleRefresh(true)
      act(() => {
        vi.advanceTimersByTime(1_000)
      })

      expect(timers.getCurrentExpirationMs()).toBeUndefined()
      expect(timers.getLatestExpirationMs()).toBeUndefined()
      expect(onActivityRefresh).not.toHaveBeenCalled()
      expect(onExpire).not.toHaveBeenCalled()
    },
  )

  it('should synchronously activate on apply and deactivate on clear', () => {
    const onActivityRefresh = vi.fn()
    const timers = renderAuthSessionTimers({ isAuthenticated: false, onActivityRefresh })

    timers.clear()
    timers.setExpiration(Date.now() + 300_000)
    timers.scheduleRefresh(true)
    act(() => {
      vi.advanceTimersByTime(1_000)
    })

    expect(onActivityRefresh).toHaveBeenCalledOnce()

    timers.clear()
    timers.scheduleRefresh(true)
    act(() => {
      vi.advanceTimersByTime(1_000)
    })

    expect(onActivityRefresh).toHaveBeenCalledOnce()
  })

  it('should reinstall activity listeners once when clear and apply occur in the same tick', () => {
    const addEventListener = vi.spyOn(window, 'addEventListener')
    const onActivityRefresh = vi.fn()
    const timers = renderAuthSessionTimers({ onActivityRefresh })
    const expirationMs = Date.now() + 300_000

    timerCleanups.push(() => {
      addEventListener.mockRestore()
    })

    timers.setExpiration(expirationMs)
    timers.clear()
    timers.setExpiration(expirationMs)
    timers.setExpiration(expirationMs)

    act(() => {
      vi.advanceTimersByTime(240_000)
      window.dispatchEvent(new MouseEvent('mousemove'))
      vi.advanceTimersByTime(1_000)
    })

    expect(onActivityRefresh).toHaveBeenCalledOnce()
    expect(
      addEventListener.mock.calls.filter(([eventType]) =>
        ['focus', 'mousemove'].includes(eventType),
      ),
    ).toHaveLength(4)
  })

  it('should keep its controller and activity throttle across rerenders', () => {
    const onActivityRefresh = vi.fn()
    const timers = renderAuthSessionTimers({ onActivityRefresh })
    const initialController = timers.getController()

    timers.setExpiration(Date.now() + 300_000)
    act(() => {
      vi.advanceTimersByTime(240_000)
      window.dispatchEvent(new MouseEvent('mousemove'))
    })
    timers.rerender()

    expect(timers.getController()).toBe(initialController)

    act(() => {
      vi.advanceTimersByTime(1)
      window.dispatchEvent(new MouseEvent('mousemove'))
      vi.advanceTimersByTime(999)
    })

    expect(onActivityRefresh).toHaveBeenCalledTimes(1)
  })

  it('should synchronously replace the current expiration', () => {
    const timers = renderAuthSessionTimers()
    const firstExpirationMs = Date.now() + 300_000
    const replacementExpirationMs = Date.now() + 600_000

    timers.setExpiration(firstExpirationMs)
    timers.setExpiration(replacementExpirationMs)

    expect(timers.getCurrentExpirationMs()).toBe(replacementExpirationMs)
  })
})

function renderAuthSessionTimers({
  isAuthenticated = true,
  onActivityRefresh = vi.fn(),
  onExpire = vi.fn(),
  onReminder = vi.fn(),
}: {
  isAuthenticated?: boolean
  onActivityRefresh?: () => void
  onExpire?: (expirationMs: number) => void
  onReminder?: () => void
} = {}): RenderedAuthSessionTimers {
  let controller: AuthSessionTimers | undefined
  const container = document.createElement('div')
  const root = createRoot(container)

  function SessionTimers() {
    controller = useAuthSessionTimers({ isAuthenticated, onActivityRefresh, onExpire, onReminder })

    return null
  }

  act(() => {
    root.render(React.createElement(SessionTimers))
  })

  timerCleanups.push(() => {
    act(() => {
      root.unmount()
    })
  })

  const getController = (): AuthSessionTimers => {
    if (!controller) {
      throw new Error('Expected auth session timers.')
    }

    return controller
  }

  return {
    clear: () => getController().clear(),
    getController,
    getCurrentExpirationMs: () => getController().getCurrentExpirationMs(),
    getLatestExpirationMs: () => getController().getLatestExpirationMs(),
    rerender: () => {
      act(() => {
        root.render(React.createElement(SessionTimers))
      })
    },
    scheduleRefresh: (forceRefresh) => getController().scheduleRefresh(forceRefresh),
    setExpiration: (expirationMs) => getController().setExpiration(expirationMs),
  }
}

type RenderedAuthSessionTimers = AuthSessionTimers & {
  getController: () => AuthSessionTimers
  rerender: () => void
}
