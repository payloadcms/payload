'use client'
import type { LinkProps } from 'next/link.js'

import * as React from 'react'

import { Link } from '../../Link/index.js'
import './index.scss'

const baseClass = 'popup-button-list'

export { PopupListDivider as Divider } from '../PopupDivider/index.js'
export { PopupListGroupLabel as GroupLabel } from '../PopupGroupLabel/index.js'

export const ButtonGroup: React.FC<{
  buttonSize?: 'default' | 'small'
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

type MenuButtonProps = {
  active?: boolean
  children: React.ReactNode
  className?: string
  disabled?: boolean
  href?: LinkProps['href']
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
  onClick,
}) => {
  const classes = [`${baseClass}__button`, active && `${baseClass}__button--selected`, className]
    .filter(Boolean)
    .join(' ')

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
          {children}
        </button>
      )
    }
  }

  return (
    <div className={classes} id={id}>
      {children}
    </div>
  )
}
