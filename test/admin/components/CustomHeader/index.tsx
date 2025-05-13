import type { PayloadServerReactComponent, SanitizedConfig } from 'payload'

import React from 'react'

const baseClass = 'custom-header'

export const CustomHeader: PayloadServerReactComponent<
  SanitizedConfig['admin']['components']['header'][0]
> = () => {
  return (
    <div
      className={baseClass}
      style={{
        alignItems: 'center',
        backgroundColor: 'var(--theme-success-100)',
        display: 'flex',
        minHeight: 'var(--app-header-height)',
        padding: '0 var(--gutter-h)',
        // position: 'sticky',
        top: 0,
        width: '100%',
        zIndex: 'var(--z-modal)',
      }}
    >
      <p style={{ color: 'var(--theme-success-750)', margin: 0 }}>
        Here is a custom header inserted with admin.components.header
      </p>
    </div>
  )
}
