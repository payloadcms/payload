// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { UserWithToken } from './index.js'
import type { AuthSessionResyncResult, AuthSessionSyncMessage } from './sessionSync.js'

import { AUTH_SESSION_SYNC_EVENT_TYPES, createAuthSessionSync } from './sessionSync.js'

const sessionSyncCleanups: Array<() => void> = []

beforeEach(() => {
  resetMockBroadcastChannels()
})

afterEach(() => {
  for (const cleanup of sessionSyncCleanups.splice(0)) {
    cleanup()
  }

  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('createAuthSessionSync', () => {
  it('should publish refreshed sessions with source and timing metadata', () => {
    const session = createSession({ expirationMs: 20_000, token: 'refreshed-token' })
    const sync = createSync({ now: () => 123 })

    sync.publish({
      refreshStartedAt: 100,
      session,
      type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
    })

    expect(getBroadcastChannel().postMessage).toHaveBeenCalledWith({
      refreshStartedAt: 100,
      session,
      sourceID: 'local-tab',
      sentAt: 123,
      type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
    })
  })

  it('should ignore refresh and expiration events for older sessions', () => {
    const onSessionExpired = vi.fn()
    const onSessionRefreshed = vi.fn()

    createSync({
      localExpirationMs: 40_000,
      onSessionExpired,
      onSessionRefreshed,
    })
    const channel = getBroadcastChannel()

    channel.emit(
      createMessage({
        session: createSession({ expirationMs: 30_000 }),
        sourceID: 'stale-refresh-tab',
        type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
      }),
    )
    channel.emit(
      createMessage({
        expiredTokenAt: 30_000,
        sourceID: 'stale-expiration-tab',
        type: AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED,
      }),
    )
    expect(onSessionRefreshed).not.toHaveBeenCalled()
    expect(onSessionExpired).not.toHaveBeenCalled()
  })

  it('should converge on logout when equal-time events arrive in opposite orders', () => {
    let firstState = 'initial'
    let secondState = 'initial'
    const refreshMessage = createMessage({
      sentAt: 500,
      session: createSession({ expirationMs: 30_000, token: 'refreshed-token' }),
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

  it('should keep logout ahead of a refresh that started earlier and published later', () => {
    const onSessionLoggedOut = vi.fn()
    const onSessionRefreshed = vi.fn()
    const refreshMessage = createMessage({
      refreshStartedAt: 100,
      sentAt: 300,
      session: createSession({ expirationMs: 30_000, token: 'late-refreshed-token' }),
      sourceID: 'refresh-tab',
      type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
    })
    const logoutMessage = createMessage({
      sentAt: 200,
      sourceID: 'logout-tab',
      type: AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT,
    })

    createSync({ onSessionLoggedOut, onSessionRefreshed, sourceID: 'receiving-tab' })
    const channel = getBroadcastChannel()

    channel.emit(logoutMessage)
    channel.emit(refreshMessage)

    expect(onSessionLoggedOut).toHaveBeenCalledOnce()
    expect(onSessionRefreshed).not.toHaveBeenCalled()
  })

  it('should ignore a late storage refresh whose request started before logout', () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const fetchFullUser = vi.fn().mockResolvedValue({ status: 'indeterminate' } as const)
    const onSessionLoggedOut = vi.fn()

    createSync({ fetchFullUser, onSessionLoggedOut, sourceID: 'receiving-tab' })

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'payload:auth-session:refresh',
        newValue: JSON.stringify({
          affectedExpirationMs: 0,
          settlesSentAt: 200,
          sentAt: 201,
          sourceID: 'logout-tab',
          type: AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT,
        }),
      }),
    )
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'payload:auth-session:refresh',
        newValue: JSON.stringify({
          affectedExpirationMs: 30_000,
          refreshStartedAt: 100,
          sentAt: 300,
          sourceID: 'refresh-tab',
          type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
        }),
      }),
    )

    expect(onSessionLoggedOut).toHaveBeenCalledOnce()
    expect(fetchFullUser).not.toHaveBeenCalled()
  })

  it('should keep storage fallback notification-only while reconciling refresh and settling logout', async () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const fetchFullUser = vi.fn().mockResolvedValue({ status: 'indeterminate' })
    const onSessionLoggedOut = vi.fn()

    createSync({ fetchFullUser, onSessionLoggedOut, sourceID: 'receiving-tab' })
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const publisher = createSync({ now: () => 123, sourceID: 'publishing-tab' })

    publisher.publish({
      refreshStartedAt: 100,
      session: createSession({ expirationMs: 20_000, token: 'sensitive-token' }),
      type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
    })
    const [key, value] = setItem.mock.calls[0] as [string, string]

    expect(JSON.parse(value)).toEqual({
      affectedExpirationMs: 20_000,
      refreshStartedAt: 100,
      type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
      sentAt: 123,
      sourceID: 'publishing-tab',
    })
    expect(value).not.toContain('sensitive-token')
    expect(value).not.toContain('user')

    window.dispatchEvent(new StorageEvent('storage', { key, newValue: value }))
    await Promise.resolve()

    expect(fetchFullUser).toHaveBeenCalledOnce()

    fetchFullUser.mockClear()

    const logoutPublication = publisher.publish({
      type: AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT,
    })

    expect(setItem).toHaveBeenCalledOnce()
    expect(logoutPublication.type).toBe(AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT)

    if (logoutPublication.type !== AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT) {
      throw new Error('Expected a logged-out publication.')
    }

    publisher.publishStorageRefresh(logoutPublication)

    const [logoutKey, logoutValue] = setItem.mock.calls[1] as [string, string]

    expect(JSON.parse(logoutValue)).toEqual({
      affectedExpirationMs: 0,
      settlesSentAt: 124,
      sentAt: 125,
      sourceID: 'publishing-tab',
      type: AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT,
    })
    expect(logoutValue).not.toContain('sensitive-token')
    expect(logoutValue).not.toContain('user')

    window.dispatchEvent(new StorageEvent('storage', { key: logoutKey, newValue: logoutValue }))

    expect(onSessionLoggedOut).toHaveBeenCalledOnce()
    expect(fetchFullUser).not.toHaveBeenCalled()

    await Promise.resolve()

    expect(fetchFullUser).not.toHaveBeenCalled()
  })

  it('should downgrade a failed channel and resynchronize through storage', async () => {
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
      refreshStartedAt: 100,
      session: createSession({ expirationMs: 20_000 }),
      type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
    })

    expect(failedChannel.close).toHaveBeenCalledOnce()
    expect(addEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
    expect(setItem).toHaveBeenCalledOnce()

    const [key, newValue] = setItem.mock.calls[0] as [string, string]

    window.dispatchEvent(new StorageEvent('storage', { key, newValue }))
    await Promise.resolve()

    expect(fetchFullUser).toHaveBeenCalledOnce()
  })

  it('should ignore a pending storage resync after cleanup', async () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    let resolveFetchFullUser: ((result: AuthSessionResyncResult) => void) | undefined
    const fetchFullUser = vi.fn(
      () =>
        new Promise<AuthSessionResyncResult>((resolve) => {
          resolveFetchFullUser = resolve
        }),
    )
    const onSessionResyncUnauthenticated = vi.fn()
    const sync = createSync({ fetchFullUser, onSessionResyncUnauthenticated })

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'payload:auth-session:refresh',
        newValue: JSON.stringify({
          affectedExpirationMs: 40_000,
          refreshStartedAt: 400,
          type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
          sentAt: 500,
          sourceID: 'remote-tab',
        }),
      }),
    )
    sync.cleanup()
    resolveFetchFullUser?.({ status: 'unauthenticated' })
    await Promise.resolve()

    expect(onSessionResyncUnauthenticated).not.toHaveBeenCalled()
  })
})

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

class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = []

  listeners = new Set<(event: MessageEvent<AuthSessionSyncMessage>) => void>()
  addEventListener = vi.fn(
    (_type: string, listener: (event: MessageEvent<AuthSessionSyncMessage>) => void) => {
      this.listeners.add(listener)
    },
  )
  close = vi.fn()
  postMessage = vi.fn()
  removeEventListener = vi.fn(
    (_type: string, listener: (event: MessageEvent<AuthSessionSyncMessage>) => void) => {
      this.listeners.delete(listener)
    },
  )

  emit(message: AuthSessionSyncMessage): void {
    for (const listener of this.listeners) {
      listener(new MessageEvent('message', { data: message }))
    }
  }
}

function createMessage(
  message:
    | ({
        sentAt?: number
      } & Omit<
        Extract<AuthSessionSyncMessage, { type: typeof AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED }>,
        'sentAt'
      >)
    | ({
        sentAt?: number
      } & Omit<
        Extract<AuthSessionSyncMessage, { type: typeof AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT }>,
        'sentAt'
      >)
    | ({
        refreshStartedAt?: number
        sentAt?: number
      } & Omit<
        Extract<AuthSessionSyncMessage, { type: typeof AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED }>,
        'refreshStartedAt' | 'sentAt'
      >),
): AuthSessionSyncMessage {
  const { sentAt = 100, ...messageWithoutTimestamp } = message

  if (messageWithoutTimestamp.type === AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED) {
    const { refreshStartedAt = sentAt, ...refreshedMessage } = messageWithoutTimestamp

    return { ...refreshedMessage, refreshStartedAt, sentAt }
  }

  return { ...messageWithoutTimestamp, sentAt } as AuthSessionSyncMessage
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
    user: { id: '1', collection: 'users' },
  }
}

function getBroadcastChannel(): MockBroadcastChannel {
  const channel = MockBroadcastChannel.instances.at(-1)

  if (!channel) {
    throw new Error('Expected a BroadcastChannel instance')
  }

  return channel
}

function resetMockBroadcastChannels(): void {
  MockBroadcastChannel.instances.length = 0
  vi.stubGlobal(
    'BroadcastChannel',
    class extends MockBroadcastChannel {
      constructor() {
        super()
        MockBroadcastChannel.instances.push(this)
      }
    },
  )
}
