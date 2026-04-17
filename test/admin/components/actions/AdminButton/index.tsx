import type { PayloadServerReactComponent, SanitizedConfig } from 'payload'

import React from 'react'

const baseClass = 'admin-button'

export const AdminButton: PayloadServerReactComponent<
  SanitizedConfig['admin']['components']['actions'][0]
> = () => {
  return (
    <div
      className={baseClass}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--base) / 4)',
      }}
    >
      <p className="nav__label" style={{ color: 'var(--theme-text)', margin: 0 }}>
        Admin Button
      </p>
    </div>
  )
}
