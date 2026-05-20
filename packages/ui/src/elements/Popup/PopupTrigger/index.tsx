'use client'
import React from 'react'

import './index.css'

const baseClass = 'popup-button'

export type PopupButtonRenderProps = {
  active: boolean
  'aria-expanded': boolean
  'aria-haspopup': true
  onClick: React.MouseEventHandler
  onKeyDown: React.KeyboardEventHandler
}

export type PopupTriggerProps = {
  active: boolean
  button?: React.ReactNode
  buttonType: 'custom' | 'default' | 'none'
  className?: string
  disabled?: boolean
  noBackground?: boolean
  renderButton?: (props: PopupButtonRenderProps) => React.ReactNode
  setActive: (active: boolean, viaKeyboard?: boolean) => void
  size?: 'large' | 'medium'
}

export const PopupTrigger: React.FC<PopupTriggerProps> = (props) => {
  const {
    active,
    button,
    buttonType,
    className,
    disabled,
    noBackground,
    renderButton,
    setActive,
    size,
  } = props

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

  const handleClick: React.MouseEventHandler = () => {
    setActive(!active, false)
  }

  const handleKeyDown: React.KeyboardEventHandler = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setActive(!active, true)
    }
  }

  // Render prop mode: consumer provides the button, we provide the handlers
  if (renderButton) {
    return (
      <>
        {renderButton({
          active,
          'aria-expanded': active,
          'aria-haspopup': true,
          onClick: handleClick,
          onKeyDown: handleKeyDown,
        })}
      </>
    )
  }

  if (buttonType === 'none') {
    return null
  }

  if (buttonType === 'custom') {
    return (
      <div
        className={classes}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
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
      onKeyDown={handleKeyDown}
      tabIndex={0}
      type="button"
    >
      {button}
    </button>
  )
}
