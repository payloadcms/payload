import React from 'react'

const baseClass = 'floating-select-toolbar-popup__button'
import './index.scss'

export const ToolbarButton = ({
  children,
  classNames,
  onClick,
}: {
  children: React.JSX.Element
  classNames?: string[]
  onClick?: () => void
}) => {
  return (
    <button
      className={[baseClass, ...(classNames || [])].filter(Boolean).join(' ')}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}
