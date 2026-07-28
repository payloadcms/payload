import type {
  CreateTabSessionSyncArgs,
  OnExpiredSession,
  OnLoggedOutSession,
  OnRefreshedSession,
  PublishStorageNotification,
  ReconcileStorageSession,
  TabSessionEvent,
  TabSessionLifecycleOrder,
  TabSessionLogoutPublication,
  TabSessionPublication,
  TabSessionStorageNotification,
} from './types.js'

import { TAB_SESSION_EVENT_TYPES } from './types.js'
import {
  compareLifecycleOrders,
  createTabSessionMessage,
  getLifecycleOrder,
  isTabSessionMessage,
  parseTabSessionStorageNotification,
  tabSessionSyncChannelName,
  tabSessionSyncStorageKey,
} from './utilities.js'

export type {
  CreateTabSessionSyncArgs,
  TabSessionEvent,
  TabSessionEventType,
  TabSessionLogoutPublication,
  TabSessionMessage,
  TabSessionPublication,
  TabSessionReconciliationOptions,
  TabSessionReconciliationResult,
} from './types.js'

export { TAB_SESSION_EVENT_TYPES } from './types.js'

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
}: CreateTabSessionSyncArgs): {
  broadcast: (event: TabSessionEvent) => TabSessionPublication
  broadcastLogoutSettlement: (publication: TabSessionLogoutPublication) => void
  cleanup: () => void
} {
  let channel: BroadcastChannel | undefined
  let isActive = true
  let isStorageListenerInstalled = false
  let latestLifecycleOrder: TabSessionLifecycleOrder | undefined
  let pendingStorageLifecycleOrder: TabSessionLifecycleOrder | undefined

  const onExpiredSession: OnExpiredSession = ({ lifecycleOrder, message }) => {
    const localExpirationMs = getTokenExpirationMs()

    if (localExpirationMs === undefined || localExpirationMs <= message.expiredTokenAt) {
      pendingStorageLifecycleOrder = undefined
      latestLifecycleOrder = lifecycleOrder
      onSessionExpired(message.expiredTokenAt)
    }
  }

  const onLoggedOutSession: OnLoggedOutSession = ({ lifecycleOrder }) => {
    pendingStorageLifecycleOrder = undefined
    latestLifecycleOrder = lifecycleOrder
    onSessionLoggedOut()
  }

  const onRefreshedSession: OnRefreshedSession = ({ lifecycleOrder, message }) => {
    const ondExpirationMs = message.session.exp * 1000
    const localExpirationMs = getTokenExpirationMs()

    if (localExpirationMs === undefined || ondExpirationMs >= localExpirationMs) {
      pendingStorageLifecycleOrder = undefined
      latestLifecycleOrder = lifecycleOrder
      onSessionRefreshed(message.session)
    }
  }

  const handleChannelMessage = ({ data }: MessageEvent<unknown>) => {
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

    switch (data.type) {
      case TAB_SESSION_EVENT_TYPES.EXPIRED:
        onExpiredSession({ lifecycleOrder, message: data })
        break

      case TAB_SESSION_EVENT_TYPES.LOGGED_OUT:
        onLoggedOutSession({ lifecycleOrder })
        break

      case TAB_SESSION_EVENT_TYPES.REFRESHED:
        onRefreshedSession({ lifecycleOrder, message: data })
        break
    }
  }

  const reconcileStorageSession: ReconcileStorageSession = ({ notification }) => {
    const isTabSessionEventStale = () => !isActive || latestLifecycleOrder !== notification

    void reconcileSession({ isTabSessionEventStale })
      .then((result) => {
        if (!isTabSessionEventStale()) {
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
          } else if (result.status === 'unauthenticated') {
            pendingStorageLifecycleOrder = undefined
            latestLifecycleOrder = {
              type: TAB_SESSION_EVENT_TYPES.LOGGED_OUT,
              affectedExpirationMs: 0,
              sentAt: notification.sentAt,
              sourceTabID: notification.sourceTabID,
            }

            onTabSessionUnauthenticated()
          }
        }
      })
      .catch(() => undefined)
  }

  const handleStorageNotification = (event: StorageEvent) => {
    const notification = parseTabSessionStorageNotification(event)

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
      onLoggedOutSession({ lifecycleOrder: notification })
    } else {
      reconcileStorageSession({ notification })
    }
  }

  function closeChannel(channelToClose: BroadcastChannel | undefined): void {
    if (!channelToClose) {
      return
    }

    try {
      channelToClose.removeEventListener('message', handleChannelMessage)
    } catch {
      // Cross-tab synchronization cleanup is best-effort.
    }

    try {
      channelToClose.close()
    } catch {
      // Cross-tab synchronization cleanup is best-effort.
    }
  }

  function attachStorageListener(): void {
    if (isStorageListenerInstalled) {
      return
    }

    try {
      window.addEventListener('storage', handleStorageNotification)
      isStorageListenerInstalled = true
    } catch {
      // Local authentication must continue when storage events are unavailable.
    }
  }

  function downgradeToStorage(): void {
    closeChannel(channel)
    channel = undefined
    attachStorageListener()
  }

  function getNextLifecycleTimestamp(): number {
    const currentTime = now()
    const latestSentAt = latestLifecycleOrder?.sentAt ?? Number.NEGATIVE_INFINITY

    return currentTime > latestSentAt ? currentTime : latestSentAt + 1
  }

  const publishStorageNotification: PublishStorageNotification = ({ notification }) => {
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

  if (typeof BroadcastChannel === 'function') {
    let nextChannel: BroadcastChannel | undefined

    try {
      nextChannel = new BroadcastChannel(tabSessionSyncChannelName)

      nextChannel.addEventListener('message', handleChannelMessage)
      channel = nextChannel
    } catch {
      closeChannel(nextChannel)
      channel = undefined
    }
  }

  attachStorageListener()

  return {
    broadcast: (event) => {
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
    broadcastLogoutSettlement: (publication) => {
      const notification: TabSessionStorageNotification = {
        ...publication,
        sentAt: getNextLifecycleTimestamp(),
        settlesSentAt: publication.sentAt,
      }

      pendingStorageLifecycleOrder = undefined
      latestLifecycleOrder = notification
      publishStorageNotification({ notification })
    },
    cleanup: () => {
      isActive = false
      pendingStorageLifecycleOrder = undefined
      closeChannel(channel)
      channel = undefined

      if (isStorageListenerInstalled) {
        try {
          window.removeEventListener('storage', handleStorageNotification)
        } catch {
          // Cross-tab synchronization cleanup is best-effort.
        }

        isStorageListenerInstalled = false
      }
    },
  }
}
