// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AuthContext, UserWithToken } from './index.js'

import { AuthProvider, useAuth } from './index.js'
import { sessionActivityThrottleMs } from './sessionActivity.js'

const fiveMinuteTokenMs = 300_000
const tenMinuteTokenMs = 600_000
const refreshWindowMs = 120_000
const refreshDebounceMs = 1_000
const initialCheckpointAtMs = fiveMinuteTokenMs - refreshWindowMs
const initialRefreshRequestAtMs = initialCheckpointAtMs + refreshDebounceMs + 1
const refreshedTokenCheckpointAtMs =
  Math.floor((initialRefreshRequestAtMs + tenMinuteTokenMs) / refreshDebounceMs) *
    refreshDebounceMs -
  refreshWindowMs
const refreshedTokenActivityAtMs = refreshedTokenCheckpointAtMs - refreshWindowMs

;(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))
let renderedContainer: HTMLElement | undefined
let renderedRoot: ReturnType<typeof createRoot> | undefined
let authContext: AuthContext | undefined

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
  authContext = undefined
  renderedContainer = undefined
  renderedRoot = undefined
  vi.useRealTimers()
  apiMocks.get.mockReset()
  apiMocks.post.mockReset()
  vi.clearAllMocks()
})

describe('AuthProvider session activity', () => {
  it('should ignore activity older than the refresh window at the checkpoint', async () => {
    await renderAuthenticatedProvider({ tokenLifetimeMs: fiveMinuteTokenMs })

    dispatchMousemove()
    await advanceSessionBy(initialCheckpointAtMs)
    await advancePastRefreshDebounce()
    await advanceSessionBy(1)

    expect(apiMocks.post).not.toHaveBeenCalled()
  })

  it('should cancel a queued checkpoint refresh when a local token is accepted', async () => {
    await renderAuthenticatedProvider({ tokenLifetimeMs: fiveMinuteTokenMs })

    await advanceSessionBy(refreshWindowMs)
    dispatchMousemove()
    await advanceSessionBy(initialCheckpointAtMs - refreshWindowMs)
    act(() => authContext?.setUser(createFutureSession({ expiresInMs: fiveMinuteTokenMs })))
    await advancePastRefreshDebounce()
    await advanceSessionBy(1)

    expect(apiMocks.post).not.toHaveBeenCalled()
  })

  it('should allow later activity to retry after a rejected refresh', async () => {
    await renderAuthenticatedProvider({ tokenLifetimeMs: fiveMinuteTokenMs })
    apiMocks.post.mockRejectedValueOnce(new Error('network unavailable'))

    await advanceSessionBy(refreshWindowMs)
    dispatchMousemove()
    await advanceSessionBy(initialCheckpointAtMs - refreshWindowMs)
    await advancePastRefreshDebounce()
    await advanceSessionBy(1)

    expect(apiMocks.post).toHaveBeenCalledTimes(1)

    await advanceSessionBy(sessionActivityThrottleMs)
    dispatchMousemove()
    await advancePastRefreshDebounce()

    expect(apiMocks.post).toHaveBeenCalledTimes(2)
  })

  it('should schedule the next checkpoint for a refreshed token', async () => {
    await renderAuthenticatedProvider({ tokenLifetimeMs: fiveMinuteTokenMs })
    apiMocks.post.mockImplementationOnce(async () => ({
      json: async () => createFutureSession({ expiresInMs: tenMinuteTokenMs }),
      status: 200,
    }))

    await advanceSessionBy(refreshWindowMs)
    dispatchMousemove()
    await advanceSessionBy(initialCheckpointAtMs - refreshWindowMs)
    await advancePastRefreshDebounce()
    await advanceSessionBy(1)
    await advancePastRefreshDebounce()
    await advanceSessionBy(1)

    expect(apiMocks.post).toHaveBeenCalledTimes(1)

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    await advanceSessionTo(refreshedTokenActivityAtMs)

    expect(apiMocks.post).toHaveBeenCalledTimes(1)

    dispatchMousemove()
    await advanceSessionBy(refreshWindowMs)

    expect(apiMocks.post).toHaveBeenCalledTimes(1)

    await advanceSessionBy(refreshDebounceMs - 1)

    expect(apiMocks.post).toHaveBeenCalledTimes(1)

    await advanceSessionBy(1)

    expect(apiMocks.post).toHaveBeenCalledTimes(2)
  })

  it('should ignore an activity refresh response that resolves after unmount', async () => {
    let resolveRefresh:
      | ((value: { json: () => Promise<UserWithToken>; status: number }) => void)
      | undefined
    const refreshResponse = new Promise<{ json: () => Promise<UserWithToken>; status: number }>(
      (resolve) => {
        resolveRefresh = resolve
      },
    )

    await renderAuthenticatedProvider({ tokenLifetimeMs: fiveMinuteTokenMs })
    apiMocks.post.mockReturnValueOnce(refreshResponse)

    await advanceSessionBy(refreshWindowMs)
    dispatchMousemove()
    await advanceSessionBy(initialCheckpointAtMs - refreshWindowMs)
    await advancePastRefreshDebounce()
    await advanceSessionBy(1)
    act(() => renderedRoot?.unmount())
    renderedRoot = undefined
    resolveRefresh?.({
      json: async () => createFutureSession({ expiresInMs: fiveMinuteTokenMs }),
      status: 200,
    })
    await act(async () => {
      await refreshResponse
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(vi.getTimerCount()).toBe(0)
  })

  it('should cancel a pending activity checkpoint on unmount', async () => {
    await renderAuthenticatedProvider({ tokenLifetimeMs: fiveMinuteTokenMs })

    await advanceSessionBy(refreshWindowMs)
    dispatchMousemove()
    act(() => renderedRoot?.unmount())
    renderedRoot = undefined
    await advanceSessionBy(initialCheckpointAtMs - refreshWindowMs)
    await advancePastRefreshDebounce()
    await advanceSessionBy(1)

    expect(apiMocks.post).not.toHaveBeenCalled()
  })
})

async function advanceSessionBy(milliseconds: number): Promise<void> {
  await act(async () => vi.advanceTimersByTimeAsync(milliseconds))
}

async function advanceSessionTo(timestamp: number): Promise<void> {
  await advanceSessionBy(timestamp - Date.now())
}

function dispatchMousemove(): void {
  window.dispatchEvent(new MouseEvent('mousemove'))
}

async function advancePastRefreshDebounce(): Promise<void> {
  await advanceSessionBy(refreshDebounceMs)
}

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
      React.createElement(
        AuthProvider,
        { user: user as never },
        React.createElement(CaptureAuthContext),
      ),
    )
  })
  await act(async () => {})
}

function CaptureAuthContext() {
  authContext = useAuth()

  return null
}

function createFutureSession({ expiresInMs }: { expiresInMs: number }): UserWithToken {
  return {
    exp: Math.floor((Date.now() + expiresInMs) / 1000),
    token: 'fresh-token',
    user: { collection: 'users', id: '1' },
  }
}
