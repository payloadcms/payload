import type { PayloadServerReactComponent, SanitizedConfig } from 'payload'

import React from 'react'

const baseClass = 'custom-footer'

export const CustomFooter: PayloadServerReactComponent<
  SanitizedConfig['admin']['components']['footer'][0]
> = () => {
  return (
    <div
      className={baseClass}
      style={{
        alignItems: 'center',
        backgroundColor: 'var(--theme-warning-100)',
        display: 'flex',
        padding: '0 var(--gutter-h)',
        width: '100%',
        zIndex: 'var(--z-modal)',
      }}
    >
      <p style={{ color: 'var(--theme-warning-750)', margin: 0, padding: '1rem 0' }}>
        Here is a custom footer inserted with admin.components.footer
      </p>
    </div>
  )
}
