/* eslint-disable no-restricted-exports */
'use client'

import type { WidgetServerProps } from 'payload'

export default function Private({ widgetSlug }: WidgetServerProps) {
  return (
    <div
      className="private-widget card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Private Widget</h3>
        <div
          style={{
            background: 'var(--theme-success-500)',
            borderRadius: '12px',
            color: 'var(--theme-elevation-0)',
            fontSize: '12px',
            fontWeight: 600,
            padding: '4px 8px',
          }}
        >
          ADMIN ONLY
        </div>
      </div>

      <div
        style={{
          background: 'var(--theme-elevation-50)',
          border: '1px solid var(--theme-elevation-200)',
          borderRadius: '8px',
          flex: 1,
          padding: '16px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            color: 'var(--theme-elevation-500)',
            fontSize: '14px',
            marginBottom: '8px',
          }}
        >
          <span aria-label="lock" role="img">
            🔒
          </span>{' '}
          This is a private widget only visible to admin users
        </div>
        <div
          style={{
            color: 'var(--theme-text)',
            fontSize: '12px',
            opacity: 0.7,
          }}
        >
          Widget ID: {widgetSlug}
        </div>
      </div>
    </div>
  )
}
