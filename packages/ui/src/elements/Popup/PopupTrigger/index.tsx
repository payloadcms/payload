'use client'
import type { AriaAttributes } from 'react'

import React from 'react'

import './index.css'

const baseClass = 'popup-button'

export type PopupButtonRenderProps = {
  active: boolean
  'aria-controls': AriaAttributes['aria-controls']
  'aria-expanded': AriaAttributes['aria-expanded']
  'aria-haspopup'?: AriaAttributes['aria-haspopup']
  onClick: React.MouseEventHandler
  onKeyDown: React.KeyboardEventHandler
  role?: 'menuitem'
  tabIndex?: -1
}

export type PopupTriggerProps = {
  active: boolean
  button?: React.ReactNode
  buttonAriaLabel?: string
  buttonType: 'custom' | 'default'
  className?: string
  contentId: string
  disabled?: boolean
  isMenuItem?: boolean
  noBackground?: boolean
  popupType?: AriaAttributes['aria-haspopup']
  renderButton?: (props: PopupButtonRenderProps) => React.ReactNode
  setActive: (active: boolean, viaKeyboard?: boolean) => void
  size?: 'large' | 'medium'
}

export const PopupTrigger: React.FC<PopupTriggerProps> = (props) => {
  const {
    active,
    button,
    buttonAriaLabel,
    buttonType,
    className,
    contentId,
    disabled,
    isMenuItem,
    noBackground,
    popupType,
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
    active && `${baseClass}--active`,
  ]
    .filter(Boolean)
    .join(' ')

  const handleClick: React.MouseEventHandler = (event) => {
    if (disabled) {
      event.preventDefault()
      return
    }
    setActive(!active, false)
  }

  const handleKeyDown: React.KeyboardEventHandler = (e) => {
    if (e.key === 'Escape' && active) {
      e.preventDefault()
      e.stopPropagation()
      setActive(false)
      return
    }
    if (disabled) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
      }
      return
    }
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
          'aria-controls': contentId,
          'aria-expanded': active,
          'aria-haspopup': popupType,
          onClick: handleClick,
          onKeyDown: handleKeyDown,
          role: isMenuItem ? 'menuitem' : undefined,
          tabIndex: isMenuItem ? -1 : undefined,
        })}
      </>
    )
  }

  if (buttonType === 'custom') {
    if (
      React.isValidElement<{
        'aria-controls'?: AriaAttributes['aria-controls']
        'aria-expanded'?: AriaAttributes['aria-expanded']
        'aria-haspopup'?: AriaAttributes['aria-haspopup']
        'aria-label'?: string
        className?: string
        onClick?: React.MouseEventHandler
        onKeyDown?: React.KeyboardEventHandler
        role?: React.AriaRole
        tabIndex?: number
      }>(button)
    ) {
      const originalOnClick = button.props.onClick
      const originalOnKeyDown = button.props.onKeyDown

      // Apply the trigger contract to the supplied control instead of adding another interactive wrapper.
      // eslint-disable-next-line @eslint-react/no-clone-element
      return React.cloneElement(button, {
        'aria-controls': contentId,
        'aria-expanded': active,
        'aria-haspopup': popupType,
        'aria-label': buttonAriaLabel ?? button.props['aria-label'],
        className: [classes, button.props.className].filter(Boolean).join(' '),
        onClick: (event) => {
          originalOnClick?.(event)
          handleClick(event)
        },
        onKeyDown: (event) => {
          originalOnKeyDown?.(event)
          handleKeyDown(event)
        },
        role: isMenuItem ? 'menuitem' : button.props.role,
        tabIndex: isMenuItem ? -1 : (button.props.tabIndex ?? 0),
      })
    }

    return (
      <div
        aria-controls={contentId}
        aria-expanded={active}
        aria-haspopup={popupType}
        aria-label={buttonAriaLabel}
        className={classes}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={isMenuItem ? 'menuitem' : 'button'}
        tabIndex={isMenuItem ? -1 : 0}
      >
        {button}
      </div>
    )
  }

  return (
    <button
      aria-controls={contentId}
      aria-expanded={active}
      aria-haspopup={popupType}
      aria-label={buttonAriaLabel}
      className={classes}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isMenuItem ? 'menuitem' : undefined}
      tabIndex={isMenuItem ? -1 : 0}
      type="button"
    >
      {button}
    </button>
  )
}
