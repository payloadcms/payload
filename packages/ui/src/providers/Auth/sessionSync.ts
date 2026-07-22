import type { UserWithToken } from './index.js'

export type AuthSessionSyncMessage =
  | {
      expiredTokenAt: number
      sentAt: number
      sourceID: string
      type: 'session-expired'
    }
  | {
      sentAt: number
      session: UserWithToken
      sourceID: string
      type: 'session-refreshed'
    }
  | {
      sentAt: number
      sourceID: string
      type: 'session-logged-out'
    }

export type AuthSessionSyncEvent =
  | {
      expiredTokenAt: number
      type: 'session-expired'
    }
  | {
      session: UserWithToken
      type: 'session-refreshed'
    }
  | {
      type: 'session-logged-out'
    }

const authSessionSyncChannelName = 'payload-auth-session'
const authSessionSyncStorageKey = 'payload:auth-session:refresh'

type StorageRefreshNotification = {
  sentAt: number
  sourceID: string
}

export function createAuthSessionSync({
  fetchFullUser,
  getTokenExpirationMs,
  now = Date.now,
  onSessionExpired,
  onSessionLoggedOut,
  onSessionRefreshed,
  sourceID,
}: {
  fetchFullUser: () => Promise<unknown>
  getTokenExpirationMs: () => number | undefined
  now?: () => number
  onSessionExpired: (expiredTokenAt: number) => void
  onSessionLoggedOut: () => void
  onSessionRefreshed: (session: UserWithToken) => void
  sourceID: string
}): {
  cleanup: () => void
  publish: (event: AuthSessionSyncEvent) => void
  publishStorageRefresh: () => void
} {
  let latestLifecycleAt = Number.NEGATIVE_INFINITY

  const receiveMessage = ({ data }: MessageEvent<unknown>) => {
    if (
      !isAuthSessionSyncMessage(data) ||
      data.sourceID === sourceID ||
      data.sentAt < latestLifecycleAt
    ) {
      return
    }

    if (data.type === 'session-refreshed') {
      const receivedExpirationMs = data.session.exp * 1000
      const localExpirationMs = getTokenExpirationMs()

      if (localExpirationMs !== undefined && receivedExpirationMs < localExpirationMs) {
        return
      }

      latestLifecycleAt = data.sentAt
      onSessionRefreshed(data.session)
      return
    }

    if (data.type === 'session-expired') {
      const localExpirationMs = getTokenExpirationMs()

      if (localExpirationMs !== undefined && localExpirationMs > data.expiredTokenAt) {
        return
      }

      latestLifecycleAt = data.sentAt
      onSessionExpired(data.expiredTokenAt)
      return
    }

    latestLifecycleAt = data.sentAt
    onSessionLoggedOut()
  }

  const receiveStorageRefresh = (event: StorageEvent) => {
    if (event.key !== authSessionSyncStorageKey || !event.newValue) {
      return
    }

    const notification = parseStorageRefreshNotification(event.newValue)

    if (!notification || notification.sourceID === sourceID) {
      return
    }

    void fetchFullUser().catch(() => undefined)
  }

  let channel: BroadcastChannel | undefined

  if (typeof BroadcastChannel === 'function') {
    try {
      const nextChannel = new BroadcastChannel(authSessionSyncChannelName)

      nextChannel.addEventListener('message', receiveMessage)
      channel = nextChannel
    } catch {
      channel = undefined
    }
  }

  if (!channel) {
    window.addEventListener('storage', receiveStorageRefresh)
  }

  return {
    cleanup: () => {
      if (channel) {
        try {
          channel.removeEventListener('message', receiveMessage)
        } catch {
          // Synchronization cleanup is best-effort.
        }

        try {
          channel.close()
        } catch {
          // Synchronization cleanup is best-effort.
        }
      } else {
        try {
          window.removeEventListener('storage', receiveStorageRefresh)
        } catch {
          // Synchronization cleanup is best-effort.
        }
      }
    },
    publish: (event) => {
      const sentAt = getNextLifecycleTimestamp()

      if (channel) {
        try {
          channel.postMessage({ ...event, sentAt, sourceID } as AuthSessionSyncMessage)
        } catch {
          // Local authentication must continue when cross-tab publication fails.
        }
        return
      }

      if (event.type !== 'session-logged-out') {
        publishStorageNotification({ sentAt })
      }
    },
    publishStorageRefresh: () => {
      if (!channel) {
        publishStorageNotification({ sentAt: getNextLifecycleTimestamp() })
      }
    },
  }

  function getNextLifecycleTimestamp(): number {
    const currentTime = now()
    const nextTimestamp = currentTime > latestLifecycleAt ? currentTime : latestLifecycleAt + 1

    latestLifecycleAt = nextTimestamp

    return nextTimestamp
  }

  function publishStorageNotification({ sentAt }: { sentAt: number }): void {
    const notification: StorageRefreshNotification = { sentAt, sourceID }

    try {
      localStorage.setItem(authSessionSyncStorageKey, JSON.stringify(notification))
    } catch {
      // Local authentication must continue when storage is unavailable.
    }

    try {
      localStorage.removeItem(authSessionSyncStorageKey)
    } catch {
      // Local authentication must continue when storage is unavailable.
    }
  }
}

function isAuthSessionSyncMessage(value: unknown): value is AuthSessionSyncMessage {
  if (
    !value ||
    typeof value !== 'object' ||
    !('sourceID' in value) ||
    typeof value.sourceID !== 'string' ||
    !('sentAt' in value) ||
    typeof value.sentAt !== 'number' ||
    !('type' in value)
  ) {
    return false
  }

  if (value.type === 'session-logged-out') {
    return true
  }

  if (value.type === 'session-expired') {
    return 'expiredTokenAt' in value && typeof value.expiredTokenAt === 'number'
  }

  if (value.type === 'session-refreshed') {
    return (
      'session' in value &&
      Boolean(value.session) &&
      typeof value.session === 'object' &&
      'exp' in value.session &&
      typeof value.session.exp === 'number' &&
      'user' in value.session
    )
  }

  return false
}

function parseStorageRefreshNotification(value: string): null | StorageRefreshNotification {
  try {
    const notification: unknown = JSON.parse(value)

    if (
      notification &&
      typeof notification === 'object' &&
      'sentAt' in notification &&
      typeof notification.sentAt === 'number' &&
      'sourceID' in notification &&
      typeof notification.sourceID === 'string'
    ) {
      return notification as StorageRefreshNotification
    }
  } catch {
    // Ignore storage writes that do not belong to session synchronization.
  }

  return null
}
