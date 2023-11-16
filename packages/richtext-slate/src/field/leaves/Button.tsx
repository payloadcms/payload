'use client'
import React from 'react'
import { useSlate } from 'slate-react'

import '../buttons.scss'
import isMarkActive from './isActive'
import toggleLeaf from './toggle'

const baseClass = 'rich-text__button'

const LeafButton = ({ children, format }) => {
  const editor = useSlate()

  return (
    <button
      className={[baseClass, isMarkActive(editor, format) && `${baseClass}__button--active`]
        .filter(Boolean)
        .join(' ')}
      onMouseDown={(event) => {
        event.preventDefault()
        toggleLeaf(editor, format)
      }}
      type="button"
    >
      {children}
    </button>
  )
}

export default LeafButton
