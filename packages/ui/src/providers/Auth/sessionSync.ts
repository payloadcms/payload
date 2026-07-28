import type { UserWithToken } from './types.js'

export const AUTH_SESSION_SYNC_EVENT_TYPES = {
  EXPIRED: 'session-expired',
  LOGGED_OUT: 'session-logged-out',
  REFRESHED: 'session-refreshed',
} as const

export type AuthSessionSyncEventType =
  (typeof AUTH_SESSION_SYNC_EVENT_TYPES)[keyof typeof AUTH_SESSION_SYNC_EVENT_TYPES]

export type AuthSessionSyncMessage =
  | {
      expiredTokenAt: number
      sentAt: number
      sourceID: string
      type: typeof AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED
    }
  | {
      refreshStartedAt: number
      sentAt: number
      session: UserWithToken
      sourceID: string
      type: typeof AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED
    }
  | {
      sentAt: number
      sourceID: string
      type: typeof AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT
    }

export type AuthSessionSyncEvent =
  | {
      expiredTokenAt: number
      type: typeof AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED
    }
  | {
      refreshStartedAt: number
      session: UserWithToken
      type: typeof AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED
    }
  | {
      type: typeof AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT
    }

export type AuthSessionResyncOptions = {
  isSessionEventStale: () => boolean
}

export type AuthSessionResyncResult<T = unknown> =
  | {
      expirationMs: number
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

export type AuthSessionSyncPublication =
  | {
      affectedExpirationMs: 0
      sentAt: number
      sourceID: string
      type: typeof AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT
    }
  | {
      affectedExpirationMs: number
      refreshStartedAt: number
      sentAt: number
      sourceID: string
      type: typeof AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED
    }
  | {
      affectedExpirationMs: number
      sentAt: number
      sourceID: string
      type: typeof AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED
    }

export type AuthSessionLogoutPublication = Extract<
  AuthSessionSyncPublication,
  { type: typeof AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT }
>

type StorageRefreshNotification = {
  isBroadcastChannelFallback?: true
} & (
  | ({ settlesSentAt: number } & AuthSessionLogoutPublication)
  | Extract<AuthSessionSyncPublication, { type: typeof AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED }>
  | Extract<AuthSessionSyncPublication, { type: typeof AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED }>
)

type LifecycleOrder = AuthSessionSyncPublication

/**
 * Synchronizes session refresh, expiration, and logout events across same-origin tabs.
 *
 * BroadcastChannel carries complete session events when available. Transient localStorage
 * notifications carry lifecycle metadata only and allow tabs to reconcile through `fetchFullUser`
 * when BroadcastChannel is unavailable. Lifecycle ordering prevents older async work from
 * replacing a newer session state.
 */
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
  fetchFullUser: (options: AuthSessionResyncOptions) => Promise<AuthSessionResyncResult>
  getTokenExpirationMs: () => number | undefined
  now?: () => number
  onSessionExpired: (expiredTokenAt: number) => void
  onSessionLoggedOut: () => void
  onSessionRefreshed: (session: UserWithToken) => void
  onSessionResyncUnauthenticated: () => void
  sourceID: string
}): {
  cleanup: () => void
  publish: (event: AuthSessionSyncEvent) => AuthSessionSyncPublication
  publishStorageRefresh: (publication: AuthSessionLogoutPublication) => void
} {
  let channel: BroadcastChannel | undefined
  let isActive = true
  let isStorageListenerInstalled = false
  let latestLifecycleOrder: LifecycleOrder | undefined
  let pendingStorageLifecycleOrder: LifecycleOrder | undefined

  const receiveMessage = ({ data }: MessageEvent<unknown>) => {
    if (!isAuthSessionSyncMessage(data) || data.sourceID === sourceID) {
      return
    }

    const lifecycleOrder = getLifecycleOrder(data)
    const lifecycleComparison = latestLifecycleOrder
      ? compareLifecycleOrders({ first: lifecycleOrder, second: latestLifecycleOrder })
      : undefined
    const resolvesPendingStorageBarrier =
      lifecycleComparison === 0 && pendingStorageLifecycleOrder === latestLifecycleOrder

    if (
      lifecycleComparison !== undefined &&
      (lifecycleComparison < 0 || (lifecycleComparison === 0 && !resolvesPendingStorageBarrier))
    ) {
      return
    }

    if (data.type === AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED) {
      const receivedExpirationMs = data.session.exp * 1000
      const localExpirationMs = getTokenExpirationMs()

      if (localExpirationMs !== undefined && receivedExpirationMs < localExpirationMs) {
        return
      }

      pendingStorageLifecycleOrder = undefined
      latestLifecycleOrder = lifecycleOrder
      onSessionRefreshed(data.session)
      return
    }

    if (data.type === AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED) {
      const localExpirationMs = getTokenExpirationMs()

      if (localExpirationMs !== undefined && localExpirationMs > data.expiredTokenAt) {
        return
      }

      pendingStorageLifecycleOrder = undefined
      latestLifecycleOrder = lifecycleOrder
      onSessionExpired(data.expiredTokenAt)
      return
    }

    pendingStorageLifecycleOrder = undefined
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

    if (channel && !notification.isBroadcastChannelFallback) {
      return
    }

    if (
      latestLifecycleOrder &&
      compareLifecycleOrders({ first: notification, second: latestLifecycleOrder }) <= 0
    ) {
      return
    }

    pendingStorageLifecycleOrder = notification
    latestLifecycleOrder = notification

    if (notification.type === AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT) {
      pendingStorageLifecycleOrder = undefined
      onSessionLoggedOut()
      return
    }

    const isSessionEventStale = () => !isActive || latestLifecycleOrder !== notification

    void fetchFullUser({ isSessionEventStale })
      .then((result) => {
        if (isSessionEventStale()) {
          return
        }

        if (result.status === 'authenticated') {
          pendingStorageLifecycleOrder = undefined
          latestLifecycleOrder = {
            type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
            affectedExpirationMs: result.expirationMs,
            refreshStartedAt:
              notification.type === AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED
                ? notification.refreshStartedAt
                : notification.sentAt,
            sentAt: notification.sentAt,
            sourceID: notification.sourceID,
          }
          return
        }

        if (result.status === 'unauthenticated') {
          pendingStorageLifecycleOrder = undefined
          latestLifecycleOrder = {
            type: AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT,
            affectedExpirationMs: 0,
            sentAt: notification.sentAt,
            sourceID: notification.sourceID,
          }

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
      isActive = false
      pendingStorageLifecycleOrder = undefined
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
      const sentAt = getNextLifecycleTimestamp()
      const message = createAuthSessionSyncMessage({ event, sentAt, sourceID })
      const lifecycleOrder = getLifecycleOrder(message)

      pendingStorageLifecycleOrder = undefined
      latestLifecycleOrder = lifecycleOrder

      if (channel) {
        try {
          channel.postMessage(message)
        } catch {
          downgradeToStorage()
        }
      }

      if (lifecycleOrder.type !== AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT) {
        publishStorageNotification({ notification: lifecycleOrder })
      }

      return lifecycleOrder
    },
    publishStorageRefresh: (publication) => {
      const notification: StorageRefreshNotification = {
        ...publication,
        sentAt: getNextLifecycleTimestamp(),
        settlesSentAt: publication.sentAt,
      }

      pendingStorageLifecycleOrder = undefined
      latestLifecycleOrder = notification
      publishStorageNotification({ notification })
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

  function getNextLifecycleTimestamp(): number {
    const currentTime = now()
    const latestSentAt = latestLifecycleOrder?.sentAt ?? Number.NEGATIVE_INFINITY

    return currentTime > latestSentAt ? currentTime : latestSentAt + 1
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

  function publishStorageNotification({
    notification,
  }: {
    notification: StorageRefreshNotification
  }): void {
    const storageNotification: StorageRefreshNotification = channel
      ? notification
      : { ...notification, isBroadcastChannelFallback: true }

    try {
      localStorage.setItem(authSessionSyncStorageKey, JSON.stringify(storageNotification))
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

  if (value.type === AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT) {
    return true
  }

  if (value.type === AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED) {
    return (
      'expiredTokenAt' in value &&
      typeof value.expiredTokenAt === 'number' &&
      Number.isFinite(value.expiredTokenAt)
    )
  }

  if (value.type === AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED) {
    return (
      'refreshStartedAt' in value &&
      typeof value.refreshStartedAt === 'number' &&
      Number.isFinite(value.refreshStartedAt) &&
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
      'affectedExpirationMs' in notification &&
      typeof notification.affectedExpirationMs === 'number' &&
      Number.isFinite(notification.affectedExpirationMs) &&
      'sentAt' in notification &&
      typeof notification.sentAt === 'number' &&
      Number.isFinite(notification.sentAt) &&
      'sourceID' in notification &&
      typeof notification.sourceID === 'string' &&
      'type' in notification &&
      isAuthSessionSyncEventType(notification.type)
    ) {
      const lifecycleOrder = {
        affectedExpirationMs: notification.affectedExpirationMs,
        sentAt: notification.sentAt,
        sourceID: notification.sourceID,
      }
      const isBroadcastChannelFallback =
        'isBroadcastChannelFallback' in notification &&
        notification.isBroadcastChannelFallback === true
          ? true
          : undefined

      if (notification.type === AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED) {
        if ('settlesSentAt' in notification) {
          return null
        }

        return {
          type: notification.type,
          ...lifecycleOrder,
          isBroadcastChannelFallback,
        }
      }

      if (notification.type === AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED) {
        if (
          'settlesSentAt' in notification ||
          !('refreshStartedAt' in notification) ||
          typeof notification.refreshStartedAt !== 'number' ||
          !Number.isFinite(notification.refreshStartedAt)
        ) {
          return null
        }

        return {
          type: notification.type,
          ...lifecycleOrder,
          isBroadcastChannelFallback,
          refreshStartedAt: notification.refreshStartedAt,
        }
      }

      if (
        notification.affectedExpirationMs === 0 &&
        'settlesSentAt' in notification &&
        typeof notification.settlesSentAt === 'number' &&
        Number.isFinite(notification.settlesSentAt)
      ) {
        return {
          type: notification.type,
          affectedExpirationMs: 0,
          isBroadcastChannelFallback,
          sentAt: notification.sentAt,
          settlesSentAt: notification.settlesSentAt,
          sourceID: notification.sourceID,
        }
      }
    }
  } catch {
    // Ignore storage writes that do not belong to session synchronization.
  }

  return null
}

/**
 * Orders two lifecycle events from oldest to newest.
 *
 * A refresh is ordered from when it started rather than when its response was published. This
 * prevents a refresh that began before a logout or expiration from restoring that older session.
 */
function compareLifecycleOrders({
  first,
  second,
}: {
  first: LifecycleOrder
  second: LifecycleOrder
}): number {
  const isFirstRefresh = first.type === AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED
  const isSecondRefresh = second.type === AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED

  if (isFirstRefresh !== isSecondRefresh) {
    const firstOrderingFence = getLifecycleOrderingFence(first)
    const secondOrderingFence = getLifecycleOrderingFence(second)

    if (firstOrderingFence !== secondOrderingFence) {
      return firstOrderingFence - secondOrderingFence
    }
  }

  const isFirstLogout = first.type === AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT
  const isSecondLogout = second.type === AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT

  if (isFirstLogout !== isSecondLogout) {
    return isFirstLogout ? 1 : -1
  }

  if (first.sentAt !== second.sentAt) {
    return first.sentAt - second.sentAt
  }

  if (first.affectedExpirationMs !== second.affectedExpirationMs) {
    return first.affectedExpirationMs - second.affectedExpirationMs
  }

  const firstPrecedence = getLifecyclePrecedence(first.type)
  const secondPrecedence = getLifecyclePrecedence(second.type)

  if (firstPrecedence !== secondPrecedence) {
    return firstPrecedence - secondPrecedence
  }

  return compareSourceIDs({ first: first.sourceID, second: second.sourceID })
}

function getLifecycleOrder(
  event: { sentAt: number; sourceID: string } & AuthSessionSyncEvent,
): LifecycleOrder {
  const lifecycleMetadata = {
    sentAt: event.sentAt,
    sourceID: event.sourceID,
  }

  if (event.type === AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED) {
    return {
      type: event.type,
      affectedExpirationMs: event.session.exp * 1000,
      refreshStartedAt: event.refreshStartedAt,
      ...lifecycleMetadata,
    }
  }

  if (event.type === AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED) {
    return {
      type: event.type,
      affectedExpirationMs: event.expiredTokenAt,
      ...lifecycleMetadata,
    }
  }

  return { type: event.type, affectedExpirationMs: 0, ...lifecycleMetadata }
}

function createAuthSessionSyncMessage({
  event,
  sentAt,
  sourceID,
}: {
  event: AuthSessionSyncEvent
  sentAt: number
  sourceID: string
}): AuthSessionSyncMessage {
  if (event.type === AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED) {
    return {
      type: event.type,
      refreshStartedAt: event.refreshStartedAt,
      sentAt,
      session: event.session,
      sourceID,
    }
  }

  if (event.type === AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED) {
    return { type: event.type, expiredTokenAt: event.expiredTokenAt, sentAt, sourceID }
  }

  return { type: event.type, sentAt, sourceID }
}

function compareSourceIDs({ first, second }: { first: string; second: string }): number {
  if (first === second) {
    return 0
  }

  return first > second ? 1 : -1
}

/** Returns the point in time when a lifecycle event began affecting the session. */
function getLifecycleOrderingFence(order: LifecycleOrder): number {
  return order.type === AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED
    ? order.refreshStartedAt
    : order.sentAt
}

function getLifecyclePrecedence(type: AuthSessionSyncEventType): number {
  if (type === AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED) {
    return 1
  }

  return type === AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT ? 2 : 0
}

function isAuthSessionSyncEventType(value: unknown): value is AuthSessionSyncEventType {
  return Object.values(AUTH_SESSION_SYNC_EVENT_TYPES).some((eventType) => eventType === value)
}
