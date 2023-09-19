import React from 'react'

const baseClass = 'floating-select-toolbar-popup__button'
import './index.scss'

export const ToolbarButton = ({ children }) => {
  return (
    <button
      className={[baseClass].filter(Boolean).join(' ')}
      onMouseDown={(event) => {
        event.preventDefault()
      }}
      type="button"
    >
      {children}
    </button>
  )
}
