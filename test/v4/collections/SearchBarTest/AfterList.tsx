'use client'

import React from 'react'

export const AfterList: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-medium)',
        margin: 'var(--spacer-4)',
        minHeight: '800px',
        padding: '20px',
      }}
    >
      <h3 style={{ margin: 0, marginBottom: '8px' }}>AfterList Custom Component</h3>
      <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
        This is a custom component rendered after the list table. It's super tall for scroll
        testing.
      </p>
    </div>
  )
}
