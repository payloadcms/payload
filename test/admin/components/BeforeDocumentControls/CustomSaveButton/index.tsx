import type { BeforeDocumentControlsServerProps } from 'payload'

import React from 'react'

const baseClass = 'custom-save-button'

export function CustomSaveButton(props: BeforeDocumentControlsServerProps) {
  return (
    <div
      className={baseClass}
      id="custom-save-button"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--base) / 4)',
      }}
    >
      <p className="nav__label" style={{ color: 'var(--theme-text)', margin: 0 }}>
        Custom Save Button
      </p>
    </div>
  )
}
