'use client'
import type { LinkAdapterProps } from 'payload'

import * as React from 'react'

import { CheckIcon } from '../../../icons/Check/index.js'
import { Link } from '../../Link/index.js'
import './index.css'

const baseClass = 'popup-button-list'

export { PopupListDivider as Divider } from '../PopupDivider/index.js'
export { PopupListGroupLabel as GroupLabel } from '../PopupGroupLabel/index.js'

export const ButtonGroup: React.FC<{
  buttonSize?: 'default' | 'medium'
  children: React.ReactNode
  className?: string
  textAlign?: 'center' | 'left' | 'right'
}> = ({ buttonSize = 'default', children, className, textAlign = 'left' }) => {
  const classes = [
    baseClass,
    className,
    `${baseClass}__text-align--${textAlign}`,
    `${baseClass}__button-size--${buttonSize}`,
  ]
    .filter(Boolean)
    .join(' ')
  return <div className={classes}>{children}</div>
}

/**
 * A ButtonGroup variant that reserves space for icons on the left,
 * ensuring text aligns consistently whether items have icons or not.
 */
export const IconButtonGroup: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  const classes = [baseClass, className, `${baseClass}--with-icons`].filter(Boolean).join(' ')
  return <div className={classes}>{children}</div>
}

type MenuButtonProps = {
  active?: boolean
  children: React.ReactNode
  className?: string
  disabled?: boolean
  href?: LinkAdapterProps['href']
  icon?: React.ReactNode
  id?: string
  onClick?: (e?: React.MouseEvent) => void
}

export const Button: React.FC<MenuButtonProps> = ({
  id,
  active,
  children,
  className,
  disabled,
  href,
  icon,
  onClick,
}) => {
  const classes = [
    `${baseClass}__button`,
    disabled && `${baseClass}__disabled`,
    active && `${baseClass}__button--selected`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  // Render icon column: checkmark if active, otherwise passed icon, otherwise empty placeholder
  const iconElement = active ? (
    <span className={`${baseClass}__icon`}>
      <CheckIcon size={16} />
    </span>
  ) : icon ? (
    <span className={`${baseClass}__icon`}>{icon}</span>
  ) : (
    <span className={`${baseClass}__icon`} />
  )

  if (!disabled) {
    if (href) {
      return (
        <Link
          className={classes}
          href={href}
          id={id}
          onClick={(e) => {
            if (onClick) {
              onClick(e)
            }
          }}
          prefetch={false}
        >
          {iconElement}
          {children}
        </Link>
      )
    }

    if (onClick) {
      return (
        <button
          className={classes}
          id={id}
          onClick={(e) => {
            if (onClick) {
              onClick(e)
            }
          }}
          type="button"
        >
          {iconElement}
          {children}
        </button>
      )
    }
  }

  return (
    <div className={classes} id={id}>
      {iconElement}
      {children}
    </div>
  )
}
