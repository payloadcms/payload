import React from 'react'

import type { Props } from './types.js'

import './index.scss'

const baseClass = 'popup-button'

const PopupButton: React.FC<Props> = (props) => {
  const { active, button, buttonType, className, setActive } = props

  const classes = [baseClass, className, `${baseClass}--${buttonType}`].filter(Boolean).join(' ')

  const handleClick = () => {
    setActive(!active)
  }

  if (buttonType === 'none') {
    return null
  }

  if (buttonType === 'custom') {
    return (
      <div
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleClick()
        }}
        className={classes}
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        {button}
      </div>
    )
  }

  return (
    <button className={classes} onClick={() => setActive(!active)} type="button">
      {button}
    </button>
  )
}

export default PopupButton
