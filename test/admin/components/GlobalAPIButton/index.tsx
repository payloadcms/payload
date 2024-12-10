import React from 'react'

const baseClass = 'global-api-button'

export const GlobalAPIButton: React.FC = () => {
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
        Global API Button
      </p>
    </div>
  )
}
