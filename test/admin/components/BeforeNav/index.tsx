'use client'

import type { PayloadClientReactComponent, SanitizedConfig } from 'payload'

import React from 'react'

const baseClass = 'before-nav'

export const BeforeNav: PayloadClientReactComponent<
  SanitizedConfig['admin']['components']['beforeNav'][0]
> = () => {
  return (
    <div
      className={baseClass}
      id="before-nav-component"
      style={{
        backgroundColor: 'var(--theme-success-100)',
        borderRadius: 'var(--style-radius-m)',
        color: 'var(--theme-success-750)',
        marginBottom: 'var(--base)',
        padding: 'calc(var(--base) * 0.5)',
      }}
    >
      <p style={{ margin: 0 }}>Before Nav Content</p>
    </div>
  )
}
