import React from 'react'

const baseClass = 'global-live-preview-button'

const GlobalLivePreviewButton: React.FC = () => {
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
        Global Live Preview Button
      </p>
    </div>
  )
}

export default GlobalLivePreviewButton
