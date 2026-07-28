import type { UserWithToken } from '../types.js'

export const TAB_SESSION_EVENT_TYPES = {
  EXPIRED: 'session-expired',
  LOGGED_OUT: 'session-logged-out',
  REFRESHED: 'session-refreshed',
} as const

export type TabSessionEventType =
  (typeof TAB_SESSION_EVENT_TYPES)[keyof typeof TAB_SESSION_EVENT_TYPES]

export type TabSessionMessage =
  | {
      expiredTokenAt: number
      sentAt: number
      sourceTabID: string
      type: typeof TAB_SESSION_EVENT_TYPES.EXPIRED
    }
  | {
      refreshStartedAt: number
      sentAt: number
      session: UserWithToken
      sourceTabID: string
      type: typeof TAB_SESSION_EVENT_TYPES.REFRESHED
    }
  | {
      sentAt: number
      sourceTabID: string
      type: typeof TAB_SESSION_EVENT_TYPES.LOGGED_OUT
    }

export type TabSessionEvent =
  | {
      expiredTokenAt: number
      type: typeof TAB_SESSION_EVENT_TYPES.EXPIRED
    }
  | {
      refreshStartedAt: number
      session: UserWithToken
      type: typeof TAB_SESSION_EVENT_TYPES.REFRESHED
    }
  | {
      type: typeof TAB_SESSION_EVENT_TYPES.LOGGED_OUT
    }

export type TabSessionReconciliationOptions = {
  isTabSessionEventStale: () => boolean
}

export type TabSessionReconciliationResult<T = unknown> =
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

export type TabSessionPublication =
  | {
      affectedExpirationMs: 0
      sentAt: number
      sourceTabID: string
      type: typeof TAB_SESSION_EVENT_TYPES.LOGGED_OUT
    }
  | {
      affectedExpirationMs: number
      refreshStartedAt: number
      sentAt: number
      sourceTabID: string
      type: typeof TAB_SESSION_EVENT_TYPES.REFRESHED
    }
  | {
      affectedExpirationMs: number
      sentAt: number
      sourceTabID: string
      type: typeof TAB_SESSION_EVENT_TYPES.EXPIRED
    }

export type TabSessionLogoutPublication = Extract<
  TabSessionPublication,
  { type: typeof TAB_SESSION_EVENT_TYPES.LOGGED_OUT }
>

export type TabSessionLifecycleOrder = TabSessionPublication

export type TabSessionStorageNotification = {
  isBroadcastChannelFallback?: true
} & (
  | ({ settlesSentAt: number } & TabSessionLogoutPublication)
  | Extract<TabSessionPublication, { type: typeof TAB_SESSION_EVENT_TYPES.EXPIRED }>
  | Extract<TabSessionPublication, { type: typeof TAB_SESSION_EVENT_TYPES.REFRESHED }>
)
