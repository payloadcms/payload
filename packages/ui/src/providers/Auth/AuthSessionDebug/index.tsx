'use client'

import React from 'react'

import { useAuth } from '../index.js'
import {
  formatCountdown,
  getActivityStatus,
  getActivityWindowStatus,
  getRefreshWindowStatus,
} from './utilities.js'
import './index.scss'

type Props = {
  children?: React.ReactNode
}

/**
 * Displays the current auth session's expiration, refresh, and activity lifecycle.
 *
 * Register this component as an admin provider to render it on every admin page.
 */
export const AuthSessionDebug: React.FC<Props> = ({ children }) => {
  const { authSession } = useAuth()
  const [nowMs, setNowMs] = React.useState<number>()

  React.useEffect(() => {
    const updateCountdown = () => setNowMs(Date.now())

    updateCountdown()

    const interval = window.setInterval(updateCountdown, 1000)

    return () => window.clearInterval(interval)
  }, [])

  const expiresInMs = Math.max(0, (authSession?.expiresAt ?? 0) - (nowMs ?? 0))
  const activityStatus =
    authSession && nowMs !== undefined ? getActivityStatus({ authSession, nowMs }) : 'waiting'
  const activityWindowStatus =
    authSession && nowMs !== undefined
      ? getActivityWindowStatus({ activityStatus, authSession, nowMs })
      : ''
  const refreshWindowStatus =
    authSession && nowMs !== undefined ? getRefreshWindowStatus({ authSession, nowMs }) : ''

  return (
    <>
      {children}

      {authSession && nowMs !== undefined ? (
        <aside
          aria-label="Auth session countdown"
          className="auth-session-debug"
          data-auth-session-debug
          data-auth-session-expires-at={authSession.expiresAt}
        >
          <strong>Auth session</strong>
          <span>Access expires in: {formatCountdown(expiresInMs)}</span>
          <span>
            Refresh window: <span data-auth-session-refresh-window>{refreshWindowStatus}</span>
          </span>
          <span
            className={`auth-session-debug__activity auth-session-debug__activity--${activityStatus}`}
          >
            <span aria-hidden className="auth-session-debug__activity-indicator" />
            Activity window: <span data-auth-session-activity>{activityWindowStatus}</span>
          </span>
        </aside>
      ) : null}
    </>
  )
}
