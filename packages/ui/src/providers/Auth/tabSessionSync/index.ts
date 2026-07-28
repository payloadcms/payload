import type { UserWithToken } from '../types.js'
import type {
  TabSessionEvent,
  TabSessionLifecycleOrder,
  TabSessionLogoutPublication,
  TabSessionPublication,
  TabSessionReconciliationOptions,
  TabSessionReconciliationResult,
  TabSessionStorageNotification,
} from './types.js'

import { TAB_SESSION_EVENT_TYPES } from './types.js'
import {
  compareLifecycleOrders,
  createTabSessionMessage,
  getLifecycleOrder,
  isTabSessionMessage,
  parseTabSessionStorageNotification,
} from './utilities.js'

export type {
  TabSessionEvent,
  TabSessionEventType,
  TabSessionLogoutPublication,
  TabSessionMessage,
  TabSessionPublication,
  TabSessionReconciliationOptions,
  TabSessionReconciliationResult,
} from './types.js'

export { TAB_SESSION_EVENT_TYPES } from './types.js'

const tabSessionSyncChannelName = 'payload-auth-session-tab-sync'
const tabSessionSyncStorageKey = 'payload:auth-session:tab-sync'

/**
 * Coordinates authentication session state across browser tabs.
 *
 * BroadcastChannel carries complete session events when available. Transient localStorage
 * notifications carry lifecycle metadata only and allow tabs to reconcile through
 * `reconcileSession` when BroadcastChannel is unavailable. Lifecycle ordering prevents older async
 * work from replacing a newer session state.
 */
export function createTabSessionSync({
  getTokenExpirationMs,
  now = Date.now,
  onSessionExpired,
  onSessionLoggedOut,
  onSessionRefreshed,
  onTabSessionUnauthenticated,
  reconcileSession,
  sourceTabID,
}: {
  getTokenExpirationMs: () => number | undefined
  now?: () => number
  onSessionExpired: (expiredTokenAt: number) => void
  onSessionLoggedOut: () => void
  onSessionRefreshed: (session: UserWithToken) => void
  onTabSessionUnauthenticated: () => void
  reconcileSession: (
    options: TabSessionReconciliationOptions,
  ) => Promise<TabSessionReconciliationResult>
  sourceTabID: string
}): {
  cleanup: () => void
  publish: (event: TabSessionEvent) => TabSessionPublication
  publishLogoutSettlement: (publication: TabSessionLogoutPublication) => void
} {
  let channel: BroadcastChannel | undefined
  let isActive = true
  let isStorageListenerInstalled = false
  let latestLifecycleOrder: TabSessionLifecycleOrder | undefined
  let pendingStorageLifecycleOrder: TabSessionLifecycleOrder | undefined

  const receiveBroadcastMessage = ({ data }: MessageEvent<unknown>) => {
    if (!isTabSessionMessage(data) || data.sourceTabID === sourceTabID) {
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

    if (data.type === TAB_SESSION_EVENT_TYPES.REFRESHED) {
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

    if (data.type === TAB_SESSION_EVENT_TYPES.EXPIRED) {
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
    if (event.key !== tabSessionSyncStorageKey || !event.newValue) {
      return
    }

    const notification = parseTabSessionStorageNotification(event.newValue)

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

    if (notification.type === TAB_SESSION_EVENT_TYPES.LOGGED_OUT) {
      pendingStorageLifecycleOrder = undefined
      onSessionLoggedOut()
      return
    }

    const isTabSessionEventStale = () => !isActive || latestLifecycleOrder !== notification

    void reconcileSession({ isTabSessionEventStale })
      .then((result) => {
        if (isTabSessionEventStale()) {
          return
        }

        if (result.status === 'authenticated') {
          pendingStorageLifecycleOrder = undefined
          latestLifecycleOrder = {
            type: TAB_SESSION_EVENT_TYPES.REFRESHED,
            affectedExpirationMs: result.expirationMs,
            refreshStartedAt:
              notification.type === TAB_SESSION_EVENT_TYPES.REFRESHED
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
            type: TAB_SESSION_EVENT_TYPES.LOGGED_OUT,
            affectedExpirationMs: 0,
            sentAt: notification.sentAt,
            sourceTabID: notification.sourceTabID,
          }

          onTabSessionUnauthenticated()
        }
      })
      .catch(() => undefined)
  }

  if (typeof BroadcastChannel === 'function') {
    let nextChannel: BroadcastChannel | undefined

    try {
      nextChannel = new BroadcastChannel(tabSessionSyncChannelName)

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
      const message = createTabSessionMessage({ event, sentAt, sourceTabID })
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

      if (lifecycleOrder.type !== TAB_SESSION_EVENT_TYPES.LOGGED_OUT) {
        publishStorageNotification({ notification: lifecycleOrder })
      }

      return lifecycleOrder
    },
    publishLogoutSettlement: (publication) => {
      const notification: TabSessionStorageNotification = {
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
    notification: TabSessionStorageNotification
  }): void {
    const storageNotification: TabSessionStorageNotification = channel
      ? notification
      : { ...notification, isBroadcastChannelFallback: true }

    try {
      localStorage.setItem(tabSessionSyncStorageKey, JSON.stringify(storageNotification))
    } catch {
      // Local authentication must continue when storage is unavailable.
    }

    try {
      localStorage.removeItem(tabSessionSyncStorageKey)
    } catch {
      // Local authentication must continue when storage is unavailable.
    }
  }
}
