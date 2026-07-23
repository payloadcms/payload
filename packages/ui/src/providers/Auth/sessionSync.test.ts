import { vi } from 'vitest'

import type { UserWithToken } from './index.js'
import type { AuthSessionSyncEventType, AuthSessionSyncMessage } from './sessionSync.js'

import { AUTH_SESSION_SYNC_EVENT_TYPES } from './sessionSync.js'

export class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = []

  listeners = new Set<(event: MessageEvent<AuthSessionSyncMessage>) => void>()
  addEventListener = vi.fn(
    (_type: string, listener: (event: MessageEvent<AuthSessionSyncMessage>) => void) => {
      this.listeners.add(listener)
    },
  )
  close = vi.fn()
  name: string
  postMessage = vi.fn()
  removeEventListener = vi.fn(
    (_type: string, listener: (event: MessageEvent<AuthSessionSyncMessage>) => void) => {
      this.listeners.delete(listener)
    },
  )

  constructor(name: string) {
    this.name = name
    MockBroadcastChannel.instances.push(this)
  }

  emit(message: AuthSessionSyncMessage): void {
    for (const listener of this.listeners) {
      listener(new MessageEvent('message', { data: message }))
    }
  }
}

export function createSession({
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

export function createFutureSession({
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

export function createMessage(
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
        sentAt?: number
      } & Omit<
        Extract<AuthSessionSyncMessage, { type: typeof AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED }>,
        'sentAt'
      >),
): AuthSessionSyncMessage {
  const { sentAt = 100, ...messageWithoutTimestamp } = message

  return { ...messageWithoutTimestamp, sentAt } as AuthSessionSyncMessage
}

export function dispatchStorageRefresh(notification: {
  affectedExpirationMs: number
  sentAt: number
  settlesSentAt?: number
  sourceID: string
  type: AuthSessionSyncEventType
}): void {
  const message =
    notification.type === AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT
      ? {
          ...notification,
          settlesSentAt: notification.settlesSentAt ?? notification.sentAt - 1,
        }
      : notification

  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'payload:auth-session:refresh',
      newValue: JSON.stringify(message),
    }),
  )
}

export function getBroadcastChannel(): MockBroadcastChannel {
  const channel = MockBroadcastChannel.instances.at(-1)

  if (!channel) {
    throw new Error('Expected a BroadcastChannel instance')
  }

  return channel
}

export function resetMockBroadcastChannels(): void {
  MockBroadcastChannel.instances.length = 0
  vi.stubGlobal('BroadcastChannel', MockBroadcastChannel)
}
