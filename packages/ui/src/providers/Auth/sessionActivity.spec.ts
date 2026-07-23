// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from './index.js'
import {
  createSessionActivityTracker,
  registerSessionActivityListeners,
  sessionActivityThrottleMs,
} from './sessionActivity.js'
;(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))
let renderedContainer: HTMLElement | undefined
let renderedRoot: ReturnType<typeof createRoot> | undefined

vi.mock('@faceless-ui/modal', () => ({
  useModal: () => ({ closeAllModals: vi.fn(), openModal: vi.fn() }),
}))

vi.mock('payload/shared', () => ({
  formatAdminURL: ({ apiRoute, path }: { apiRoute?: string; path: string }) => `${apiRoute}${path}`,
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

vi.mock('../../elements/StayLoggedIn/index.js', () => ({
  stayLoggedInModalSlug: 'stay-logged-in',
}))

vi.mock('../../providers/Translation/index.js', () => ({
  useTranslation: () => ({ i18n: { language: 'en' } }),
}))

vi.mock('../../utilities/api.js', () => ({
  requests: apiMocks,
}))

vi.mock('../Config/index.js', () => ({
  useConfig: () => ({
    config: {
      admin: {
        autoRefresh: true,
        routes: { inactivity: '/logout', login: '/login' },
        user: 'users',
      },
      routes: { admin: '/admin', api: '/api' },
    },
  }),
}))

vi.mock('../RouterAdapter/index.js', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}))

vi.mock('../RouteTransition/index.js', () => ({
  useRouteTransition: () => ({
    startRouteTransition: (callback: () => void) => callback(),
  }),
}))

afterEach(() => {
  act(() => renderedRoot?.unmount())
  renderedContainer?.remove()
  renderedContainer = undefined
  renderedRoot = undefined
  vi.useRealTimers()
  apiMocks.get.mockReset()
  apiMocks.post.mockReset()
  vi.clearAllMocks()
})

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

describe('AuthProvider session activity', () => {
  it('should refresh at the checkpoint after recent pre-window activity', async () => {
    await renderAuthenticatedProvider({ tokenLifetimeMs: 300_000 })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000)
      window.dispatchEvent(new MouseEvent('mousemove'))
      await vi.advanceTimersByTimeAsync(60_000)
      await vi.advanceTimersByTimeAsync(1_001)
    })

    expect(apiMocks.post).toHaveBeenCalledTimes(1)
  })

  it('should not refresh at the checkpoint for activity older than the refresh window', async () => {
    await renderAuthenticatedProvider({ tokenLifetimeMs: 300_000 })

    window.dispatchEvent(new MouseEvent('mousemove'))
    await act(async () => vi.advanceTimersByTimeAsync(181_001))

    expect(apiMocks.post).not.toHaveBeenCalled()
  })

  it('should refresh when activity occurs after an empty checkpoint', async () => {
    await renderAuthenticatedProvider({ tokenLifetimeMs: 300_000 })

    await act(async () => vi.advanceTimersByTimeAsync(181_000))
    window.dispatchEvent(new Event('focus'))
    await act(async () => vi.advanceTimersByTimeAsync(1_001))

    expect(apiMocks.post).toHaveBeenCalledTimes(1)
  })

  it('should not reuse activity after a successful refresh', async () => {
    await renderAuthenticatedProvider({ tokenLifetimeMs: 300_000 })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000)
      window.dispatchEvent(new MouseEvent('mousemove'))
      await vi.advanceTimersByTimeAsync(61_001)
      await vi.advanceTimersByTimeAsync(180_000)
      await vi.advanceTimersByTimeAsync(1_001)
    })

    expect(apiMocks.post).toHaveBeenCalledTimes(1)
  })

  it('should clear the pending checkpoint on provider unmount', async () => {
    await renderAuthenticatedProvider({ tokenLifetimeMs: 300_000 })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000)
      window.dispatchEvent(new MouseEvent('mousemove'))
      renderedRoot?.unmount()
      renderedRoot = undefined
      await vi.advanceTimersByTimeAsync(61_001)
    })

    expect(apiMocks.post).not.toHaveBeenCalled()
  })
})

async function renderAuthenticatedProvider({ tokenLifetimeMs }: { tokenLifetimeMs: number }) {
  vi.useFakeTimers()
  vi.setSystemTime(0)

  const user = { collection: 'users', id: '1' }
  const createResponse = () => ({
    exp: Math.floor((Date.now() + tokenLifetimeMs) / 1000),
    token: 'token',
    user,
  })

  apiMocks.get.mockImplementation(async () => ({
    json: async () => createResponse(),
    status: 200,
  }))
  apiMocks.post.mockImplementation(async () => ({
    json: async () => createResponse(),
    status: 200,
  }))

  renderedContainer = document.createElement('div')
  document.body.append(renderedContainer)
  renderedRoot = createRoot(renderedContainer)

  await act(async () => {
    renderedRoot?.render(
      React.createElement(AuthProvider, { user: user as never }, React.createElement('div')),
    )
  })
  await act(async () => {})
}

function createWindow() {
  return {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as Window
}
