import type { CustomComponent, PayloadServerReactComponent } from 'payload'

import React from 'react'

const baseClass = 'collection-edit-button'

export const CollectionEditButton: PayloadServerReactComponent<CustomComponent> = () => {
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
        Collection Edit Button
      </p>
    </div>
  )
}
