// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthContext, UserWithToken } from './index.js'
import type { AuthSessionResyncResult, AuthSessionSyncMessage } from './sessionSync.js'

import { AuthProvider, useAuth } from './index.js'
import { createAuthSessionSync } from './sessionSync.js'
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

    sync.publish({ session, type: 'session-refreshed' })

    expect(getBroadcastChannel().postMessage).toHaveBeenCalledWith({
      session,
      sourceID: 'local-tab',
      sentAt: 123,
      type: 'session-refreshed',
    })
  })

  it('should publish expired sessions with the handled expiration', () => {
    const sync = createSync({ now: () => 456 })

    sync.publish({ expiredTokenAt: 20_000, type: 'session-expired' })

    expect(getBroadcastChannel().postMessage).toHaveBeenCalledWith({
      expiredTokenAt: 20_000,
      sourceID: 'local-tab',
      sentAt: 456,
      type: 'session-expired',
    })
  })

  it('should publish explicit logout events', () => {
    const sync = createSync({ now: () => 789 })

    sync.publish({ type: 'session-logged-out' })

    expect(getBroadcastChannel().postMessage).toHaveBeenCalledWith({
      sourceID: 'local-tab',
      sentAt: 789,
      type: 'session-logged-out',
    })
  })
})

describe('createAuthSessionSync receiving', () => {
  it('should apply a newer refreshed session', () => {
    const onSessionRefreshed = vi.fn()
    const session = createSession({ expirationMs: 30_000, token: 'remote-token' })

    createSync({ localExpirationMs: 20_000, onSessionRefreshed })
    getBroadcastChannel().emit(
      createMessage({ session, sourceID: 'remote-tab', type: 'session-refreshed' }),
    )

    expect(onSessionRefreshed).toHaveBeenCalledWith(session)
  })

  it('should apply a valid remote expiration', () => {
    const onSessionExpired = vi.fn()

    createSync({ localExpirationMs: 20_000, onSessionExpired })
    getBroadcastChannel().emit(
      createMessage({ expiredTokenAt: 20_000, sourceID: 'remote-tab', type: 'session-expired' }),
    )

    expect(onSessionExpired).toHaveBeenCalledWith(20_000)
  })

  it('should apply a remote explicit logout', () => {
    const onSessionLoggedOut = vi.fn()

    createSync({ onSessionLoggedOut })
    getBroadcastChannel().emit(
      createMessage({ sourceID: 'remote-tab', type: 'session-logged-out' }),
    )

    expect(onSessionLoggedOut).toHaveBeenCalledOnce()
  })

  it('should ignore messages from the current tab', () => {
    const onSessionExpired = vi.fn()
    const onSessionLoggedOut = vi.fn()
    const onSessionRefreshed = vi.fn()

    createSync({ onSessionExpired, onSessionLoggedOut, onSessionRefreshed })
    const channel = getBroadcastChannel()
    channel.emit(
      createMessage({
        session: createSession({ expirationMs: 30_000 }),
        sourceID: 'local-tab',
        type: 'session-refreshed',
      }),
    )
    channel.emit(
      createMessage({
        expiredTokenAt: 30_000,
        sourceID: 'local-tab',
        type: 'session-expired',
      }),
    )
    channel.emit(createMessage({ sourceID: 'local-tab', type: 'session-logged-out' }))

    expect(onSessionRefreshed).not.toHaveBeenCalled()
    expect(onSessionExpired).not.toHaveBeenCalled()
    expect(onSessionLoggedOut).not.toHaveBeenCalled()
  })

  it('should ignore a refreshed session older than the local expiration', () => {
    const onSessionRefreshed = vi.fn()

    createSync({ localExpirationMs: 40_000, onSessionRefreshed })
    getBroadcastChannel().emit(
      createMessage({
        session: createSession({ expirationMs: 30_000 }),
        sourceID: 'remote-tab',
        type: 'session-refreshed',
      }),
    )

    expect(onSessionRefreshed).not.toHaveBeenCalled()
  })

  it('should ignore expiration for a token newer than the handled expiration', () => {
    const onSessionExpired = vi.fn()

    createSync({ localExpirationMs: 40_000, onSessionExpired })
    getBroadcastChannel().emit(
      createMessage({ expiredTokenAt: 30_000, sourceID: 'remote-tab', type: 'session-expired' }),
    )

    expect(onSessionExpired).not.toHaveBeenCalled()
  })

  it('should ignore a stale refresh after a newer expiration', () => {
    const onSessionExpired = vi.fn()
    const onSessionRefreshed = vi.fn()

    createSync({ localExpirationMs: 20_000, onSessionExpired, onSessionRefreshed })
    const channel = getBroadcastChannel()
    channel.emit(
      createMessage({
        expiredTokenAt: 20_000,
        sentAt: 200,
        sourceID: 'remote-a',
        type: 'session-expired',
      }),
    )
    channel.emit(
      createMessage({
        sentAt: 100,
        session: createSession({ expirationMs: 30_000 }),
        sourceID: 'remote-b',
        type: 'session-refreshed',
      }),
    )

    expect(onSessionExpired).toHaveBeenCalledOnce()
    expect(onSessionRefreshed).not.toHaveBeenCalled()
  })

  it('should ignore a stale refresh after a newer logout', () => {
    const onSessionLoggedOut = vi.fn()
    const onSessionRefreshed = vi.fn()

    createSync({ localExpirationMs: 20_000, onSessionLoggedOut, onSessionRefreshed })
    const channel = getBroadcastChannel()
    channel.emit(createMessage({ sentAt: 300, sourceID: 'remote-a', type: 'session-logged-out' }))
    channel.emit(
      createMessage({
        sentAt: 200,
        session: createSession({ expirationMs: 30_000 }),
        sourceID: 'remote-b',
        type: 'session-refreshed',
      }),
    )

    expect(onSessionLoggedOut).toHaveBeenCalledOnce()
    expect(onSessionRefreshed).not.toHaveBeenCalled()
  })

  it('should ignore a stale destructive event after a newer accepted refresh', () => {
    const onSessionLoggedOut = vi.fn()
    const onSessionRefreshed = vi.fn()
    const session = createSession({ expirationMs: 30_000 })

    createSync({ localExpirationMs: 20_000, onSessionLoggedOut, onSessionRefreshed })
    const channel = getBroadcastChannel()
    channel.emit(
      createMessage({ sentAt: 400, session, sourceID: 'remote-a', type: 'session-refreshed' }),
    )
    channel.emit(createMessage({ sentAt: 300, sourceID: 'remote-b', type: 'session-logged-out' }))

    expect(onSessionRefreshed).toHaveBeenCalledWith(session)
    expect(onSessionLoggedOut).not.toHaveBeenCalled()
  })

  it('should ignore a stale expiration after a newer accepted refresh', () => {
    const onSessionExpired = vi.fn()
    const onSessionRefreshed = vi.fn()
    const session = createSession({ expirationMs: 30_000 })

    createSync({ localExpirationMs: 20_000, onSessionExpired, onSessionRefreshed })
    const channel = getBroadcastChannel()
    channel.emit(
      createMessage({ sentAt: 400, session, sourceID: 'remote-a', type: 'session-refreshed' }),
    )
    channel.emit(
      createMessage({
        expiredTokenAt: 40_000,
        sentAt: 300,
        sourceID: 'remote-b',
        type: 'session-expired',
      }),
    )

    expect(onSessionRefreshed).toHaveBeenCalledWith(session)
    expect(onSessionExpired).not.toHaveBeenCalled()
  })

  it('should ignore a remote event older than a locally published lifecycle event', () => {
    const onSessionLoggedOut = vi.fn()
    const sync = createSync({ now: () => 500, onSessionLoggedOut })

    sync.publish({
      session: createSession({ expirationMs: 30_000 }),
      type: 'session-refreshed',
    })
    getBroadcastChannel().emit(
      createMessage({ sentAt: 400, sourceID: 'remote-tab', type: 'session-logged-out' }),
    )

    expect(onSessionLoggedOut).not.toHaveBeenCalled()
  })

  it('should converge on a destructive event when equal-time events arrive in opposite orders', () => {
    let firstState = 'initial'
    let secondState = 'initial'
    const refreshedSession = createSession({ expirationMs: 30_000, token: 'refreshed-token' })
    const refreshMessage = createMessage({
      sentAt: 500,
      session: refreshedSession,
      sourceID: 'refresh-tab',
      type: 'session-refreshed',
    })
    const logoutMessage = createMessage({
      sentAt: 500,
      sourceID: 'logout-tab',
      type: 'session-logged-out',
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

  it('should converge on the source ID winner for equal-time refreshes', () => {
    let firstToken: string | undefined
    let secondToken: string | undefined
    const lowerSourceMessage = createMessage({
      sentAt: 600,
      session: createSession({ expirationMs: 30_000, token: 'lower-source-token' }),
      sourceID: 'source-a',
      type: 'session-refreshed',
    })
    const higherSourceMessage = createMessage({
      sentAt: 600,
      session: createSession({ expirationMs: 30_000, token: 'higher-source-token' }),
      sourceID: 'source-z',
      type: 'session-refreshed',
    })

    createSync({
      onSessionRefreshed: (session) => {
        firstToken = session.token
      },
      sourceID: 'first-local-tab',
    })
    const firstChannel = getBroadcastChannel()
    createSync({
      onSessionRefreshed: (session) => {
        secondToken = session.token
      },
      sourceID: 'second-local-tab',
    })
    const secondChannel = getBroadcastChannel()

    firstChannel.emit(lowerSourceMessage)
    firstChannel.emit(higherSourceMessage)
    secondChannel.emit(higherSourceMessage)
    secondChannel.emit(lowerSourceMessage)

    expect(firstToken).toBe('higher-source-token')
    expect(secondToken).toBe('higher-source-token')
  })

  it('should reject non-finite lifecycle metadata', () => {
    const onSessionExpired = vi.fn()
    const onSessionLoggedOut = vi.fn()
    const onSessionRefreshed = vi.fn()

    createSync({ onSessionExpired, onSessionLoggedOut, onSessionRefreshed })
    const channel = getBroadcastChannel()
    channel.emit(
      createMessage({
        sentAt: Number.NaN,
        sourceID: 'remote-a',
        type: 'session-logged-out',
      }),
    )
    channel.emit(
      createMessage({
        expiredTokenAt: Number.POSITIVE_INFINITY,
        sentAt: 700,
        sourceID: 'remote-b',
        type: 'session-expired',
      }),
    )
    channel.emit(
      createMessage({
        sentAt: 800,
        session: createSession({ expirationMs: Number.NEGATIVE_INFINITY }),
        sourceID: 'remote-c',
        type: 'session-refreshed',
      }),
    )

    expect(onSessionLoggedOut).not.toHaveBeenCalled()
    expect(onSessionExpired).not.toHaveBeenCalled()
    expect(onSessionRefreshed).not.toHaveBeenCalled()
  })
})

describe('createAuthSessionSync storage fallback', () => {
  it('should store only a namespaced refresh notification without session data', () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const session = createSession({ expirationMs: 20_000, token: 'sensitive-token' })
    const sync = createSync({ now: () => 123 })

    sync.publish({ session, type: 'session-refreshed' })

    const [key, value] = setItem.mock.calls[0] as [string, string]

    expect(key).toMatch(/payload.*auth.*session/i)
    expect(JSON.parse(value)).toEqual({ sentAt: 123, sourceID: 'local-tab' })
    expect(value).not.toContain('sensitive-token')
    expect(value).not.toContain('user')
  })

  it('should fetch the session from the shared cookie after a storage notification', async () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const fetchFullUser = vi.fn().mockResolvedValue({ status: 'indeterminate' })

    createSync({ fetchFullUser })
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const publisher = createSync({ now: () => 123, sourceID: 'remote-tab' })
    publisher.publishStorageRefresh()
    const [key, newValue] = setItem.mock.calls.at(-1) as [string, string]

    window.dispatchEvent(new StorageEvent('storage', { key, newValue }))
    await Promise.resolve()

    expect(fetchFullUser).toHaveBeenCalledOnce()
  })

  it('should defer the storage logout notification until post-settlement resync', () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const sync = createSync()

    sync.publish({ type: 'session-logged-out' })

    expect(setItem).not.toHaveBeenCalled()

    sync.publishStorageRefresh()

    expect(setItem).toHaveBeenCalledOnce()
  })

  it('should recover the post-settlement logout state from the shared cookie', async () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const session = createSession({ expirationMs: 20_000 })
    let receivedSession: null | UserWithToken = session
    let sharedCookieSession: null | UserWithToken = session
    const fetchFullUser = vi.fn(async () => {
      receivedSession = sharedCookieSession

      return receivedSession
        ? { status: 'authenticated' as const, user: receivedSession.user }
        : { status: 'unauthenticated' as const }
    })

    createSync({ fetchFullUser })
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const publisher = createSync({ sourceID: 'remote-tab' })
    publisher.publish({ type: 'session-logged-out' })

    expect(fetchFullUser).not.toHaveBeenCalled()
    expect(receivedSession).toBe(session)

    sharedCookieSession = null
    publisher.publishStorageRefresh()
    const [key, newValue] = setItem.mock.calls.at(-1) as [string, string]
    window.dispatchEvent(new StorageEvent('storage', { key, newValue }))
    await Promise.resolve()

    expect(fetchFullUser).toHaveBeenCalledOnce()
    expect(receivedSession).toBeNull()
  })
})

describe('createAuthSessionSync transport failures', () => {
  it('should fall back to storage when BroadcastChannel construction fails', () => {
    class ThrowingBroadcastChannel {
      constructor() {
        throw new Error('channel unavailable')
      }
    }

    vi.stubGlobal('BroadcastChannel', ThrowingBroadcastChannel)
    const addEventListener = vi.spyOn(window, 'addEventListener')
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    const sync = createSync()
    sync.publish({
      session: createSession({ expirationMs: 20_000 }),
      type: 'session-refreshed',
    })

    expect(addEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
    expect(setItem).toHaveBeenCalledOnce()
  })

  it('should not throw when BroadcastChannel publication fails', () => {
    const sync = createSync()
    getBroadcastChannel().postMessage.mockImplementation(() => {
      throw new Error('channel closed')
    })

    expect(() => sync.publish({ type: 'session-logged-out' })).not.toThrow()
  })

  it('should downgrade a failed channel and resynchronize a storage peer', async () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const fetchFullUser = vi.fn().mockResolvedValue({ status: 'indeterminate' })

    createSync({ fetchFullUser, sourceID: 'storage-peer' })
    vi.stubGlobal('BroadcastChannel', MockBroadcastChannel)
    const addEventListener = vi.spyOn(window, 'addEventListener')
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const publisher = createSync({ sourceID: 'channel-publisher' })
    const failedChannel = getBroadcastChannel()
    failedChannel.postMessage.mockImplementationOnce(() => {
      throw new Error('channel closed')
    })

    publisher.publish({
      session: createSession({ expirationMs: 20_000 }),
      type: 'session-refreshed',
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

  it('should install and remove the storage listener exactly once after channel failure', () => {
    const addEventListener = vi.spyOn(window, 'addEventListener')
    const removeEventListener = vi.spyOn(window, 'removeEventListener')
    const sync = createSync()
    const failedChannel = getBroadcastChannel()
    failedChannel.postMessage.mockImplementationOnce(() => {
      throw new Error('channel closed')
    })

    sync.publish({
      session: createSession({ expirationMs: 20_000 }),
      type: 'session-refreshed',
    })
    sync.publish({
      session: createSession({ expirationMs: 30_000 }),
      type: 'session-refreshed',
    })
    sync.cleanup()

    expect(addEventListener).toHaveBeenCalledTimes(1)
    expect(removeEventListener).toHaveBeenCalledTimes(1)
    expect(removeEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
  })

  it('should preserve local auth when the downgrade listener cannot be installed', () => {
    const sync = createSync()
    const failedChannel = getBroadcastChannel()
    failedChannel.postMessage.mockImplementationOnce(() => {
      throw new Error('channel closed')
    })
    vi.spyOn(window, 'addEventListener').mockImplementationOnce(() => {
      throw new Error('storage events unavailable')
    })

    expect(() =>
      sync.publish({
        session: createSession({ expirationMs: 20_000 }),
        type: 'session-refreshed',
      }),
    ).not.toThrow()
  })

  it('should not throw when storage publication fails', () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const sync = createSync()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage denied')
    })

    expect(() =>
      sync.publish({
        session: createSession({ expirationMs: 20_000 }),
        type: 'session-refreshed',
      }),
    ).not.toThrow()
  })
})

describe('createAuthSessionSync cleanup', () => {
  it('should remove the channel listener and close the channel', () => {
    const sync = createSync()
    const channel = getBroadcastChannel()

    sync.cleanup()

    expect(channel.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    expect(channel.close).toHaveBeenCalledOnce()
  })

  it('should remove the storage listener', () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const removeEventListener = vi.spyOn(window, 'removeEventListener')
    const sync = createSync()

    sync.cleanup()

    expect(removeEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
  })
})

describe('AuthProvider session synchronization', () => {
  it('should keep one source ID for the provider lifetime', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    const firstRefresh = createFutureSession({ expiresInMs: 120_000, token: 'first-token' })
    const secondRefresh = createFutureSession({ expiresInMs: 180_000, token: 'second-token' })

    await renderProvider({ session: initialSession })
    apiMocks.post
      .mockResolvedValueOnce(createResponse({ session: firstRefresh }))
      .mockResolvedValueOnce(createResponse({ session: secondRefresh }))
    const channel = getBroadcastChannel()

    await act(async () => {
      await authContext?.refreshCookieAsync()
      await authContext?.refreshCookieAsync()
    })
    const sourceIDs = channel.postMessage.mock.calls.map(
      ([message]: [AuthSessionSyncMessage]) => message.sourceID,
    )

    expect(new Set(sourceIDs).size).toBe(1)
  })

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
      expect.objectContaining({ session: refreshedSession, type: 'session-refreshed' }),
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
      expect.objectContaining({ session: refreshedSession, type: 'session-refreshed' }),
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

  it('should ignore a sibling refresh rejection after a successful coalesced refresh', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    const refreshedSession = createFutureSession({ expiresInMs: 120_000, token: 'fresh-token' })
    let resolveSuccess: ((value: ReturnType<typeof createResponse>) => void) | undefined
    let resolveFailure: ((value: { status: number }) => void) | undefined
    const successResponse = new Promise<ReturnType<typeof createResponse>>((resolve) => {
      resolveSuccess = resolve
    })
    const failureResponse = new Promise<{ status: number }>((resolve) => {
      resolveFailure = resolve
    })

    await renderProvider({ session: initialSession })
    apiMocks.post.mockReturnValueOnce(successResponse).mockReturnValueOnce(failureResponse)
    const firstRefresh = authContext?.refreshCookieAsync()
    const secondRefresh = authContext?.refreshCookieAsync()

    resolveSuccess?.(createResponse({ session: refreshedSession }))
    await act(async () => {
      await firstRefresh
    })
    resolveFailure?.({ status: 401 })
    await act(async () => {
      await secondRefresh
    })

    expect(apiMocks.post).toHaveBeenCalledOnce()
    expect(authContext?.token).toBe('fresh-token')
    expect(routerMocks.replace).not.toHaveBeenCalled()
  })

  it('should ignore a sibling refresh success after a valid coalesced rejection', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    const staleSession = createFutureSession({ expiresInMs: 120_000, token: 'stale-token' })
    let resolveFailure: ((value: { status: number }) => void) | undefined
    let resolveSuccess: ((value: ReturnType<typeof createResponse>) => void) | undefined
    const failureResponse = new Promise<{ status: number }>((resolve) => {
      resolveFailure = resolve
    })
    const successResponse = new Promise<ReturnType<typeof createResponse>>((resolve) => {
      resolveSuccess = resolve
    })

    await renderProvider({ session: initialSession })
    apiMocks.post.mockReturnValueOnce(failureResponse).mockReturnValueOnce(successResponse)
    const firstRefresh = authContext?.refreshCookieAsync()
    const secondRefresh = authContext?.refreshCookieAsync()

    resolveFailure?.({ status: 401 })
    await act(async () => {
      await firstRefresh
    })
    resolveSuccess?.(createResponse({ session: staleSession }))
    await act(async () => {
      await secondRefresh
    })

    expect(apiMocks.post).toHaveBeenCalledOnce()
    expect(authContext?.user).toBeNull()
    expect(authContext?.token).toBeUndefined()
    expect(routerMocks.replace).toHaveBeenCalledWith(expect.stringContaining('/logout-inactivity'))
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
          type: 'session-expired',
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
      expect.objectContaining({ type: 'session-refreshed' }),
    )
  })

  it('should ignore a deferred refreshCookieAsync success after remote logout', async () => {
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

    const refreshPromise = authContext?.refreshCookieAsync()
    await act(async () => {
      channel.emit(
        createMessage({ sentAt: 300, sourceID: 'remote-tab', type: 'session-logged-out' }),
      )
    })
    resolveRefresh?.(createResponse({ session: staleResponseSession }))
    await act(async () => {
      await refreshPromise
    })

    expect(authContext?.user).toBeNull()
    expect(authContext?.token).toBeUndefined()
    expect(channel.postMessage).not.toHaveBeenCalled()
  })

  it('should ignore a deferred fetchFullUser success after a newer remote refresh', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    const staleResponseSession = createFutureSession({ expiresInMs: 120_000, token: 'stale-token' })
    const remoteSession = createFutureSession({ expiresInMs: 180_000, token: 'remote-token' })
    let resolveFetch: ((value: ReturnType<typeof createResponse>) => void) | undefined
    const fetchResponse = new Promise<ReturnType<typeof createResponse>>((resolve) => {
      resolveFetch = resolve
    })

    await renderProvider({ session: initialSession })
    apiMocks.get.mockReturnValueOnce(fetchResponse)
    const channel = getBroadcastChannel()

    const fetchPromise = authContext?.fetchFullUser()
    await act(async () => {
      channel.emit(
        createMessage({
          sentAt: 400,
          session: remoteSession,
          sourceID: 'remote-tab',
          type: 'session-refreshed',
        }),
      )
    })
    resolveFetch?.(createResponse({ session: staleResponseSession }))
    await act(async () => {
      await fetchPromise
    })

    expect(authContext?.token).toBe('remote-token')
    expect(authContext?.tokenExpirationMs).toBe(remoteSession.exp * 1000)
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

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'payload:auth-session:refresh',
          newValue: JSON.stringify({ sentAt: 500, sourceID: 'remote-a' }),
        }),
      )
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'payload:auth-session:refresh',
          newValue: JSON.stringify({ sentAt: 600, sourceID: 'remote-b' }),
        }),
      )
    })

    expect(apiMocks.get).toHaveBeenCalledTimes(2)

    resolveFirstFetch?.(createResponse({ session: firstSession }))
    await act(async () => {
      await firstResponse
      await Promise.resolve()
    })

    expect(authContext?.token).toBe('first-token')

    resolveSecondFetch?.(createResponse({ session: secondSession }))
    await act(async () => {
      await secondResponse
      await Promise.resolve()
    })

    expect(authContext?.token).toBe('second-token')
    expect(authContext?.tokenExpirationMs).toBe(secondSession.exp * 1000)
  })

  it('should apply storage-triggered user responses in reverse settlement order', async () => {
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

    dispatchStorageRefresh({ sentAt: 700, sourceID: 'remote-a' })
    dispatchStorageRefresh({ sentAt: 800, sourceID: 'remote-b' })

    resolveSecondFetch?.(createResponse({ session: secondSession }))
    await act(async () => {
      await secondResponse
      await Promise.resolve()
    })
    resolveFirstFetch?.(createResponse({ session: firstSession }))
    await act(async () => {
      await firstResponse
      await Promise.resolve()
    })

    expect(authContext?.token).toBe('first-token')
    expect(authContext?.tokenExpirationMs).toBe(firstSession.exp * 1000)
  })

  it('should preserve a refreshed session when an older user request confirms no user', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    const refreshedSession = createFutureSession({ expiresInMs: 120_000, token: 'fresh-token' })
    let resolveFetch: ((value: ReturnType<typeof createResponse>) => void) | undefined
    const fetchResponse = new Promise<ReturnType<typeof createResponse>>((resolve) => {
      resolveFetch = resolve
    })

    await renderProvider({ session: initialSession })
    apiMocks.get.mockReturnValueOnce(fetchResponse)
    apiMocks.post.mockResolvedValueOnce(createResponse({ session: refreshedSession }))
    const fetchPromise = authContext?.fetchFullUser()

    await act(async () => {
      await authContext?.refreshCookieAsync()
    })
    resolveFetch?.(createResponse({ session: { exp: 0, user: null } as unknown as UserWithToken }))
    await act(async () => {
      await fetchPromise
    })

    expect(authContext?.token).toBe('fresh-token')
    expect(routerMocks.replace).not.toHaveBeenCalled()
  })

  it('should ignore a refresh success after a user request confirms no user', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    const staleSession = createFutureSession({ expiresInMs: 120_000, token: 'stale-token' })
    let resolveRefresh: ((value: ReturnType<typeof createResponse>) => void) | undefined
    const refreshResponse = new Promise<ReturnType<typeof createResponse>>((resolve) => {
      resolveRefresh = resolve
    })

    await renderProvider({ session: initialSession })
    apiMocks.post.mockReturnValueOnce(refreshResponse)
    apiMocks.get.mockResolvedValueOnce(
      createResponse({ session: { exp: 0, user: null } as unknown as UserWithToken }),
    )
    const refreshPromise = authContext?.refreshCookieAsync()

    await act(async () => {
      await authContext?.fetchFullUser()
    })
    resolveRefresh?.(createResponse({ session: staleSession }))
    await act(async () => {
      await refreshPromise
    })

    expect(authContext?.user).toBeNull()
    expect(authContext?.token).toBeUndefined()
  })

  it('should preserve the current session when fetching the user returns 500', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })

    await renderProvider({ session: initialSession })
    apiMocks.get.mockResolvedValueOnce({ status: 500 })

    await act(async () => {
      await authContext?.fetchFullUser()
    })

    expect(authContext?.user).toEqual(initialSession.user)
    expect(authContext?.token).toBe('initial-token')
  })

  it('should leave authenticated UI after storage resync confirms no user', async () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })

    await renderProvider({ session: initialSession })
    apiMocks.get.mockResolvedValueOnce(
      createResponse({ session: { exp: 0, user: null } as unknown as UserWithToken }),
    )

    dispatchStorageRefresh({ sentAt: 900, sourceID: 'remote-tab' })
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(authContext?.user).toBeNull()
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
          type: 'session-refreshed',
        }),
      )
    })

    expect(authContext?.token).toBe('remote-token')
    expect(channel.postMessage).not.toHaveBeenCalled()
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
        type: 'session-expired',
      }),
    )
  })

  it('should ignore a stale refresh rejection after a newer session arrives', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    const remoteSession = createFutureSession({ expiresInMs: 120_000, token: 'remote-token' })
    let resolveRefresh: ((value: { status: number }) => void) | undefined
    const refreshResponse = new Promise<{ status: number }>((resolve) => {
      resolveRefresh = resolve
    })

    await renderProvider({ session: initialSession })
    apiMocks.post.mockReturnValueOnce(refreshResponse)
    const channel = getBroadcastChannel()
    channel.postMessage.mockClear()

    const refreshPromise = authContext?.refreshCookieAsync()

    await act(async () => {
      channel.emit(
        createMessage({
          session: remoteSession,
          sourceID: 'remote-tab',
          type: 'session-refreshed',
        }),
      )
    })
    resolveRefresh?.({ status: 401 })
    await act(async () => {
      await refreshPromise
    })

    expect(authContext?.token).toBe('remote-token')
    expect(routerMocks.replace).not.toHaveBeenCalled()
    expect(channel.postMessage).not.toHaveBeenCalled()
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
        type: 'session-expired',
      }),
    )
    expect(routerMocks.replace).toHaveBeenCalledWith(expect.stringContaining('/logout-inactivity'))
  })

  it('should clear local auth and navigate after a valid remote expiration', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })

    await renderProvider({ session: initialSession })
    const channel = getBroadcastChannel()
    channel.postMessage.mockClear()

    await act(async () => {
      channel.emit(
        createMessage({
          expiredTokenAt: initialSession.exp * 1000,
          sourceID: 'remote-tab',
          type: 'session-expired',
        }),
      )
    })

    expect(authContext?.user).toBeNull()
    expect(routerMocks.replace).toHaveBeenCalledWith(expect.stringContaining('/logout-inactivity'))
    expect(channel.postMessage).not.toHaveBeenCalled()
  })

  it('should keep the expiration watermark after expiry to reject an older refresh', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    const staleSession = createSession({
      expirationMs: initialSession.exp * 1000 - 10_000,
      token: 'stale-token',
    })

    await renderProvider({ session: initialSession })
    const channel = getBroadcastChannel()

    await act(async () => {
      channel.emit(
        createMessage({
          expiredTokenAt: initialSession.exp * 1000,
          sourceID: 'remote-tab',
          type: 'session-expired',
        }),
      )
    })
    await act(async () => {
      channel.emit(
        createMessage({
          session: staleSession,
          sourceID: 'remote-tab',
          type: 'session-refreshed',
        }),
      )
    })

    expect(authContext?.user).toBeNull()
    expect(authContext?.token).toBeUndefined()
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
      expect.objectContaining({ type: 'session-logged-out' }),
    )

    resolveLogout?.({ status: 200 })
    await act(async () => {
      await logoutPromise
    })
  })

  it('should publish the storage logout resync only after the request settles', async () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    let resolveLogout: ((value: { status: number }) => void) | undefined
    const logoutResponse = new Promise<{ status: number }>((resolve) => {
      resolveLogout = resolve
    })

    await renderProvider({ session: initialSession })
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    apiMocks.post.mockReturnValueOnce(logoutResponse)

    let logoutPromise: Promise<boolean> | undefined
    act(() => {
      logoutPromise = authContext?.logOut()
    })

    expect(setItem).not.toHaveBeenCalled()

    resolveLogout?.({ status: 200 })
    await act(async () => {
      await logoutPromise
    })

    expect(setItem).toHaveBeenCalledOnce()
  })

  it('should publish a runtime storage downgrade only after logout settles', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })
    let resolveLogout: ((value: { status: number }) => void) | undefined
    const logoutResponse = new Promise<{ status: number }>((resolve) => {
      resolveLogout = resolve
    })

    await renderProvider({ session: initialSession })
    const channel = getBroadcastChannel()
    channel.postMessage.mockImplementationOnce(() => {
      throw new Error('channel closed')
    })
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    apiMocks.post.mockReturnValueOnce(logoutResponse)

    let logoutPromise: Promise<boolean> | undefined
    act(() => {
      logoutPromise = authContext?.logOut()
    })

    expect(setItem).not.toHaveBeenCalled()

    resolveLogout?.({ status: 200 })
    await act(async () => {
      await logoutPromise
    })

    expect(setItem).toHaveBeenCalledOnce()
  })

  it('should clear local auth and leave the admin UI after a remote logout', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })

    await renderProvider({ session: initialSession })
    const channel = getBroadcastChannel()
    channel.postMessage.mockClear()

    await act(async () => {
      channel.emit(createMessage({ sourceID: 'remote-tab', type: 'session-logged-out' }))
    })

    expect(authContext?.user).toBeNull()
    expect(routerMocks.replace).toHaveBeenCalledWith('/admin/login')
    expect(channel.postMessage).not.toHaveBeenCalled()
  })

  it('should ignore a stale force-logout callback after a newer session arrives', async () => {
    vi.useFakeTimers()
    const scheduledCallbacks: Array<{ callback: () => void; timeout: number }> = []
    const fakeSetTimeout = globalThis.setTimeout
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((callback, timeout, ...args) => {
      scheduledCallbacks.push({ callback: () => callback(...args), timeout: Number(timeout) })
      return fakeSetTimeout(callback, timeout, ...args)
    }) as typeof setTimeout)
    const initialSession = createFutureSession({ expiresInMs: 10_000, token: 'initial-token' })
    const remoteSession = createFutureSession({ expiresInMs: 20_000, token: 'remote-token' })

    await renderProvider({ session: initialSession })
    const staleForceLogout = scheduledCallbacks.find(
      ({ timeout }) => timeout === initialSession.exp * 1000 - Date.now(),
    )
    const channel = getBroadcastChannel()
    channel.postMessage.mockClear()
    routerMocks.replace.mockClear()

    await act(async () => {
      channel.emit(
        createMessage({
          session: remoteSession,
          sourceID: 'remote-tab',
          type: 'session-refreshed',
        }),
      )
    })
    act(() => staleForceLogout?.callback())

    expect(staleForceLogout).toBeDefined()
    expect(authContext?.token).toBe('remote-token')
    expect(routerMocks.replace).not.toHaveBeenCalled()
    expect(channel.postMessage).not.toHaveBeenCalled()
  })

  it('should still force-expire locally when channel publication fails', async () => {
    vi.useFakeTimers()
    const initialSession = createFutureSession({ expiresInMs: 10_000, token: 'initial-token' })

    await renderProvider({ session: initialSession })
    getBroadcastChannel().postMessage.mockImplementation(() => {
      throw new Error('channel closed')
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
    })

    expect(authContext?.user).toBeNull()
    expect(routerMocks.replace).toHaveBeenCalledWith(expect.stringContaining('/logout-inactivity'))
  })

  it('should still force-expire locally when storage publication fails', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('BroadcastChannel', undefined)
    const initialSession = createFutureSession({ expiresInMs: 10_000, token: 'initial-token' })

    await renderProvider({ session: initialSession })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage denied')
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
    })

    expect(authContext?.user).toBeNull()
    expect(routerMocks.replace).toHaveBeenCalledWith(expect.stringContaining('/logout-inactivity'))
  })

  it('should still log out locally when channel publication fails', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })

    await renderProvider({ session: initialSession })
    apiMocks.post.mockResolvedValueOnce({ status: 200 })
    getBroadcastChannel().postMessage.mockImplementation(() => {
      throw new Error('channel closed')
    })

    await act(async () => {
      await authContext?.logOut()
    })

    expect(authContext?.user).toBeNull()
    expect(apiMocks.post).toHaveBeenCalledWith('/api/users/logout')
  })

  it('should close the synchronization channel on provider unmount', async () => {
    const initialSession = createFutureSession({ expiresInMs: 60_000, token: 'initial-token' })

    await renderProvider({ session: initialSession })
    const channel = getBroadcastChannel()

    act(() => renderedRoot?.unmount())
    renderedRoot = undefined

    expect(channel.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    expect(channel.close).toHaveBeenCalledOnce()
  })
})

function CaptureAuthContext() {
  authContext = useAuth()

  return null
}

function createMessage(
  message:
    | (Omit<Extract<AuthSessionSyncMessage, { type: 'session-expired' }>, 'sentAt'> & {
        sentAt?: number
      })
    | (Omit<Extract<AuthSessionSyncMessage, { type: 'session-logged-out' }>, 'sentAt'> & {
        sentAt?: number
      })
    | (Omit<Extract<AuthSessionSyncMessage, { type: 'session-refreshed' }>, 'sentAt'> & {
        sentAt?: number
      }),
): AuthSessionSyncMessage {
  const { sentAt = 100, ...messageWithoutTimestamp } = message

  return { ...messageWithoutTimestamp, sentAt } as AuthSessionSyncMessage
}

function dispatchStorageRefresh({ sentAt, sourceID }: { sentAt: number; sourceID: string }): void {
  act(() => {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'payload:auth-session:refresh',
        newValue: JSON.stringify({ sentAt, sourceID }),
      }),
    )
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
  localExpirationMs,
  now,
  onSessionExpired = vi.fn(),
  onSessionLoggedOut = vi.fn(),
  onSessionRefreshed = vi.fn(),
  onSessionResyncUnauthenticated = vi.fn(),
  sourceID = 'local-tab',
}: {
  fetchFullUser?: () => Promise<AuthSessionResyncResult>
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
