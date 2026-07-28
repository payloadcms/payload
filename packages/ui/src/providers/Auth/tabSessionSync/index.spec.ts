// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { UserWithToken } from '../types.js'
import type { TabSessionMessage, TabSessionReconciliationResult } from './index.js'

import { TAB_SESSION_EVENT_TYPES, createTabSessionSync } from './index.js'

const tabSessionSyncCleanups: Array<() => void> = []

beforeEach(() => {
  resetMockBroadcastChannels()
})

afterEach(() => {
  for (const cleanup of tabSessionSyncCleanups.splice(0)) {
    cleanup()
  }

  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('createTabSessionSync', () => {
  it('should publish refreshed sessions with source-tab and timing metadata', () => {
    const session = createSession({ expirationMs: 20_000, token: 'refreshed-token' })
    const tabSessionSync = createTestTabSessionSync({ now: () => 123 })

    tabSessionSync.publish({
      refreshStartedAt: 100,
      session,
      type: TAB_SESSION_EVENT_TYPES.REFRESHED,
    })

    expect(getBroadcastChannel().postMessage).toHaveBeenCalledWith({
      refreshStartedAt: 100,
      session,
      sourceTabID: 'local-tab',
      sentAt: 123,
      type: TAB_SESSION_EVENT_TYPES.REFRESHED,
    })
  })

  it('should ignore refresh and expiration events for older sessions', () => {
    const onSessionExpired = vi.fn()
    const onSessionRefreshed = vi.fn()

    createTestTabSessionSync({
      localExpirationMs: 40_000,
      onSessionExpired,
      onSessionRefreshed,
    })
    const channel = getBroadcastChannel()

    channel.emit(
      createTabSessionMessage({
        session: createSession({ expirationMs: 30_000 }),
        sourceTabID: 'stale-refresh-tab',
        type: TAB_SESSION_EVENT_TYPES.REFRESHED,
      }),
    )
    channel.emit(
      createTabSessionMessage({
        expiredTokenAt: 30_000,
        sourceTabID: 'stale-expiration-tab',
        type: TAB_SESSION_EVENT_TYPES.EXPIRED,
      }),
    )
    expect(onSessionRefreshed).not.toHaveBeenCalled()
    expect(onSessionExpired).not.toHaveBeenCalled()
  })

  it('should converge on logout when equal-time events arrive in opposite orders', () => {
    let firstState = 'initial'
    let secondState = 'initial'
    const refreshMessage = createTabSessionMessage({
      sentAt: 500,
      session: createSession({ expirationMs: 30_000, token: 'refreshed-token' }),
      sourceTabID: 'refresh-tab',
      type: TAB_SESSION_EVENT_TYPES.REFRESHED,
    })
    const logoutMessage = createTabSessionMessage({
      sentAt: 500,
      sourceTabID: 'logout-tab',
      type: TAB_SESSION_EVENT_TYPES.LOGGED_OUT,
    })

    createTestTabSessionSync({
      onSessionLoggedOut: () => {
        firstState = 'logged-out'
      },
      onSessionRefreshed: () => {
        firstState = 'refreshed'
      },
      sourceTabID: 'first-local-tab',
    })
    const firstChannel = getBroadcastChannel()
    createTestTabSessionSync({
      onSessionLoggedOut: () => {
        secondState = 'logged-out'
      },
      onSessionRefreshed: () => {
        secondState = 'refreshed'
      },
      sourceTabID: 'second-local-tab',
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
    const refreshMessage = createTabSessionMessage({
      refreshStartedAt: 100,
      sentAt: 300,
      session: createSession({ expirationMs: 30_000, token: 'late-refreshed-token' }),
      sourceTabID: 'refresh-tab',
      type: TAB_SESSION_EVENT_TYPES.REFRESHED,
    })
    const logoutMessage = createTabSessionMessage({
      sentAt: 200,
      sourceTabID: 'logout-tab',
      type: TAB_SESSION_EVENT_TYPES.LOGGED_OUT,
    })

    createTestTabSessionSync({
      onSessionLoggedOut,
      onSessionRefreshed,
      sourceTabID: 'receiving-tab',
    })
    const channel = getBroadcastChannel()

    channel.emit(logoutMessage)
    channel.emit(refreshMessage)

    expect(onSessionLoggedOut).toHaveBeenCalledOnce()
    expect(onSessionRefreshed).not.toHaveBeenCalled()
  })

  it('should apply refreshes in publication order instead of request-start ordering for refresh-vs-refresh', () => {
    let appliedSession: UserWithToken | undefined
    const onSessionRefreshed = vi.fn((session: UserWithToken) => {
      appliedSession = session
    })
    const refreshB = createTabSessionMessage({
      refreshStartedAt: 200,
      sentAt: 100,
      session: createSession({ expirationMs: 30_000, token: 'refresh-b' }),
      sourceTabID: 'refresh-b-tab',
      type: TAB_SESSION_EVENT_TYPES.REFRESHED,
    })
    const refreshA = createTabSessionMessage({
      refreshStartedAt: 100,
      sentAt: 200,
      session: createSession({ expirationMs: 40_000, token: 'refresh-a' }),
      sourceTabID: 'refresh-a-tab',
      type: TAB_SESSION_EVENT_TYPES.REFRESHED,
    })

    createTestTabSessionSync({ onSessionRefreshed, sourceTabID: 'receiving-tab' })
    const channel = getBroadcastChannel()

    channel.emit(refreshB)
    channel.emit(refreshA)

    expect(onSessionRefreshed).toHaveBeenCalledTimes(2)
    expect(onSessionRefreshed).toHaveBeenLastCalledWith(refreshA.session)
    expect(appliedSession).toBe(refreshA.session)
  })

  it('should ignore storage notifications while BroadcastChannel is healthy', async () => {
    const reconcileSession = vi.fn().mockResolvedValue({ status: 'indeterminate' } as const)

    createTestTabSessionSync({ reconcileSession, sourceTabID: 'receiving-tab' })

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'payload:auth-session:tab-sync',
        newValue: JSON.stringify({
          affectedExpirationMs: 30_000,
          refreshStartedAt: 100,
          sentAt: 200,
          sourceTabID: 'refreshing-tab',
          type: TAB_SESSION_EVENT_TYPES.REFRESHED,
        }),
      }),
    )
    await Promise.resolve()

    expect(reconcileSession).not.toHaveBeenCalled()
  })

  it('should ignore a late storage refresh whose request started before logout', () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const reconcileSession = vi.fn().mockResolvedValue({ status: 'indeterminate' } as const)
    const onSessionLoggedOut = vi.fn()

    createTestTabSessionSync({
      reconcileSession,
      onSessionLoggedOut,
      sourceTabID: 'receiving-tab',
    })

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'payload:auth-session:tab-sync',
        newValue: JSON.stringify({
          affectedExpirationMs: 0,
          settlesSentAt: 200,
          sentAt: 201,
          sourceTabID: 'logout-tab',
          type: TAB_SESSION_EVENT_TYPES.LOGGED_OUT,
        }),
      }),
    )
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'payload:auth-session:tab-sync',
        newValue: JSON.stringify({
          affectedExpirationMs: 30_000,
          refreshStartedAt: 100,
          sentAt: 300,
          sourceTabID: 'refresh-tab',
          type: TAB_SESSION_EVENT_TYPES.REFRESHED,
        }),
      }),
    )

    expect(onSessionLoggedOut).toHaveBeenCalledOnce()
    expect(reconcileSession).not.toHaveBeenCalled()
  })

  it('should keep storage fallback notification-only while reconciling refresh and settling logout', async () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const reconcileSession = vi.fn().mockResolvedValue({ status: 'indeterminate' })
    const onSessionLoggedOut = vi.fn()

    createTestTabSessionSync({
      reconcileSession,
      onSessionLoggedOut,
      sourceTabID: 'receiving-tab',
    })
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const publisher = createTestTabSessionSync({
      now: () => 123,
      sourceTabID: 'publishing-tab',
    })

    publisher.publish({
      refreshStartedAt: 100,
      session: createSession({ expirationMs: 20_000, token: 'sensitive-token' }),
      type: TAB_SESSION_EVENT_TYPES.REFRESHED,
    })
    const [key, value] = setItem.mock.calls[0] as [string, string]

    expect(JSON.parse(value)).toEqual({
      affectedExpirationMs: 20_000,
      isBroadcastChannelFallback: true,
      refreshStartedAt: 100,
      type: TAB_SESSION_EVENT_TYPES.REFRESHED,
      sentAt: 123,
      sourceTabID: 'publishing-tab',
    })
    expect(value).not.toContain('sensitive-token')
    expect(value).not.toContain('user')

    window.dispatchEvent(new StorageEvent('storage', { key, newValue: value }))
    await Promise.resolve()

    expect(reconcileSession).toHaveBeenCalledOnce()

    reconcileSession.mockClear()

    const logoutPublication = publisher.publish({
      type: TAB_SESSION_EVENT_TYPES.LOGGED_OUT,
    })

    expect(setItem).toHaveBeenCalledOnce()
    expect(logoutPublication.type).toBe(TAB_SESSION_EVENT_TYPES.LOGGED_OUT)

    if (logoutPublication.type !== TAB_SESSION_EVENT_TYPES.LOGGED_OUT) {
      throw new Error('Expected a logged-out publication.')
    }

    publisher.publishLogoutSettlement(logoutPublication)

    const [logoutKey, logoutValue] = setItem.mock.calls[1] as [string, string]

    expect(JSON.parse(logoutValue)).toEqual({
      affectedExpirationMs: 0,
      isBroadcastChannelFallback: true,
      settlesSentAt: 124,
      sentAt: 125,
      sourceTabID: 'publishing-tab',
      type: TAB_SESSION_EVENT_TYPES.LOGGED_OUT,
    })
    expect(logoutValue).not.toContain('sensitive-token')
    expect(logoutValue).not.toContain('user')

    window.dispatchEvent(new StorageEvent('storage', { key: logoutKey, newValue: logoutValue }))

    expect(onSessionLoggedOut).toHaveBeenCalledOnce()
    expect(reconcileSession).not.toHaveBeenCalled()

    await Promise.resolve()

    expect(reconcileSession).not.toHaveBeenCalled()
  })

  it('should downgrade a failed channel and reconcile through storage', async () => {
    const reconcileSession = vi.fn().mockResolvedValue({ status: 'indeterminate' })

    createTestTabSessionSync({ reconcileSession, sourceTabID: 'storage-peer' })
    const addEventListener = vi.spyOn(window, 'addEventListener')
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const publisher = createTestTabSessionSync({ sourceTabID: 'channel-publisher' })
    const failedChannel = getBroadcastChannel()

    failedChannel.postMessage.mockImplementationOnce(() => {
      throw new Error('channel closed')
    })
    publisher.publish({
      refreshStartedAt: 100,
      session: createSession({ expirationMs: 20_000 }),
      type: TAB_SESSION_EVENT_TYPES.REFRESHED,
    })

    expect(failedChannel.close).toHaveBeenCalledOnce()
    expect(addEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
    expect(setItem).toHaveBeenCalledOnce()

    const [key, newValue] = setItem.mock.calls[0] as [string, string]

    window.dispatchEvent(new StorageEvent('storage', { key, newValue }))
    await Promise.resolve()

    expect(reconcileSession).toHaveBeenCalledOnce()
  })

  it('should ignore a pending storage reconciliation after cleanup', async () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    let resolveReconciliation: ((result: TabSessionReconciliationResult) => void) | undefined
    const reconcileSession = vi.fn(
      () =>
        new Promise<TabSessionReconciliationResult>((resolve) => {
          resolveReconciliation = resolve
        }),
    )
    const onTabSessionUnauthenticated = vi.fn()
    const tabSessionSync = createTestTabSessionSync({
      reconcileSession,
      onTabSessionUnauthenticated,
    })

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'payload:auth-session:tab-sync',
        newValue: JSON.stringify({
          affectedExpirationMs: 40_000,
          refreshStartedAt: 400,
          type: TAB_SESSION_EVENT_TYPES.REFRESHED,
          sentAt: 500,
          sourceTabID: 'remote-tab',
        }),
      }),
    )
    tabSessionSync.cleanup()
    resolveReconciliation?.({ status: 'unauthenticated' })
    await Promise.resolve()

    expect(onTabSessionUnauthenticated).not.toHaveBeenCalled()
  })
})

function createTestTabSessionSync({
  reconcileSession = vi.fn().mockResolvedValue({ status: 'indeterminate' } as const),
  localExpirationMs,
  now,
  onSessionExpired = vi.fn(),
  onSessionLoggedOut = vi.fn(),
  onSessionRefreshed = vi.fn(),
  onTabSessionUnauthenticated = vi.fn(),
  sourceTabID = 'local-tab',
}: {
  reconcileSession?: () => Promise<TabSessionReconciliationResult>
  localExpirationMs?: number
  now?: () => number
  onSessionExpired?: (expiredTokenAt: number) => void
  onSessionLoggedOut?: () => void
  onSessionRefreshed?: (session: UserWithToken) => void
  onTabSessionUnauthenticated?: () => void
  sourceTabID?: string
} = {}) {
  const tabSessionSync = createTabSessionSync({
    reconcileSession,
    getTokenExpirationMs: () => localExpirationMs,
    now,
    onSessionExpired,
    onSessionLoggedOut,
    onSessionRefreshed,
    onTabSessionUnauthenticated,
    sourceTabID,
  })

  tabSessionSyncCleanups.push(tabSessionSync.cleanup)

  return tabSessionSync
}

class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = []

  listeners = new Set<(event: MessageEvent<TabSessionMessage>) => void>()
  addEventListener = vi.fn(
    (_type: string, listener: (event: MessageEvent<TabSessionMessage>) => void) => {
      this.listeners.add(listener)
    },
  )
  close = vi.fn()
  postMessage = vi.fn()
  removeEventListener = vi.fn(
    (_type: string, listener: (event: MessageEvent<TabSessionMessage>) => void) => {
      this.listeners.delete(listener)
    },
  )

  emit(message: TabSessionMessage): void {
    for (const listener of this.listeners) {
      listener(new MessageEvent('message', { data: message }))
    }
  }
}

function createTabSessionMessage(
  message:
    | ({
        sentAt?: number
      } & Omit<
        Extract<TabSessionMessage, { type: typeof TAB_SESSION_EVENT_TYPES.EXPIRED }>,
        'sentAt'
      >)
    | ({
        sentAt?: number
      } & Omit<
        Extract<TabSessionMessage, { type: typeof TAB_SESSION_EVENT_TYPES.LOGGED_OUT }>,
        'sentAt'
      >)
    | ({
        refreshStartedAt?: number
        sentAt?: number
      } & Omit<
        Extract<TabSessionMessage, { type: typeof TAB_SESSION_EVENT_TYPES.REFRESHED }>,
        'refreshStartedAt' | 'sentAt'
      >),
): TabSessionMessage {
  const { sentAt = 100, ...messageWithoutTimestamp } = message

  if (messageWithoutTimestamp.type === TAB_SESSION_EVENT_TYPES.REFRESHED) {
    const { refreshStartedAt = sentAt, ...refreshedMessage } = messageWithoutTimestamp

    return { ...refreshedMessage, refreshStartedAt, sentAt }
  }

  return { ...messageWithoutTimestamp, sentAt } as TabSessionMessage
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
