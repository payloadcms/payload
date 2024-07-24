'use client'
import React from 'react'

import './index.scss'

const baseClass = 'popup-button'

export type PopupTriggerProps = {
  active: boolean
  button: React.ReactNode
  buttonType: 'custom' | 'default' | 'none'
  className?: string
  setActive: (active: boolean) => void
}

export const PopupTrigger: React.FC<PopupTriggerProps> = (props) => {
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
        className={classes}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleClick()
        }}
        role="button"
        tabIndex={0}
      >
        {button}
      </div>
    )
  }

  return (
    <button className={classes} onClick={() => setActive(!active)} tabIndex={0} type="button">
      {button}
    </button>
  )
}
