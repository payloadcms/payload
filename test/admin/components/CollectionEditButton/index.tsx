import React from 'react'

const baseClass = 'collection-edit-button'

const CollectionEditButton: React.FC = () => {
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

export default CollectionEditButton
