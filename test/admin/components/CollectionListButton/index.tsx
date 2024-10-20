import React from 'react'

const baseClass = 'collection-list-button'

const CollectionListButton = () => {
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
        Collection List Button
      </p>
    </div>
  )
}

export default CollectionListButton
