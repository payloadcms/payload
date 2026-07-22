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
} {
  const receiveMessage = ({ data }: MessageEvent<unknown>) => {
    if (!isAuthSessionSyncMessage(data) || data.sourceID === sourceID) {
      return
    }

    if (data.type === 'session-refreshed') {
      const receivedExpirationMs = data.session.exp * 1000
      const localExpirationMs = getTokenExpirationMs()

      if (localExpirationMs !== undefined && receivedExpirationMs < localExpirationMs) {
        return
      }

      onSessionRefreshed(data.session)
      return
    }

    if (data.type === 'session-expired') {
      const localExpirationMs = getTokenExpirationMs()

      if (localExpirationMs !== undefined && localExpirationMs > data.expiredTokenAt) {
        return
      }

      onSessionExpired(data.expiredTokenAt)
      return
    }

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
    channel = new BroadcastChannel(authSessionSyncChannelName)
    channel.addEventListener('message', receiveMessage)
  } else {
    window.addEventListener('storage', receiveStorageRefresh)
  }

  return {
    cleanup: () => {
      if (channel) {
        channel.removeEventListener('message', receiveMessage)
        channel.close()
      } else {
        window.removeEventListener('storage', receiveStorageRefresh)
      }
    },
    publish: (event) => {
      const sentAt = now()

      if (channel) {
        channel.postMessage({ ...event, sentAt, sourceID } as AuthSessionSyncMessage)
        return
      }

      const notification: StorageRefreshNotification = { sentAt, sourceID }

      localStorage.setItem(authSessionSyncStorageKey, JSON.stringify(notification))
      localStorage.removeItem(authSessionSyncStorageKey)
    },
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
