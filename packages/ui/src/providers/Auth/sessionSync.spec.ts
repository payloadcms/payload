// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { UserWithToken } from './index.js'
import type { AuthSessionResyncResult, AuthSessionSyncMessage } from './sessionSync.js'

import { AUTH_SESSION_SYNC_EVENT_TYPES, createAuthSessionSync } from './sessionSync.js'
import {
  createMessage,
  createSession,
  dispatchStorageRefresh,
  getBroadcastChannel,
  resetMockBroadcastChannels,
} from './sessionSync.test.js'

const sessionSyncCleanups: Array<() => void> = []

beforeEach(() => {
  resetMockBroadcastChannels()
})

afterEach(() => {
  for (const cleanup of sessionSyncCleanups.splice(0)) {
    cleanup()
  }

  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
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

function dispatchStoredNotification(setItem: {
  mock: { calls: Array<[key: string, value: string]> }
}): void {
  const [key, newValue] = setItem.mock.calls.at(-1) as [string, string]

  window.dispatchEvent(new StorageEvent('storage', { key, newValue }))
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
