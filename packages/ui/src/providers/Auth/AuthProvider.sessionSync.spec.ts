// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthContext, UserWithToken } from './index.js'
import { AuthProvider, useAuth } from './index.js'
import {
  createFutureSession,
  createMessage,
  dispatchStorageNotification,
  getBroadcastChannel,
  resetMockBroadcastChannels,
} from '../../../test/sessionSync.js'
import { AUTH_SESSION_SYNC_EVENT_TYPES } from './sessionSync.js'
;(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))
const routerMocks = vi.hoisted(() => ({
  replace: vi.fn(),
}))

let authContext: AuthContext | undefined
let renderedContainer: HTMLElement | undefined
let renderedRoot: ReturnType<typeof createRoot> | undefined
const activityRefreshDebounceMs = 1_000

vi.mock('@faceless-ui/modal', () => ({
  useModal: () => ({ closeAllModals: vi.fn(), openModal: vi.fn() }),
}))

vi.mock('payload/shared', () => ({
  formatAdminURL: ({
    adminRoute,
    apiRoute,
    path,
  }: {
    adminRoute?: string
    apiRoute?: string
    path: string
  }) => `${apiRoute ?? adminRoute ?? ''}${path}`,
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
        routes: { inactivity: '/logout-inactivity', login: '/login' },
        user: 'users',
      },
      routes: { admin: '/admin', api: '/api' },
    },
  }),
}))

vi.mock('../RouterAdapter/index.js', () => ({
  useRouter: () => routerMocks,
}))

vi.mock('../RouteTransition/index.js', () => ({
  useRouteTransition: () => ({
    startRouteTransition: (callback: () => void) => callback(),
  }),
}))

beforeEach(() => {
  resetMockBroadcastChannels()
})

afterEach(() => {
  act(() => renderedRoot?.unmount())
  renderedContainer?.remove()
  authContext = undefined
  renderedContainer = undefined
  renderedRoot = undefined
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  apiMocks.get.mockReset()
  apiMocks.post.mockReset()
  vi.clearAllMocks()
})

describe('AuthProvider refresh synchronization', () => {
  it('should publish a refresh after refreshCookie succeeds', async () => {
    vi.useFakeTimers()
    const initialSessionLifetimeMs = 60_000
    const refreshedSessionLifetimeMs = 120_000
    const initialSession = createFutureSession({
      expiresInMs: initialSessionLifetimeMs,
      token: 'initial-token',
    })
    const refreshedSession = createFutureSession({
      expiresInMs: refreshedSessionLifetimeMs,
      token: 'fresh-token',
    })

    await renderProvider({ session: initialSession })
    apiMocks.post.mockResolvedValueOnce(createResponse({ session: refreshedSession }))
    const channel = getBroadcastChannel()
    channel.postMessage.mockClear()

    act(() => authContext?.refreshCookie(true))
    await act(async () => advanceSessionBy({ milliseconds: activityRefreshDebounceMs }))

    expect(channel.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        session: refreshedSession,
        type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
      }),
    )
  })

  it('should publish a refresh after refreshCookieAsync succeeds', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    const refreshedSession = createFutureSession({ expiresInMs: 120_000, token: 'fresh-token' })

    await renderProvider({ session: initialSession })
    apiMocks.post.mockResolvedValueOnce(createResponse({ session: refreshedSession }))
    const channel = getBroadcastChannel()
    channel.postMessage.mockClear()

    await act(async () => {
      await authContext?.refreshCookieAsync()
    })

    expect(channel.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        session: refreshedSession,
        type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
      }),
    )
  })

  it('should share one in-flight request between concurrent refreshCookieAsync calls', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    const refreshedSession = createFutureSession({ expiresInMs: 120_000, token: 'fresh-token' })
    let resolveRefresh: ((value: ReturnType<typeof createResponse>) => void) | undefined
    const refreshResponse = new Promise<ReturnType<typeof createResponse>>((resolve) => {
      resolveRefresh = resolve
    })

    await renderProvider({ session: initialSession })
    apiMocks.post.mockReturnValueOnce(refreshResponse)

    const firstRefresh = authContext?.refreshCookieAsync()
    const secondRefresh = authContext?.refreshCookieAsync()

    expect(secondRefresh).toBe(firstRefresh)
    await act(async () => Promise.resolve())

    expect(apiMocks.post).toHaveBeenCalledOnce()

    resolveRefresh?.(createResponse({ session: refreshedSession }))
    await act(async () => {
      await Promise.all([firstRefresh, secondRefresh])
    })

    expect(authContext?.token).toBe('fresh-token')
    expect(authContext?.tokenExpirationMs).toBe(refreshedSession.exp * 1000)
  })

  it('should ignore a deferred refreshCookie success after remote expiration', async () => {
    vi.useFakeTimers()
    const initialSessionLifetimeMs = 60_000
    const staleResponseSessionLifetimeMs = 120_000
    const initialSession = createFutureSession({
      expiresInMs: initialSessionLifetimeMs,
      token: 'initial-token',
    })
    const staleResponseSession = createFutureSession({
      expiresInMs: staleResponseSessionLifetimeMs,
      token: 'stale-token',
    })
    let resolveRefresh: ((value: ReturnType<typeof createResponse>) => void) | undefined
    const refreshResponse = new Promise<ReturnType<typeof createResponse>>((resolve) => {
      resolveRefresh = resolve
    })

    await renderProvider({ session: initialSession })
    apiMocks.post.mockReturnValueOnce(refreshResponse)
    const channel = getBroadcastChannel()
    channel.postMessage.mockClear()

    act(() => authContext?.refreshCookie(true))
    await act(async () => advanceSessionBy({ milliseconds: activityRefreshDebounceMs }))
    await act(async () => {})
    await act(async () => {
      channel.emit(
        createMessage({
          expiredTokenAt: initialSession.exp * 1000,
          sentAt: 200,
          sourceID: 'remote-tab',
          type: AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED,
        }),
      )
    })
    await act(async () => {
      resolveRefresh?.(createResponse({ session: staleResponseSession }))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(authContext?.user).toBeNull()
    expect(authContext?.token).toBeUndefined()
    expect(channel.postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED }),
    )
  })

  it('should apply the later response from overlapping storage-triggered user requests', async () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    const firstSession = createFutureSession({ expiresInMs: 120_000, token: 'first-token' })
    const secondSession = createFutureSession({ expiresInMs: 180_000, token: 'second-token' })
    let resolveFirstFetch: ((value: ReturnType<typeof createResponse>) => void) | undefined
    let resolveSecondFetch: ((value: ReturnType<typeof createResponse>) => void) | undefined
    const firstResponse = new Promise<ReturnType<typeof createResponse>>((resolve) => {
      resolveFirstFetch = resolve
    })
    const secondResponse = new Promise<ReturnType<typeof createResponse>>((resolve) => {
      resolveSecondFetch = resolve
    })

    await renderProvider({ session: initialSession })
    apiMocks.get.mockClear()
    apiMocks.get.mockReturnValueOnce(firstResponse).mockReturnValueOnce(secondResponse)

    act(() =>
      dispatchStorageNotification({
        affectedExpirationMs: firstSession.exp * 1000,
        type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
        sentAt: 500,
        sourceID: 'remote-a',
      }),
    )
    await act(async () => Promise.resolve())

    expect(apiMocks.get).toHaveBeenCalledOnce()

    act(() =>
      dispatchStorageNotification({
        affectedExpirationMs: secondSession.exp * 1000,
        type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
        sentAt: 600,
        sourceID: 'remote-b',
      }),
    )

    resolveFirstFetch?.(createResponse({ session: firstSession }))
    await act(async () => {
      await firstResponse
      await Promise.resolve()
      await Promise.resolve()
    })

    await vi.waitFor(() => expect(apiMocks.get).toHaveBeenCalledTimes(2))
    expect(authContext?.token).toBe('initial-token')

    resolveSecondFetch?.(createResponse({ session: secondSession }))
    await act(async () => {
      await secondResponse
      await Promise.resolve()
    })

    expect(authContext?.token).toBe('second-token')
    expect(authContext?.tokenExpirationMs).toBe(secondSession.exp * 1000)
  })

  it('should flush a deferred refresh rejection after a queued user request confirms no user', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    let resolveRefresh: ((value: { status: number }) => void) | undefined
    const refreshResponse = new Promise<{ status: number }>((resolve) => {
      resolveRefresh = resolve
    })

    await renderProvider({ session: initialSession })
    apiMocks.get.mockClear()
    apiMocks.post.mockReturnValueOnce(refreshResponse)
    apiMocks.get.mockResolvedValueOnce(
      createResponse({ session: { exp: 0, user: null } as unknown as UserWithToken }),
    )
    const channel = getBroadcastChannel()
    channel.postMessage.mockClear()

    const refreshPromise = authContext?.refreshCookieAsync()
    const fetchPromise = authContext?.fetchFullUser()
    resolveRefresh?.({ status: 401 })

    await act(async () => {
      await refreshPromise
      await fetchPromise
    })

    expect(channel.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        expiredTokenAt: initialSession.exp * 1000,
        type: AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED,
      }),
    )
    expect(authContext?.user).toBeNull()
    expect(routerMocks.replace).toHaveBeenCalledOnce()
    expect(routerMocks.replace).toHaveBeenCalledWith(expect.stringContaining('/logout-inactivity'))
  })
})

describe('AuthProvider remote session synchronization', () => {
  it('should apply a remote refresh without rebroadcasting it', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    const remoteSession = createFutureSession({ expiresInMs: 120_000, token: 'remote-token' })

    await renderProvider({ session: initialSession })
    const channel = getBroadcastChannel()
    channel.postMessage.mockClear()

    await act(async () => {
      channel.emit(
        createMessage({
          session: remoteSession,
          sourceID: 'remote-tab',
          type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
        }),
      )
    })

    expect(authContext?.token).toBe('remote-token')
    expect(channel.postMessage).not.toHaveBeenCalled()
  })

  it('should cancel a pending activity refresh when a remote token is accepted', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    const sessionLifetimeMs = 300_000
    const activityCheckpointLeadInMs = 120_000
    const activityCheckpointDelayMs = 60_000
    const pastActivityRefreshDebounceMs = activityRefreshDebounceMs + 1
    const initialSession = createFutureSession({
      expiresInMs: sessionLifetimeMs,
      token: 'initial-token',
    })

    await renderProvider({ session: initialSession })
    const channel = getBroadcastChannel()

    await act(async () => {
      await advanceSessionBy({ milliseconds: activityCheckpointLeadInMs })
      window.dispatchEvent(new MouseEvent('mousemove'))
      await advanceSessionBy({ milliseconds: activityCheckpointDelayMs })
      channel.emit(
        createMessage({
          session: createFutureSession({
            expiresInMs: sessionLifetimeMs,
            token: 'remote-token',
          }),
          sourceID: 'remote-tab',
          type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
        }),
      )
      await advanceSessionBy({ milliseconds: pastActivityRefreshDebounceMs })
    })

    expect(apiMocks.post).not.toHaveBeenCalled()
  })
})

describe('AuthProvider expiration and logout synchronization', () => {
  it('should publish expiration when a refresh response rejects the session', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })

    await renderProvider({ session: initialSession })
    apiMocks.post.mockResolvedValueOnce({ status: 401 })
    const channel = getBroadcastChannel()
    channel.postMessage.mockClear()

    await act(async () => {
      await authContext?.refreshCookieAsync()
    })

    expect(channel.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        expiredTokenAt: initialSession.exp * 1000,
        type: AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED,
      }),
    )
  })

  it('should publish expiration when the force-logout timer expires', async () => {
    vi.useFakeTimers()
    const initialSession = createFutureSession({ expiresInMs: 10_000, token: 'initial-token' })

    await renderProvider({ session: initialSession })
    const channel = getBroadcastChannel()
    channel.postMessage.mockClear()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
    })

    expect(channel.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        expiredTokenAt: initialSession.exp * 1000,
        type: AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED,
      }),
    )
    expect(routerMocks.replace).toHaveBeenCalledWith(expect.stringContaining('/logout-inactivity'))
  })

  it('should publish explicit logout before the logout request settles', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    let resolveLogout: ((value: { status: number }) => void) | undefined
    const logoutResponse = new Promise<{ status: number }>((resolve) => {
      resolveLogout = resolve
    })

    await renderProvider({ session: initialSession })
    apiMocks.post.mockReturnValueOnce(logoutResponse)
    const channel = getBroadcastChannel()
    channel.postMessage.mockClear()

    let logoutPromise: Promise<boolean> | undefined
    act(() => {
      logoutPromise = authContext?.logOut()
    })

    expect(channel.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT }),
    )

    resolveLogout?.({ status: 200 })
    await act(async () => {
      await logoutPromise
    })
  })

  it('should resynchronize a settled remote logout after a local relogin', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    const reloginSession = createFutureSession({ expiresInMs: 120_000, token: 'relogin-token' })

    await renderProvider({ session: initialSession })
    apiMocks.get.mockClear()
    const channel = getBroadcastChannel()

    await act(async () => {
      channel.emit(
        createMessage({
          sentAt: 500,
          sourceID: 'remote-tab',
          type: AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT,
        }),
      )
    })
    act(() => authContext?.setUser(reloginSession))

    expect(authContext?.token).toBe('relogin-token')

    apiMocks.get.mockResolvedValueOnce(
      createResponse({ session: { exp: 0, user: null } as unknown as UserWithToken }),
    )
    routerMocks.replace.mockClear()
    act(() =>
      dispatchStorageNotification({
        affectedExpirationMs: 0,
        type: AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT,
        sentAt: 600,
        settlesSentAt: 500,
        sourceID: 'remote-tab',
      }),
    )
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(apiMocks.get).toHaveBeenCalledOnce()
    expect(authContext?.user).toBeNull()
    expect(authContext?.token).toBeUndefined()
    expect(routerMocks.replace).toHaveBeenCalledWith(expect.stringContaining('/logout-inactivity'))
  })

  it('should restore the shared session when a remote logout does not clear its cookie', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'surviving-token' })

    await renderProvider({ session: initialSession })
    apiMocks.get.mockClear()
    const channel = getBroadcastChannel()

    await act(async () => {
      channel.emit(
        createMessage({
          sentAt: 500,
          sourceID: 'remote-tab',
          type: AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT,
        }),
      )
    })

    expect(authContext?.user).toBeNull()

    apiMocks.get.mockResolvedValueOnce(createResponse({ session: initialSession }))
    routerMocks.replace.mockClear()
    act(() =>
      dispatchStorageNotification({
        affectedExpirationMs: 0,
        type: AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT,
        sentAt: 600,
        settlesSentAt: 500,
        sourceID: 'remote-tab',
      }),
    )
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(apiMocks.get).toHaveBeenCalledOnce()
    expect(authContext?.token).toBe('surviving-token')
    expect(authContext?.user).toEqual(initialSession.user)
    expect(routerMocks.replace).not.toHaveBeenCalled()
  })
})

describe('AuthProvider session synchronization cleanup', () => {
  it('should not navigate for a Storage response after provider unmount', async () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    let resolveFetch: ((value: ReturnType<typeof createResponse>) => void) | undefined
    const fetchResponse = new Promise<ReturnType<typeof createResponse>>((resolve) => {
      resolveFetch = resolve
    })

    await renderProvider({ session: initialSession })
    apiMocks.get.mockClear()
    apiMocks.get.mockReturnValueOnce(fetchResponse)
    act(() =>
      dispatchStorageNotification({
        affectedExpirationMs: 0,
        type: AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT,
        sentAt: 900,
        sourceID: 'remote-tab',
      }),
    )
    await act(async () => Promise.resolve())

    act(() => renderedRoot?.unmount())
    renderedRoot = undefined
    resolveFetch?.(createResponse({ session: { exp: 0, user: null } as unknown as UserWithToken }))
    await act(async () => {
      await fetchResponse
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(routerMocks.replace).not.toHaveBeenCalled()
  })
})

function CaptureAuthContext() {
  authContext = useAuth()

  return null
}

function createResponse({ session }: { session: UserWithToken }) {
  return {
    json: async () => session,
    status: 200,
  }
}

async function renderProvider({ session }: { session: UserWithToken }) {
  apiMocks.get.mockResolvedValue(createResponse({ session }))
  renderedContainer = document.createElement('div')
  document.body.append(renderedContainer)
  renderedRoot = createRoot(renderedContainer)

  await act(async () => {
    renderedRoot?.render(
      React.createElement(
        AuthProvider,
        { user: session.user },
        React.createElement(CaptureAuthContext),
      ),
    )
  })
  await act(async () => {})
}

async function advanceSessionBy({ milliseconds }: { milliseconds: number }): Promise<void> {
  await vi.advanceTimersByTimeAsync(milliseconds)
}
