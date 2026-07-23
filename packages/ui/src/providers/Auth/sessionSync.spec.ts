// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthContext, UserWithToken } from './index.js'
import type {
  AuthSessionResyncResult,
  AuthSessionSyncEventType,
  AuthSessionSyncMessage,
} from './sessionSync.js'

import { AuthProvider, useAuth } from './index.js'
import { AUTH_SESSION_SYNC_EVENT_TYPES, createAuthSessionSync } from './sessionSync.js'
;(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))
const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}))

let authContext: AuthContext | undefined
let renderedContainer: HTMLElement | undefined
let renderedRoot: ReturnType<typeof createRoot> | undefined
const sessionSyncCleanups: Array<() => void> = []

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
  usePathname: () => '/admin',
  useRouter: () => routerMocks,
}))

vi.mock('../RouteTransition/index.js', () => ({
  useRouteTransition: () => ({
    startRouteTransition: (callback: () => void) => callback(),
  }),
}))

beforeEach(() => {
  MockBroadcastChannel.instances.length = 0
  vi.stubGlobal('BroadcastChannel', MockBroadcastChannel)
})

afterEach(() => {
  for (const cleanup of sessionSyncCleanups.splice(0)) {
    cleanup()
  }

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

describe('createAuthSessionSync publishing', () => {
  it('should publish refreshed sessions with source and timing metadata', () => {
    const session = createSession({ expirationMs: 20_000, token: 'refreshed-token' })
    const sync = createSync({ now: () => 123 })

    sync.publish({ session, type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED })

    expect(getBroadcastChannel().postMessage).toHaveBeenCalledWith({
      session,
      sourceID: 'local-tab',
      sentAt: 123,
      type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
    })
  })
})

describe('createAuthSessionSync receiving', () => {
  it('should apply a valid remote expiration', () => {
    const onSessionExpired = vi.fn()

    createSync({ localExpirationMs: 20_000, onSessionExpired })
    getBroadcastChannel().emit(
      createMessage({
        expiredTokenAt: 20_000,
        sourceID: 'remote-tab',
        type: AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED,
      }),
    )

    expect(onSessionExpired).toHaveBeenCalledWith(20_000)
  })

  it('should ignore a refreshed session older than the local expiration', () => {
    const onSessionRefreshed = vi.fn()

    createSync({ localExpirationMs: 40_000, onSessionRefreshed })
    getBroadcastChannel().emit(
      createMessage({
        session: createSession({ expirationMs: 30_000 }),
        sourceID: 'remote-tab',
        type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
      }),
    )

    expect(onSessionRefreshed).not.toHaveBeenCalled()
  })

  it('should ignore expiration for a token newer than the handled expiration', () => {
    const onSessionExpired = vi.fn()

    createSync({ localExpirationMs: 40_000, onSessionExpired })
    getBroadcastChannel().emit(
      createMessage({
        expiredTokenAt: 30_000,
        sourceID: 'remote-tab',
        type: AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED,
      }),
    )

    expect(onSessionExpired).not.toHaveBeenCalled()
  })

  it('should converge on a destructive event when equal-time events arrive in opposite orders', () => {
    let firstState = 'initial'
    let secondState = 'initial'
    const refreshedSession = createSession({ expirationMs: 30_000, token: 'refreshed-token' })
    const refreshMessage = createMessage({
      sentAt: 500,
      session: refreshedSession,
      sourceID: 'refresh-tab',
      type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
    })
    const logoutMessage = createMessage({
      sentAt: 500,
      sourceID: 'logout-tab',
      type: AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT,
    })

    createSync({
      onSessionLoggedOut: () => {
        firstState = 'logged-out'
      },
      onSessionRefreshed: () => {
        firstState = 'refreshed'
      },
      sourceID: 'first-local-tab',
    })
    const firstChannel = getBroadcastChannel()
    createSync({
      onSessionLoggedOut: () => {
        secondState = 'logged-out'
      },
      onSessionRefreshed: () => {
        secondState = 'refreshed'
      },
      sourceID: 'second-local-tab',
    })
    const secondChannel = getBroadcastChannel()

    firstChannel.emit(refreshMessage)
    firstChannel.emit(logoutMessage)
    secondChannel.emit(logoutMessage)
    secondChannel.emit(refreshMessage)

    expect(firstState).toBe('logged-out')
    expect(secondState).toBe('logged-out')
  })

  it('should converge on the fresher session when equal-time refresh and expiration arrive in opposite orders', () => {
    let firstState = 'initial'
    let secondState = 'initial'
    const refreshMessage = createMessage({
      sentAt: 550,
      session: createSession({ expirationMs: 40_000, token: 'fresh-token' }),
      sourceID: 'refresh-tab',
      type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
    })
    const expirationMessage = createMessage({
      expiredTokenAt: 30_000,
      sentAt: 550,
      sourceID: 'expiration-tab',
      type: AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED,
    })

    createSync({
      localExpirationMs: 20_000,
      onSessionExpired: () => {
        firstState = 'expired'
      },
      onSessionRefreshed: () => {
        firstState = 'refreshed'
      },
      sourceID: 'first-local-tab',
    })
    const firstChannel = getBroadcastChannel()
    createSync({
      localExpirationMs: 20_000,
      onSessionExpired: () => {
        secondState = 'expired'
      },
      onSessionRefreshed: () => {
        secondState = 'refreshed'
      },
      sourceID: 'second-local-tab',
    })
    const secondChannel = getBroadcastChannel()

    firstChannel.emit(expirationMessage)
    firstChannel.emit(refreshMessage)
    secondChannel.emit(refreshMessage)
    secondChannel.emit(expirationMessage)

    expect(firstState).toBe('refreshed')
    expect(secondState).toBe('refreshed')
  })
})

describe('createAuthSessionSync storage fallback', () => {
  it('should store only a namespaced refresh notification without session data', () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const session = createSession({ expirationMs: 20_000, token: 'sensitive-token' })
    const sync = createSync({ now: () => 123 })

    sync.publish({ session, type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED })

    const [key, value] = setItem.mock.calls[0] as [string, string]

    expect(key).toMatch(/payload.*auth.*session/i)
    expect(JSON.parse(value)).toEqual({
      affectedExpirationMs: 20_000,
      type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
      sentAt: 123,
      sourceID: 'local-tab',
    })
    expect(value).not.toContain('sensitive-token')
    expect(value).not.toContain('user')
  })

  it('should fetch the session from the shared cookie after a storage notification', async () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const fetchFullUser = vi.fn().mockResolvedValue({ status: 'indeterminate' })

    createSync({ fetchFullUser })
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const publisher = createSync({ now: () => 123, sourceID: 'remote-tab' })
    publisher.publish({
      session: createSession({ expirationMs: 20_000 }),
      type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
    })
    const [key, newValue] = setItem.mock.calls.at(-1) as [string, string]

    window.dispatchEvent(new StorageEvent('storage', { key, newValue }))
    await Promise.resolve()

    expect(fetchFullUser).toHaveBeenCalledOnce()
  })

  it('should let an equal BroadcastChannel refresh resolve a pending Storage barrier', async () => {
    const fetchFullUser = vi.fn().mockResolvedValue({ status: 'indeterminate' })
    const onSessionRefreshed = vi.fn()
    const session = createSession({ expirationMs: 30_000, token: 'remote-token' })

    createSync({ fetchFullUser, localExpirationMs: 20_000, onSessionRefreshed })
    const channel = getBroadcastChannel()

    dispatchStorageRefresh({
      affectedExpirationMs: 30_000,
      type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
      sentAt: 500,
      sourceID: 'remote-tab',
    })
    channel.emit(
      createMessage({
        sentAt: 500,
        session,
        sourceID: 'remote-tab',
        type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
      }),
    )
    await Promise.resolve()

    expect(fetchFullUser).toHaveBeenCalledOnce()
    expect(onSessionRefreshed).toHaveBeenCalledWith(session)
  })

  it('should resynchronize a settled logout after an intervening peer refresh', async () => {
    const fetchFullUser = vi.fn().mockResolvedValue({ status: 'unauthenticated' })
    let sessionCleared = true
    const onSessionLoggedOut = vi.fn()
    const onSessionRefreshed = vi.fn(() => {
      sessionCleared = false
    })
    const onSessionResyncUnauthenticated = vi.fn()
    const receiver = createSync({
      fetchFullUser,
      isSessionCleared: () => sessionCleared,
      onSessionLoggedOut,
      onSessionRefreshed,
      onSessionResyncUnauthenticated,
      sourceID: 'receiver-tab',
    })
    const receiverChannel = getBroadcastChannel()
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const publisher = createSync({ now: () => 500, sourceID: 'publisher-tab' })
    const logoutPublication = publisher.publish({
      type: AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT,
    })
    const [logoutMessage] = getBroadcastChannel().postMessage.mock.calls[0] as [
      AuthSessionSyncMessage,
    ]

    receiverChannel.emit(logoutMessage)
    receiverChannel.emit(
      createMessage({
        sentAt: 501,
        session: createSession({ expirationMs: 40_000, token: 'intervening-token' }),
        sourceID: 'peer-tab',
        type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
      }),
    )
    publisher.publishStorageRefresh(logoutPublication)
    dispatchStoredNotification(setItem)
    await Promise.resolve()

    expect(onSessionLoggedOut).toHaveBeenCalledOnce()
    expect(onSessionRefreshed).toHaveBeenCalledOnce()
    expect(fetchFullUser).toHaveBeenCalledOnce()
    expect(onSessionResyncUnauthenticated).toHaveBeenCalledOnce()

    receiver.cleanup()
  })
})

describe('createAuthSessionSync transport failures', () => {
  it('should downgrade a failed publisher and resynchronize a peer with a healthy channel', async () => {
    const fetchFullUser = vi.fn().mockResolvedValue({ status: 'indeterminate' })

    createSync({ fetchFullUser, sourceID: 'storage-peer' })
    const addEventListener = vi.spyOn(window, 'addEventListener')
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const publisher = createSync({ sourceID: 'channel-publisher' })
    const failedChannel = getBroadcastChannel()
    failedChannel.postMessage.mockImplementationOnce(() => {
      throw new Error('channel closed')
    })

    publisher.publish({
      session: createSession({ expirationMs: 20_000 }),
      type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
    })

    expect(failedChannel.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    expect(failedChannel.close).toHaveBeenCalledOnce()
    expect(addEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
    expect(setItem).toHaveBeenCalledOnce()

    const [key, newValue] = setItem.mock.calls[0] as [string, string]

    window.dispatchEvent(new StorageEvent('storage', { key, newValue }))
    await Promise.resolve()

    expect(fetchFullUser).toHaveBeenCalledOnce()
  })
})

describe('createAuthSessionSync cleanup', () => {
  it('should invalidate a pending Storage resync during cleanup', async () => {
    let resolveFetchFullUser: ((result: AuthSessionResyncResult) => void) | undefined
    const fetchFullUser = vi.fn(
      () =>
        new Promise<AuthSessionResyncResult>((resolve) => {
          resolveFetchFullUser = resolve
        }),
    )
    const onSessionResyncUnauthenticated = vi.fn()
    const sync = createSync({ fetchFullUser, onSessionResyncUnauthenticated })

    dispatchStorageRefresh({
      affectedExpirationMs: 40_000,
      type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
      sentAt: 500,
      sourceID: 'remote-tab',
    })
    sync.cleanup()
    resolveFetchFullUser?.({ status: 'unauthenticated' })
    await Promise.resolve()

    expect(onSessionResyncUnauthenticated).not.toHaveBeenCalled()
  })
})

describe('AuthProvider session synchronization', () => {
  it('should publish a refresh after refreshCookie succeeds', async () => {
    vi.useFakeTimers()
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    const refreshedSession = createFutureSession({ expiresInMs: 120_000, token: 'fresh-token' })

    await renderProvider({ session: initialSession })
    apiMocks.post.mockResolvedValueOnce(createResponse({ session: refreshedSession }))
    const channel = getBroadcastChannel()
    channel.postMessage.mockClear()

    act(() => authContext?.refreshCookie(true))
    await act(async () => vi.advanceTimersByTimeAsync(1_000))

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

  it('should coalesce refresh requests before successful responses can settle in reverse', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    const firstSession = createFutureSession({ expiresInMs: 120_000, token: 'first-token' })
    const secondSession = createFutureSession({ expiresInMs: 180_000, token: 'second-token' })
    let resolveFirstRefresh: ((value: ReturnType<typeof createResponse>) => void) | undefined
    let resolveSecondRefresh: ((value: ReturnType<typeof createResponse>) => void) | undefined
    const firstResponse = new Promise<ReturnType<typeof createResponse>>((resolve) => {
      resolveFirstRefresh = resolve
    })
    const secondResponse = new Promise<ReturnType<typeof createResponse>>((resolve) => {
      resolveSecondRefresh = resolve
    })

    await renderProvider({ session: initialSession })
    apiMocks.post.mockReturnValueOnce(firstResponse).mockReturnValueOnce(secondResponse)

    const firstRefresh = authContext?.refreshCookieAsync()
    const secondRefresh = authContext?.refreshCookieAsync()

    resolveSecondRefresh?.(createResponse({ session: secondSession }))
    resolveFirstRefresh?.(createResponse({ session: firstSession }))
    await act(async () => {
      await Promise.all([firstRefresh, secondRefresh])
    })

    expect(apiMocks.post).toHaveBeenCalledOnce()
    expect(authContext?.token).toBe('first-token')
    expect(authContext?.tokenExpirationMs).toBe(firstSession.exp * 1000)
  })

  it('should ignore a deferred refreshCookie success after remote expiration', async () => {
    vi.useFakeTimers()
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    const staleResponseSession = createFutureSession({ expiresInMs: 120_000, token: 'stale-token' })
    let resolveRefresh: ((value: ReturnType<typeof createResponse>) => void) | undefined
    const refreshResponse = new Promise<ReturnType<typeof createResponse>>((resolve) => {
      resolveRefresh = resolve
    })

    await renderProvider({ session: initialSession })
    apiMocks.post.mockReturnValueOnce(refreshResponse)
    const channel = getBroadcastChannel()
    channel.postMessage.mockClear()

    act(() => authContext?.refreshCookie(true))
    act(() => vi.advanceTimersByTime(1_000))
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

    dispatchStorageRefresh({
      affectedExpirationMs: firstSession.exp * 1000,
      type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
      sentAt: 500,
      sourceID: 'remote-a',
    })
    await act(async () => Promise.resolve())

    expect(apiMocks.get).toHaveBeenCalledOnce()

    dispatchStorageRefresh({
      affectedExpirationMs: secondSession.exp * 1000,
      type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
      sentAt: 600,
      sourceID: 'remote-b',
    })

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
    const initialSession = createFutureSession({ expiresInMs: 300_000, token: 'initial-token' })

    await renderProvider({ session: initialSession })
    const channel = getBroadcastChannel()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000)
      window.dispatchEvent(new MouseEvent('mousemove'))
      await vi.advanceTimersByTimeAsync(60_000)
      channel.emit(
        createMessage({
          session: createFutureSession({ expiresInMs: 300_000, token: 'remote-token' }),
          sourceID: 'remote-tab',
          type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
        }),
      )
      await vi.advanceTimersByTimeAsync(1_001)
    })

    expect(apiMocks.post).not.toHaveBeenCalled()
  })

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
    dispatchStorageRefresh({
      affectedExpirationMs: 0,
      type: AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT,
      sentAt: 600,
      settlesSentAt: 500,
      sourceID: 'remote-tab',
    })
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
    dispatchStorageRefresh({
      affectedExpirationMs: 0,
      type: AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT,
      sentAt: 600,
      settlesSentAt: 500,
      sourceID: 'remote-tab',
    })
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(apiMocks.get).toHaveBeenCalledOnce()
    expect(authContext?.token).toBe('surviving-token')
    expect(authContext?.user).toEqual(initialSession.user)
    expect(routerMocks.replace).not.toHaveBeenCalled()
  })

  it('should not commit or navigate for a Storage response after provider unmount', async () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    let resolveFetch: ((value: ReturnType<typeof createResponse>) => void) | undefined
    const fetchResponse = new Promise<ReturnType<typeof createResponse>>((resolve) => {
      resolveFetch = resolve
    })

    await renderProvider({ session: initialSession })
    apiMocks.get.mockClear()
    apiMocks.get.mockReturnValueOnce(fetchResponse)
    dispatchStorageRefresh({
      affectedExpirationMs: 0,
      type: AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT,
      sentAt: 900,
      sourceID: 'remote-tab',
    })
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

function createMessage(
  message:
    | (Omit<
        Extract<AuthSessionSyncMessage, { type: typeof AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED }>,
        'sentAt'
      > & {
        sentAt?: number
      })
    | (Omit<
        Extract<AuthSessionSyncMessage, { type: typeof AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT }>,
        'sentAt'
      > & {
        sentAt?: number
      })
    | (Omit<
        Extract<AuthSessionSyncMessage, { type: typeof AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED }>,
        'sentAt'
      > & {
        sentAt?: number
      }),
): AuthSessionSyncMessage {
  const { sentAt = 100, ...messageWithoutTimestamp } = message

  return { ...messageWithoutTimestamp, sentAt } as AuthSessionSyncMessage
}

function dispatchStorageRefresh({
  affectedExpirationMs,
  sentAt,
  settlesSentAt,
  sourceID,
  type,
}: {
  affectedExpirationMs: number
  sentAt: number
  settlesSentAt?: number
  sourceID: string
  type: AuthSessionSyncEventType
}): void {
  const notification =
    type === AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT
      ? {
          affectedExpirationMs,
          sentAt,
          settlesSentAt: settlesSentAt ?? sentAt - 1,
          sourceID,
          type,
        }
      : { affectedExpirationMs, sentAt, sourceID, type }

  act(() => {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'payload:auth-session:refresh',
        newValue: JSON.stringify(notification),
      }),
    )
  })
}

function dispatchStoredNotification(setItem: {
  mock: { calls: Array<[key: string, value: string]> }
}): void {
  const [key, newValue] = setItem.mock.calls.at(-1) as [string, string]

  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key, newValue }))
  })
}

function createResponse({ session }: { session: UserWithToken }) {
  return {
    json: async () => session,
    status: 200,
  }
}

function createSession({
  expirationMs,
  token = 'token',
}: {
  expirationMs: number
  token?: string
}): UserWithToken {
  return {
    exp: expirationMs / 1000,
    token,
    user: { collection: 'users', id: '1' },
  }
}

function createFutureSession({
  expiresInMs,
  token,
}: {
  expiresInMs: number
  token: string
}): UserWithToken {
  return createSession({
    expirationMs: Math.floor((Date.now() + expiresInMs) / 1000) * 1000,
    token,
  })
}

function createSync({
  fetchFullUser = vi.fn().mockResolvedValue({ status: 'indeterminate' } as const),
  isSessionCleared = () => true,
  localExpirationMs,
  now,
  onSessionExpired = vi.fn(),
  onSessionLoggedOut = vi.fn(),
  onSessionRefreshed = vi.fn(),
  onSessionResyncUnauthenticated = vi.fn(),
  sourceID = 'local-tab',
}: {
  fetchFullUser?: () => Promise<AuthSessionResyncResult>
  isSessionCleared?: () => boolean
  localExpirationMs?: number
  now?: () => number
  onSessionExpired?: (expiredTokenAt: number) => void
  onSessionLoggedOut?: () => void
  onSessionRefreshed?: (session: UserWithToken) => void
  onSessionResyncUnauthenticated?: () => void
  sourceID?: string
} = {}) {
  const sync = createAuthSessionSync({
    fetchFullUser,
    getTokenExpirationMs: () => localExpirationMs,
    isSessionCleared,
    now,
    onSessionExpired,
    onSessionLoggedOut,
    onSessionRefreshed,
    onSessionResyncUnauthenticated,
    sourceID,
  })

  sessionSyncCleanups.push(sync.cleanup)

  return sync
}

function getBroadcastChannel(): MockBroadcastChannel {
  const channel = MockBroadcastChannel.instances.at(-1)

  if (!channel) {
    throw new Error('Expected a BroadcastChannel instance')
  }

  return channel
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

class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = []

  close = vi.fn()
  listeners = new Set<(event: MessageEvent<AuthSessionSyncMessage>) => void>()
  name: string
  postMessage = vi.fn()
  removeEventListener = vi.fn(
    (_type: string, listener: (event: MessageEvent<AuthSessionSyncMessage>) => void) => {
      this.listeners.delete(listener)
    },
  )
  addEventListener = vi.fn(
    (_type: string, listener: (event: MessageEvent<AuthSessionSyncMessage>) => void) => {
      this.listeners.add(listener)
    },
  )

  constructor(name: string) {
    this.name = name
    MockBroadcastChannel.instances.push(this)
  }

  emit(message: AuthSessionSyncMessage) {
    for (const listener of this.listeners) {
      listener(new MessageEvent('message', { data: message }))
    }
  }
}
