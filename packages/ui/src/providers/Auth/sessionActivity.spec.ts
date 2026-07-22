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
const pathnameState = vi.hoisted(() => ({ value: '/first' }))
let renderedContainer: HTMLElement | undefined
let renderedRoot: ReturnType<typeof createRoot> | undefined

vi.mock('@faceless-ui/modal', () => ({
  useModal: () => ({ closeAllModals: vi.fn(), openModal: vi.fn() }),
}))

vi.mock('payload/shared', () => ({
  formatAdminURL: ({ apiRoute, path }: { apiRoute: string; path: string }) => `${apiRoute}${path}`,
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
        routes: { inactivity: '/logout' },
        user: 'users',
      },
      routes: { admin: '/admin', api: '/api' },
    },
  }),
}))

vi.mock('../RouterAdapter/index.js', () => ({
  usePathname: () => pathnameState.value,
  useRouter: () => ({ replace: vi.fn() }),
}))

vi.mock('../RouteTransition/index.js', () => ({
  useRouteTransition: () => ({ startRouteTransition: vi.fn() }),
}))

afterEach(() => {
  act(() => renderedRoot?.unmount())
  renderedContainer?.remove()
  renderedContainer = undefined
  renderedRoot = undefined
  vi.useRealTimers()
  vi.clearAllMocks()
  pathnameState.value = '/first'
})

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

describe('AuthProvider session activity', () => {
  it('should share one throttle between browser activity and pathname changes', async () => {
    vi.useFakeTimers()

    const user = { collection: 'users', id: '1' }
    const userResponse = {
      exp: Math.floor((Date.now() + 10_000) / 1000),
      token: 'token',
      user,
    }
    apiMocks.get.mockResolvedValue({
      json: async () => userResponse,
      status: 200,
    })
    apiMocks.post.mockResolvedValue({
      json: async () => userResponse,
      status: 200,
    })

    const renderAuthProvider = () =>
      React.createElement(AuthProvider, { user: user as never }, React.createElement('div'))

    renderedContainer = document.createElement('div')
    document.body.append(renderedContainer)
    renderedRoot = createRoot(renderedContainer)

    await act(async () => {
      renderedRoot?.render(renderAuthProvider())
    })

    await act(async () => {})
    await act(async () => {
      await vi.advanceTimersByTimeAsync(sessionActivityThrottleMs + 1)
      window.dispatchEvent(new Event('pointerdown'))
      await vi.advanceTimersByTimeAsync(1_000)
    })

    expect(apiMocks.post).toHaveBeenCalledTimes(1)

    pathnameState.value = '/second'
    await act(async () => {
      renderedRoot?.render(renderAuthProvider())
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000)
    })

    expect(apiMocks.post).toHaveBeenCalledTimes(1)
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
