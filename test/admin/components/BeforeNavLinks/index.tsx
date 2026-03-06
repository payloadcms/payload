'use client'

import type { PayloadClientReactComponent, SanitizedConfig } from 'payload'

import React from 'react'

const baseClass = 'before-nav-links'

export const BeforeNavLinks: PayloadClientReactComponent<
  SanitizedConfig['admin']['components']['beforeNavLinks'][0]
> = () => {
  return (
    <div
      className={baseClass}
      id="before-nav-links-component"
      style={{
        backgroundColor: 'var(--theme-success-100)',
        borderRadius: 'var(--style-radius-m)',
        color: 'var(--theme-success-750)',
        marginBottom: 'var(--base)',
        padding: 'calc(var(--base) * 0.5)',
        width: '100%',
      }}
    >
      beforeNavLinks
    </div>
  )
}
