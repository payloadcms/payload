'use client'

import { useAuth } from '@payloadcms/ui'
import React from 'react'

import { authSessionExpirationTestID, authSessionRefreshWindowMs } from '../shared.js'

const overlayStyle: React.CSSProperties = {
  background: 'rgba(20, 20, 24, 0.92)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '8px',
  bottom: '16px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
  color: '#fff',
  display: 'grid',
  fontFamily: 'monospace',
  fontSize: '13px',
  gap: '6px',
  lineHeight: 1.4,
  padding: '12px 14px',
  pointerEvents: 'none',
  position: 'fixed',
  right: '16px',
  zIndex: 1000,
}

const formatCountdown = (durationMs: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(durationMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export const SessionDebug: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { tokenExpirationMs, user } = useAuth()
  const [nowMs, setNowMs] = React.useState<number>()

  React.useEffect(() => {
    const updateCountdown = () => setNowMs(Date.now())
    const interval = window.setInterval(updateCountdown, 1000)

    updateCountdown()

    return () => window.clearInterval(interval)
  }, [])

  const expiresInMs = Math.max(0, (tokenExpirationMs ?? 0) - (nowMs ?? 0))
  const refreshWindowBeginsInMs = Math.max(0, expiresInMs - authSessionRefreshWindowMs)
  const status =
    expiresInMs === 0
      ? 'Expired'
      : refreshWindowBeginsInMs === 0
        ? 'Refresh window open'
        : 'Waiting for refresh window'

  return (
    <>
      {children}

      <output data-testid={authSessionExpirationTestID} data-user-id={user?.id} hidden>
        {tokenExpirationMs}
      </output>

      {user && tokenExpirationMs && nowMs !== undefined ? (
        <aside aria-label="Auth session countdown" style={overlayStyle}>
          <strong>Auth session</strong>
          <span>Access expires in: {formatCountdown(expiresInMs)}</span>
          <span>Refresh window in: {formatCountdown(refreshWindowBeginsInMs)}</span>
          <span>Status: {status}</span>
        </aside>
      ) : null}
    </>
  )
}
