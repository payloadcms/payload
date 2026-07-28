import type {
  TabSessionEvent,
  TabSessionEventType,
  TabSessionLifecycleOrder,
  TabSessionMessage,
  TabSessionStorageNotification,
} from './types.js'

import { TAB_SESSION_EVENT_TYPES } from './types.js'

export function isTabSessionMessage(value: unknown): value is TabSessionMessage {
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

  if (value.type === TAB_SESSION_EVENT_TYPES.LOGGED_OUT) {
    return true
  }

  if (value.type === TAB_SESSION_EVENT_TYPES.EXPIRED) {
    return (
      'expiredTokenAt' in value &&
      typeof value.expiredTokenAt === 'number' &&
      Number.isFinite(value.expiredTokenAt)
    )
  }

  if (value.type === TAB_SESSION_EVENT_TYPES.REFRESHED) {
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

export function parseTabSessionStorageNotification(
  value: string,
): null | TabSessionStorageNotification {
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
      isTabSessionEventType(notification.type)
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

      if (notification.type === TAB_SESSION_EVENT_TYPES.EXPIRED) {
        if ('settlesSentAt' in notification) {
          return null
        }

        return {
          type: notification.type,
          ...lifecycleOrder,
          isBroadcastChannelFallback,
        }
      }

      if (notification.type === TAB_SESSION_EVENT_TYPES.REFRESHED) {
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
export function compareLifecycleOrders({
  first,
  second,
}: {
  first: TabSessionLifecycleOrder
  second: TabSessionLifecycleOrder
}): number {
  const isFirstRefresh = first.type === TAB_SESSION_EVENT_TYPES.REFRESHED
  const isSecondRefresh = second.type === TAB_SESSION_EVENT_TYPES.REFRESHED

  if (isFirstRefresh !== isSecondRefresh) {
    const firstOrderingFence = getLifecycleOrderingFence(first)
    const secondOrderingFence = getLifecycleOrderingFence(second)

    if (firstOrderingFence !== secondOrderingFence) {
      return firstOrderingFence - secondOrderingFence
    }
  }

  const isFirstLogout = first.type === TAB_SESSION_EVENT_TYPES.LOGGED_OUT
  const isSecondLogout = second.type === TAB_SESSION_EVENT_TYPES.LOGGED_OUT

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

export function getLifecycleOrder(
  event: { sentAt: number; sourceTabID: string } & TabSessionEvent,
): TabSessionLifecycleOrder {
  const lifecycleMetadata = {
    sentAt: event.sentAt,
    sourceTabID: event.sourceTabID,
  }

  if (event.type === TAB_SESSION_EVENT_TYPES.REFRESHED) {
    return {
      type: event.type,
      affectedExpirationMs: event.session.exp * 1000,
      refreshStartedAt: event.refreshStartedAt,
      ...lifecycleMetadata,
    }
  }

  if (event.type === TAB_SESSION_EVENT_TYPES.EXPIRED) {
    return {
      type: event.type,
      affectedExpirationMs: event.expiredTokenAt,
      ...lifecycleMetadata,
    }
  }

  return { type: event.type, affectedExpirationMs: 0, ...lifecycleMetadata }
}

export function createTabSessionMessage({
  event,
  sentAt,
  sourceTabID,
}: {
  event: TabSessionEvent
  sentAt: number
  sourceTabID: string
}): TabSessionMessage {
  if (event.type === TAB_SESSION_EVENT_TYPES.REFRESHED) {
    return {
      type: event.type,
      refreshStartedAt: event.refreshStartedAt,
      sentAt,
      session: event.session,
      sourceTabID,
    }
  }

  if (event.type === TAB_SESSION_EVENT_TYPES.EXPIRED) {
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
function getLifecycleOrderingFence(order: TabSessionLifecycleOrder): number {
  return order.type === TAB_SESSION_EVENT_TYPES.REFRESHED ? order.refreshStartedAt : order.sentAt
}

function getLifecyclePrecedence(type: TabSessionEventType): number {
  if (type === TAB_SESSION_EVENT_TYPES.EXPIRED) {
    return 1
  }

  return type === TAB_SESSION_EVENT_TYPES.LOGGED_OUT ? 2 : 0
}

function isTabSessionEventType(value: unknown): value is TabSessionEventType {
  return Object.values(TAB_SESSION_EVENT_TYPES).some((eventType) => eventType === value)
}
