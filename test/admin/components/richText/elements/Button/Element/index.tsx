import React from 'react'

import './index.scss'

const baseClass = 'rich-text-button'

const ButtonElement = ({ attributes, children, element }) => {
  const { label, style = 'primary' } = element

  return (
    <div className={baseClass} contentEditable={false}>
      <span
        {...attributes}
        className={[`${baseClass}__button`, `${baseClass}__button--${style}`].join(' ')}
      >
        {label}
        {children}
      </span>
    </div>
  )
}

export default ButtonElement
