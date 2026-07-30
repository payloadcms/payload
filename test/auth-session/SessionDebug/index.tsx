'use client'

import { useAuth } from '@payloadcms/ui'
import React from 'react'

import {
  authSessionActivityStatusTestID,
  authSessionExpirationTestID,
  authSessionRefreshWindowMs,
  authSessionRefreshWindowStatusTestID,
} from '../shared.js'
import './index.css'

type ActivityStatus = 'closed' | 'tracking' | 'waiting' | 'will-refresh'

type GetActivityStatusArgs = {
  expiresInMs: number
  hasActivityInTrackingWindow: boolean
}

const activityTrackingWindowMs = authSessionRefreshWindowMs * 2
const reminderWindowMs = authSessionRefreshWindowMs / 2

const activityStatusLabels = {
  closed: 'Window closed',
  tracking: 'Tracking',
  waiting: 'Waiting for window',
  'will-refresh': 'Will refresh',
} satisfies Record<ActivityStatus, string>

const formatCountdown = (durationMs: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(durationMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const getActivityStatus = ({
  expiresInMs,
  hasActivityInTrackingWindow,
}: GetActivityStatusArgs): ActivityStatus => {
  if (expiresInMs <= reminderWindowMs) {
    return 'closed'
  }

  if (hasActivityInTrackingWindow) {
    return 'will-refresh'
  }

  if (expiresInMs <= activityTrackingWindowMs) {
    return 'tracking'
  }

  return 'waiting'
}

const getRefreshWindowStatus = (expiresInMs: number): string => {
  if (expiresInMs <= reminderWindowMs) {
    return 'Closed'
  }

  if (expiresInMs <= authSessionRefreshWindowMs) {
    return 'Open'
  }

  return `Opens in ${formatCountdown(expiresInMs - authSessionRefreshWindowMs)}`
}

export const SessionDebug: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { tokenExpirationMs, user } = useAuth()
  const [hasActivityInTrackingWindow, setHasActivityInTrackingWindow] = React.useState(false)
  const [nowMs, setNowMs] = React.useState<number>()

  React.useEffect(() => {
    setHasActivityInTrackingWindow(false)
  }, [tokenExpirationMs])

  React.useEffect(() => {
    const recordActivity = () => {
      const expiresInMs = Math.max(0, (tokenExpirationMs ?? 0) - Date.now())
      const isTrackingWindowOpen =
        expiresInMs <= activityTrackingWindowMs && expiresInMs > reminderWindowMs

      if (isTrackingWindowOpen) {
        setHasActivityInTrackingWindow(true)
      }
    }
    const mousemoveListenerOptions = { capture: true, passive: true }

    window.addEventListener('focus', recordActivity, true)
    window.addEventListener('mousemove', recordActivity, mousemoveListenerOptions)

    return () => {
      window.removeEventListener('focus', recordActivity, true)
      window.removeEventListener('mousemove', recordActivity, mousemoveListenerOptions)
    }
  }, [tokenExpirationMs])

  React.useEffect(() => {
    const updateCountdown = () => setNowMs(Date.now())
    const interval = window.setInterval(updateCountdown, 1000)

    updateCountdown()

    return () => window.clearInterval(interval)
  }, [])

  const expiresInMs = Math.max(0, (tokenExpirationMs ?? 0) - (nowMs ?? 0))
  const activityStatus = getActivityStatus({ expiresInMs, hasActivityInTrackingWindow })
  const refreshWindowStatus = getRefreshWindowStatus(expiresInMs)

  return (
    <>
      {children}

      <output data-testid={authSessionExpirationTestID} data-user-id={user?.id} hidden>
        {tokenExpirationMs}
      </output>

      {user && tokenExpirationMs && nowMs !== undefined ? (
        <aside aria-label="Auth session countdown" className="session-debug">
          <strong>Auth session</strong>
          <span>Access expires in: {formatCountdown(expiresInMs)}</span>
          <span>
            Refresh window:{' '}
            <span data-testid={authSessionRefreshWindowStatusTestID}>{refreshWindowStatus}</span>
          </span>
          <span className={`session-debug__activity session-debug__activity--${activityStatus}`}>
            <span aria-hidden className="session-debug__activity-indicator" />
            Activity:{' '}
            <span data-testid={authSessionActivityStatusTestID}>
              {activityStatusLabels[activityStatus]}
            </span>
          </span>
        </aside>
      ) : null}
    </>
  )
}
