'use client'
import React from 'react'
import { useSlate } from 'slate-react'

import '../buttons.scss'
import { isLeafActive } from './isActive.js'
import { toggleLeaf } from './toggle.js'

const baseClass = 'rich-text__button'

export const LeafButton = ({ children, format }) => {
  const editor = useSlate()

  return (
    <button
      className={[baseClass, isLeafActive(editor, format) && `${baseClass}__button--active`]
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
