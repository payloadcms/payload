import type { UserWithToken } from './types.js'

export const CROSS_TAB_SESSION_EVENT_TYPES = {
  EXPIRED: 'session-expired',
  LOGGED_OUT: 'session-logged-out',
  REFRESHED: 'session-refreshed',
} as const

export type CrossTabSessionEventType =
  (typeof CROSS_TAB_SESSION_EVENT_TYPES)[keyof typeof CROSS_TAB_SESSION_EVENT_TYPES]

export type CrossTabSessionMessage =
  | {
      expiredTokenAt: number
      sentAt: number
      sourceTabID: string
      type: typeof CROSS_TAB_SESSION_EVENT_TYPES.EXPIRED
    }
  | {
      refreshStartedAt: number
      sentAt: number
      session: UserWithToken
      sourceTabID: string
      type: typeof CROSS_TAB_SESSION_EVENT_TYPES.REFRESHED
    }
  | {
      sentAt: number
      sourceTabID: string
      type: typeof CROSS_TAB_SESSION_EVENT_TYPES.LOGGED_OUT
    }

export type CrossTabSessionEvent =
  | {
      expiredTokenAt: number
      type: typeof CROSS_TAB_SESSION_EVENT_TYPES.EXPIRED
    }
  | {
      refreshStartedAt: number
      session: UserWithToken
      type: typeof CROSS_TAB_SESSION_EVENT_TYPES.REFRESHED
    }
  | {
      type: typeof CROSS_TAB_SESSION_EVENT_TYPES.LOGGED_OUT
    }

export type CrossTabSessionReconciliationOptions = {
  isCrossTabEventStale: () => boolean
}

export type CrossTabSessionReconciliationResult<T = unknown> =
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

const crossTabSessionChannelName = 'payload-auth-session-cross-tab'
const crossTabSessionStorageKey = 'payload:auth-session:cross-tab'

export type CrossTabSessionPublication =
  | {
      affectedExpirationMs: 0
      sentAt: number
      sourceTabID: string
      type: typeof CROSS_TAB_SESSION_EVENT_TYPES.LOGGED_OUT
    }
  | {
      affectedExpirationMs: number
      refreshStartedAt: number
      sentAt: number
      sourceTabID: string
      type: typeof CROSS_TAB_SESSION_EVENT_TYPES.REFRESHED
    }
  | {
      affectedExpirationMs: number
      sentAt: number
      sourceTabID: string
      type: typeof CROSS_TAB_SESSION_EVENT_TYPES.EXPIRED
    }

export type CrossTabSessionLogoutPublication = Extract<
  CrossTabSessionPublication,
  { type: typeof CROSS_TAB_SESSION_EVENT_TYPES.LOGGED_OUT }
>

type CrossTabStorageNotification = {
  isBroadcastChannelFallback?: true
} & (
  | ({ settlesSentAt: number } & CrossTabSessionLogoutPublication)
  | Extract<CrossTabSessionPublication, { type: typeof CROSS_TAB_SESSION_EVENT_TYPES.EXPIRED }>
  | Extract<CrossTabSessionPublication, { type: typeof CROSS_TAB_SESSION_EVENT_TYPES.REFRESHED }>
)

type LifecycleOrder = CrossTabSessionPublication

/**
 * Coordinates authentication session state across browser tabs.
 *
 * BroadcastChannel carries complete session events when available. Transient localStorage
 * notifications carry lifecycle metadata only and allow tabs to reconcile through
 * `reconcileSession` when BroadcastChannel is unavailable. Lifecycle ordering prevents older async
 * work from replacing a newer session state.
 */
export function createCrossTabSessionSync({
  getTokenExpirationMs,
  now = Date.now,
  onCrossTabSessionUnauthenticated,
  onSessionExpired,
  onSessionLoggedOut,
  onSessionRefreshed,
  reconcileSession,
  sourceTabID,
}: {
  getTokenExpirationMs: () => number | undefined
  now?: () => number
  onCrossTabSessionUnauthenticated: () => void
  onSessionExpired: (expiredTokenAt: number) => void
  onSessionLoggedOut: () => void
  onSessionRefreshed: (session: UserWithToken) => void
  reconcileSession: (
    options: CrossTabSessionReconciliationOptions,
  ) => Promise<CrossTabSessionReconciliationResult>
  sourceTabID: string
}): {
  cleanup: () => void
  publish: (event: CrossTabSessionEvent) => CrossTabSessionPublication
  publishLogoutSettlement: (publication: CrossTabSessionLogoutPublication) => void
} {
  let channel: BroadcastChannel | undefined
  let isActive = true
  let isStorageListenerInstalled = false
  let latestLifecycleOrder: LifecycleOrder | undefined
  let pendingStorageLifecycleOrder: LifecycleOrder | undefined

  const receiveBroadcastMessage = ({ data }: MessageEvent<unknown>) => {
    if (!isCrossTabSessionMessage(data) || data.sourceTabID === sourceTabID) {
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

    if (data.type === CROSS_TAB_SESSION_EVENT_TYPES.REFRESHED) {
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

    if (data.type === CROSS_TAB_SESSION_EVENT_TYPES.EXPIRED) {
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

  const receiveStorageNotification = (event: StorageEvent) => {
    if (event.key !== crossTabSessionStorageKey || !event.newValue) {
      return
    }

    const notification = parseCrossTabStorageNotification(event.newValue)

    if (!notification || notification.sourceTabID === sourceTabID) {
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

    if (notification.type === CROSS_TAB_SESSION_EVENT_TYPES.LOGGED_OUT) {
      pendingStorageLifecycleOrder = undefined
      onSessionLoggedOut()
      return
    }

    const isCrossTabEventStale = () => !isActive || latestLifecycleOrder !== notification

    void reconcileSession({ isCrossTabEventStale })
      .then((result) => {
        if (isCrossTabEventStale()) {
          return
        }

        if (result.status === 'authenticated') {
          pendingStorageLifecycleOrder = undefined
          latestLifecycleOrder = {
            type: CROSS_TAB_SESSION_EVENT_TYPES.REFRESHED,
            affectedExpirationMs: result.expirationMs,
            refreshStartedAt:
              notification.type === CROSS_TAB_SESSION_EVENT_TYPES.REFRESHED
                ? notification.refreshStartedAt
                : notification.sentAt,
            sentAt: notification.sentAt,
            sourceTabID: notification.sourceTabID,
          }
          return
        }

        if (result.status === 'unauthenticated') {
          pendingStorageLifecycleOrder = undefined
          latestLifecycleOrder = {
            type: CROSS_TAB_SESSION_EVENT_TYPES.LOGGED_OUT,
            affectedExpirationMs: 0,
            sentAt: notification.sentAt,
            sourceTabID: notification.sourceTabID,
          }

          onCrossTabSessionUnauthenticated()
        }
      })
      .catch(() => undefined)
  }

  if (typeof BroadcastChannel === 'function') {
    let nextChannel: BroadcastChannel | undefined

    try {
      nextChannel = new BroadcastChannel(crossTabSessionChannelName)

      nextChannel.addEventListener('message', receiveBroadcastMessage)
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
          window.removeEventListener('storage', receiveStorageNotification)
        } catch {
          // Cross-tab synchronization cleanup is best-effort.
        }

        isStorageListenerInstalled = false
      }
    },
    publish: (event) => {
      const sentAt = getNextLifecycleTimestamp()
      const message = createCrossTabSessionMessage({ event, sentAt, sourceTabID })
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

      if (lifecycleOrder.type !== CROSS_TAB_SESSION_EVENT_TYPES.LOGGED_OUT) {
        publishStorageNotification({ notification: lifecycleOrder })
      }

      return lifecycleOrder
    },
    publishLogoutSettlement: (publication) => {
      const notification: CrossTabStorageNotification = {
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
      channelToClose.removeEventListener('message', receiveBroadcastMessage)
    } catch {
      // Cross-tab synchronization cleanup is best-effort.
    }

    try {
      channelToClose.close()
    } catch {
      // Cross-tab synchronization cleanup is best-effort.
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
      window.addEventListener('storage', receiveStorageNotification)
      isStorageListenerInstalled = true
    } catch {
      // Local authentication must continue when storage events are unavailable.
    }
  }

  function publishStorageNotification({
    notification,
  }: {
    notification: CrossTabStorageNotification
  }): void {
    const storageNotification: CrossTabStorageNotification = channel
      ? notification
      : { ...notification, isBroadcastChannelFallback: true }

    try {
      localStorage.setItem(crossTabSessionStorageKey, JSON.stringify(storageNotification))
    } catch {
      // Local authentication must continue when storage is unavailable.
    }

    try {
      localStorage.removeItem(crossTabSessionStorageKey)
    } catch {
      // Local authentication must continue when storage is unavailable.
    }
  }
}

function isCrossTabSessionMessage(value: unknown): value is CrossTabSessionMessage {
  if (
    !value ||
    typeof value !== 'object' ||
    !('sourceTabID' in value) ||
    typeof value.sourceTabID !== 'string' ||
    !('sentAt' in value) ||
    typeof value.sentAt !== 'number' ||
    !Number.isFinite(value.sentAt) ||
    !('type' in value)
  ) {
    return false
  }

  if (value.type === CROSS_TAB_SESSION_EVENT_TYPES.LOGGED_OUT) {
    return true
  }

  if (value.type === CROSS_TAB_SESSION_EVENT_TYPES.EXPIRED) {
    return (
      'expiredTokenAt' in value &&
      typeof value.expiredTokenAt === 'number' &&
      Number.isFinite(value.expiredTokenAt)
    )
  }

  if (value.type === CROSS_TAB_SESSION_EVENT_TYPES.REFRESHED) {
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

function parseCrossTabStorageNotification(value: string): CrossTabStorageNotification | null {
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
      'sourceTabID' in notification &&
      typeof notification.sourceTabID === 'string' &&
      'type' in notification &&
      isCrossTabSessionEventType(notification.type)
    ) {
      const lifecycleOrder = {
        affectedExpirationMs: notification.affectedExpirationMs,
        sentAt: notification.sentAt,
        sourceTabID: notification.sourceTabID,
      }
      const isBroadcastChannelFallback =
        'isBroadcastChannelFallback' in notification &&
        notification.isBroadcastChannelFallback === true
          ? true
          : undefined

      if (notification.type === CROSS_TAB_SESSION_EVENT_TYPES.EXPIRED) {
        if ('settlesSentAt' in notification) {
          return null
        }

        return {
          type: notification.type,
          ...lifecycleOrder,
          isBroadcastChannelFallback,
        }
      }

      if (notification.type === CROSS_TAB_SESSION_EVENT_TYPES.REFRESHED) {
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
          sourceTabID: notification.sourceTabID,
        }
      }
    }
  } catch {
    // Ignore storage writes that do not belong to cross-tab session synchronization.
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
  const isFirstRefresh = first.type === CROSS_TAB_SESSION_EVENT_TYPES.REFRESHED
  const isSecondRefresh = second.type === CROSS_TAB_SESSION_EVENT_TYPES.REFRESHED

  if (isFirstRefresh !== isSecondRefresh) {
    const firstOrderingFence = getLifecycleOrderingFence(first)
    const secondOrderingFence = getLifecycleOrderingFence(second)

    if (firstOrderingFence !== secondOrderingFence) {
      return firstOrderingFence - secondOrderingFence
    }
  }

  const isFirstLogout = first.type === CROSS_TAB_SESSION_EVENT_TYPES.LOGGED_OUT
  const isSecondLogout = second.type === CROSS_TAB_SESSION_EVENT_TYPES.LOGGED_OUT

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

  return compareSourceTabIDs({ first: first.sourceTabID, second: second.sourceTabID })
}

function getLifecycleOrder(
  event: { sentAt: number; sourceTabID: string } & CrossTabSessionEvent,
): LifecycleOrder {
  const lifecycleMetadata = {
    sentAt: event.sentAt,
    sourceTabID: event.sourceTabID,
  }

  if (event.type === CROSS_TAB_SESSION_EVENT_TYPES.REFRESHED) {
    return {
      type: event.type,
      affectedExpirationMs: event.session.exp * 1000,
      refreshStartedAt: event.refreshStartedAt,
      ...lifecycleMetadata,
    }
  }

  if (event.type === CROSS_TAB_SESSION_EVENT_TYPES.EXPIRED) {
    return {
      type: event.type,
      affectedExpirationMs: event.expiredTokenAt,
      ...lifecycleMetadata,
    }
  }

  return { type: event.type, affectedExpirationMs: 0, ...lifecycleMetadata }
}

function createCrossTabSessionMessage({
  event,
  sentAt,
  sourceTabID,
}: {
  event: CrossTabSessionEvent
  sentAt: number
  sourceTabID: string
}): CrossTabSessionMessage {
  if (event.type === CROSS_TAB_SESSION_EVENT_TYPES.REFRESHED) {
    return {
      type: event.type,
      refreshStartedAt: event.refreshStartedAt,
      sentAt,
      session: event.session,
      sourceTabID,
    }
  }

  if (event.type === CROSS_TAB_SESSION_EVENT_TYPES.EXPIRED) {
    return { type: event.type, expiredTokenAt: event.expiredTokenAt, sentAt, sourceTabID }
  }

  return { type: event.type, sentAt, sourceTabID }
}

function compareSourceTabIDs({ first, second }: { first: string; second: string }): number {
  if (first === second) {
    return 0
  }

  return first > second ? 1 : -1
}

/** Returns the point in time when a lifecycle event began affecting the session. */
function getLifecycleOrderingFence(order: LifecycleOrder): number {
  return order.type === CROSS_TAB_SESSION_EVENT_TYPES.REFRESHED
    ? order.refreshStartedAt
    : order.sentAt
}

function getLifecyclePrecedence(type: CrossTabSessionEventType): number {
  if (type === CROSS_TAB_SESSION_EVENT_TYPES.EXPIRED) {
    return 1
  }

  return type === CROSS_TAB_SESSION_EVENT_TYPES.LOGGED_OUT ? 2 : 0
}

function isCrossTabSessionEventType(value: unknown): value is CrossTabSessionEventType {
  return Object.values(CROSS_TAB_SESSION_EVENT_TYPES).some((eventType) => eventType === value)
}
