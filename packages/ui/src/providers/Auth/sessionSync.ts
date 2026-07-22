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

export type AuthSessionResyncResult<T = unknown> =
  | {
      status: 'authenticated'
      user: T
    }
  | {
      status: 'indeterminate'
    }
  | {
      status: 'unauthenticated'
    }

const authSessionSyncChannelName = 'payload-auth-session'
const authSessionSyncStorageKey = 'payload:auth-session:refresh'

type StorageRefreshNotification = {
  sentAt: number
  sourceID: string
}

type LifecycleOrder = {
  affectedExpirationMs: number
  precedence: number
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
  onSessionResyncUnauthenticated,
  sourceID,
}: {
  fetchFullUser: () => Promise<AuthSessionResyncResult>
  getTokenExpirationMs: () => number | undefined
  now?: () => number
  onSessionExpired: (expiredTokenAt: number) => void
  onSessionLoggedOut: () => void
  onSessionRefreshed: (session: UserWithToken) => void
  onSessionResyncUnauthenticated: () => void
  sourceID: string
}): {
  cleanup: () => void
  publish: (event: AuthSessionSyncEvent) => void
  publishStorageRefresh: () => void
} {
  let channel: BroadcastChannel | undefined
  let isStorageListenerInstalled = false
  let latestLifecycleOrder: LifecycleOrder | undefined

  const receiveMessage = ({ data }: MessageEvent<unknown>) => {
    if (!isAuthSessionSyncMessage(data) || data.sourceID === sourceID) {
      return
    }

    const lifecycleOrder = getLifecycleOrder(data)

    if (
      latestLifecycleOrder &&
      compareLifecycleOrders({ first: lifecycleOrder, second: latestLifecycleOrder }) <= 0
    ) {
      return
    }

    if (data.type === 'session-refreshed') {
      const receivedExpirationMs = data.session.exp * 1000
      const localExpirationMs = getTokenExpirationMs()

      if (localExpirationMs !== undefined && receivedExpirationMs < localExpirationMs) {
        return
      }

      latestLifecycleOrder = lifecycleOrder
      onSessionRefreshed(data.session)
      return
    }

    if (data.type === 'session-expired') {
      const localExpirationMs = getTokenExpirationMs()

      if (localExpirationMs !== undefined && localExpirationMs > data.expiredTokenAt) {
        return
      }

      latestLifecycleOrder = lifecycleOrder
      onSessionExpired(data.expiredTokenAt)
      return
    }

    latestLifecycleOrder = lifecycleOrder
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

    void fetchFullUser()
      .then((result) => {
        if (result.status === 'unauthenticated') {
          onSessionResyncUnauthenticated()
        }
      })
      .catch(() => undefined)
  }

  if (typeof BroadcastChannel === 'function') {
    let nextChannel: BroadcastChannel | undefined

    try {
      nextChannel = new BroadcastChannel(authSessionSyncChannelName)

      nextChannel.addEventListener('message', receiveMessage)
      channel = nextChannel
    } catch {
      closeChannel(nextChannel)
      channel = undefined
    }
  }

  installStorageListener()

  return {
    cleanup: () => {
      closeChannel(channel)
      channel = undefined

      if (isStorageListenerInstalled) {
        try {
          window.removeEventListener('storage', receiveStorageRefresh)
        } catch {
          // Synchronization cleanup is best-effort.
        }

        isStorageListenerInstalled = false
      }
    },
    publish: (event) => {
      const sentAt = getNextLifecycleTimestamp({ event })
      const message = { ...event, sentAt, sourceID } as AuthSessionSyncMessage

      latestLifecycleOrder = getLifecycleOrder(message)

      if (channel) {
        try {
          channel.postMessage(message)
          return
        } catch {
          downgradeToStorage()
        }
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

  function closeChannel(channelToClose: BroadcastChannel | undefined): void {
    if (!channelToClose) {
      return
    }

    try {
      channelToClose.removeEventListener('message', receiveMessage)
    } catch {
      // Synchronization cleanup is best-effort.
    }

    try {
      channelToClose.close()
    } catch {
      // Synchronization cleanup is best-effort.
    }
  }

  function downgradeToStorage(): void {
    closeChannel(channel)
    channel = undefined
    installStorageListener()
  }

  function getNextLifecycleTimestamp({ event }: { event?: AuthSessionSyncEvent } = {}): number {
    const currentTime = now()
    const latestSentAt = latestLifecycleOrder?.sentAt ?? Number.NEGATIVE_INFINITY
    const nextTimestamp = currentTime > latestSentAt ? currentTime : latestSentAt + 1

    if (event) {
      latestLifecycleOrder = getLifecycleOrder({ ...event, sentAt: nextTimestamp, sourceID })
    }

    return nextTimestamp
  }

  function installStorageListener(): void {
    if (isStorageListenerInstalled) {
      return
    }

    try {
      window.addEventListener('storage', receiveStorageRefresh)
      isStorageListenerInstalled = true
    } catch {
      // Local authentication must continue when storage events are unavailable.
    }
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
    !Number.isFinite(value.sentAt) ||
    !('type' in value)
  ) {
    return false
  }

  if (value.type === 'session-logged-out') {
    return true
  }

  if (value.type === 'session-expired') {
    return (
      'expiredTokenAt' in value &&
      typeof value.expiredTokenAt === 'number' &&
      Number.isFinite(value.expiredTokenAt)
    )
  }

  if (value.type === 'session-refreshed') {
    return (
      'session' in value &&
      Boolean(value.session) &&
      typeof value.session === 'object' &&
      'exp' in value.session &&
      typeof value.session.exp === 'number' &&
      Number.isFinite(value.session.exp) &&
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
      Number.isFinite(notification.sentAt) &&
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

function compareLifecycleOrders({
  first,
  second,
}: {
  first: LifecycleOrder
  second: LifecycleOrder
}): number {
  if (first.sentAt !== second.sentAt) {
    return first.sentAt - second.sentAt
  }

  const isFirstLogout = first.precedence === 2
  const isSecondLogout = second.precedence === 2

  if (isFirstLogout !== isSecondLogout) {
    return isFirstLogout ? 1 : -1
  }

  if (first.affectedExpirationMs !== second.affectedExpirationMs) {
    return first.affectedExpirationMs - second.affectedExpirationMs
  }

  if (first.precedence !== second.precedence) {
    return first.precedence - second.precedence
  }

  if (first.sourceID === second.sourceID) {
    return 0
  }

  return first.sourceID > second.sourceID ? 1 : -1
}

function getLifecycleOrder(
  event: { sentAt: number; sourceID: string } & AuthSessionSyncEvent,
): LifecycleOrder {
  return {
    affectedExpirationMs:
      event.type === 'session-refreshed'
        ? event.session.exp * 1000
        : event.type === 'session-expired'
          ? event.expiredTokenAt
          : 0,
    precedence: event.type === 'session-logged-out' ? 2 : event.type === 'session-expired' ? 1 : 0,
    sentAt: event.sentAt,
    sourceID: event.sourceID,
  }
}
