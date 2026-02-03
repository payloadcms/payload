'use client'

import type { PayloadClientReactComponent, SanitizedConfig } from 'payload'

import React from 'react'

const baseClass = 'after-nav'

export const AfterNav: PayloadClientReactComponent<
  SanitizedConfig['admin']['components']['afterNav'][0]
> = () => {
  return (
    <div
      className={baseClass}
      id="after-nav-component"
      style={{
        backgroundColor: 'var(--theme-success-100)',
        borderRadius: 'var(--style-radius-m)',
        color: 'var(--theme-success-750)',
        marginTop: 'var(--base)',
        padding: 'calc(var(--base) * 0.5)',
      }}
    >
      <p style={{ margin: 0 }}>After Nav Content</p>
    </div>
  )
}
