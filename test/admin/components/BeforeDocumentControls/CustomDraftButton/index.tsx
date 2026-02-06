import type { BeforeDocumentControlsServerProps } from 'payload'

import React from 'react'

const baseClass = 'custom-draft-button'

export function CustomDraftButton(props: BeforeDocumentControlsServerProps) {
  return (
    <div
      className={baseClass}
      id="custom-draft-button"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--base) / 4)',
      }}
    >
      <p className="nav__label" style={{ color: 'var(--theme-text)', margin: 0 }}>
        Custom Draft Button
      </p>
    </div>
  )
}
