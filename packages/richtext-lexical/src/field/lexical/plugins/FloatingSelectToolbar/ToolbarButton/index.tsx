import React from 'react'

const baseClass = 'floating-select-toolbar-popup__button'
import './index.scss'

export const ToolbarButton = ({
  children,
  classNames,
  enabled,
  onClick,
}: {
  children: React.JSX.Element
  classNames?: string[]
  enabled?: boolean
  onClick?: () => void
}) => {
  return (
    <button
      className={[baseClass, ...(classNames || []), enabled === false ? 'disabled' : '']
        .filter(Boolean)
        .join(' ')}
      onClick={() => {
        if (enabled !== false && onClick) {
          onClick()
        }
      }}
      type="button"
    >
      {children}
    </button>
  )
}
