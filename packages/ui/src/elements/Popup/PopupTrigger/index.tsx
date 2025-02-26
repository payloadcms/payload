'use client'
import React from 'react'

import './index.scss'

const baseClass = 'popup-button'

export type PopupTriggerProps = {
  active: boolean
  button: React.ReactNode
  buttonType: 'custom' | 'default' | 'none'
  className?: string
  disabled?: boolean
  noBackground?: boolean
  setActive: (active: boolean) => void
  size?: 'large' | 'medium' | 'small'
}

export const PopupTrigger: React.FC<PopupTriggerProps> = (props) => {
  const { active, button, buttonType, className, disabled, noBackground, setActive, size } = props

  const classes = [
    baseClass,
    className,
    `${baseClass}--${buttonType}`,
    !noBackground && `${baseClass}--background`,
    size && `${baseClass}--size-${size}`,
    disabled && `${baseClass}--disabled`,
  ]
    .filter(Boolean)
    .join(' ')

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
          if (e.key === 'Enter') {
            handleClick()
          }
        }}
        role="button"
        tabIndex={0}
      >
        {button}
      </div>
    )
  }

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleClick()
        }
      }}
      tabIndex={0}
      type="button"
    >
      {button}
    </button>
  )
}
