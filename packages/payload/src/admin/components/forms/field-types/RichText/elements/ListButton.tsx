import React, { useCallback } from 'react'
import { useSlate } from 'slate-react'

import type { ButtonProps } from './types'

import '../buttons.scss'
import isListActive from './isListActive'
import toggleList from './toggleList'

export const baseClass = 'rich-text__button'

const ListButton: React.FC<ButtonProps> = ({ children, className, format, onClick }) => {
  const editor = useSlate()

  const defaultOnClick = useCallback(
    (event) => {
      event.preventDefault()
      toggleList(editor, format)
    },
    [editor, format],
  )

  return (
    <button
      className={[
        baseClass,
        className,
        isListActive(editor, format) && `${baseClass}__button--active`,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick || defaultOnClick}
      type="button"
    >
      {children}
    </button>
  )
}

export default ListButton
