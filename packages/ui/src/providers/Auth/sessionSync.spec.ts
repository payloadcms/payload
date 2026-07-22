// @vitest-environment jsdom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthContext, UserWithToken } from './index.js'
import type { AuthSessionSyncMessage } from './sessionSync.js'

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
    const fetchFullUser = vi.fn().mockResolvedValue(null)

    createSync({ fetchFullUser })
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const publisher = createSync({ now: () => 123, sourceID: 'remote-tab' })
    publisher.publish({ type: 'session-logged-out' })
    const [key, newValue] = setItem.mock.calls.at(-1) as [string, string]

    window.dispatchEvent(new StorageEvent('storage', { key, newValue }))
    await Promise.resolve()

    expect(fetchFullUser).toHaveBeenCalledOnce()
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
    | Omit<Extract<AuthSessionSyncMessage, { type: 'session-expired' }>, 'sentAt'>
    | Omit<Extract<AuthSessionSyncMessage, { type: 'session-logged-out' }>, 'sentAt'>
    | Omit<Extract<AuthSessionSyncMessage, { type: 'session-refreshed' }>, 'sentAt'>,
): AuthSessionSyncMessage {
  return { ...message, sentAt: 100 } as AuthSessionSyncMessage
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
  fetchFullUser = vi.fn().mockResolvedValue(null),
  localExpirationMs,
  now,
  onSessionExpired = vi.fn(),
  onSessionLoggedOut = vi.fn(),
  onSessionRefreshed = vi.fn(),
  sourceID = 'local-tab',
}: {
  fetchFullUser?: () => Promise<unknown>
  localExpirationMs?: number
  now?: () => number
  onSessionExpired?: (expiredTokenAt: number) => void
  onSessionLoggedOut?: () => void
  onSessionRefreshed?: (session: UserWithToken) => void
  sourceID?: string
} = {}) {
  const sync = createAuthSessionSync({
    fetchFullUser,
    getTokenExpirationMs: () => localExpirationMs,
    now,
    onSessionExpired,
    onSessionLoggedOut,
    onSessionRefreshed,
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
