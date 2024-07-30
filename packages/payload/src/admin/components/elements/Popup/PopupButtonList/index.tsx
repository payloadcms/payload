import type { LinkProps } from 'react-router-dom'

import * as React from 'react'
import { Link } from 'react-router-dom'

import './index.scss'

const baseClass = 'popup-button-list'
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
  id?: string
  onClick?: () => void
  to?: LinkProps['to']
}
export const Button: React.FC<MenuButtonProps> = ({
  id,
  active,
  children,
  className,
  disabled,
  onClick,
  to,
}) => {
  const classes = [`${baseClass}__button`, active && `${baseClass}__button--selected`, className]
    .filter(Boolean)
    .join(' ')

  if (to) {
    return (
      <Link
        className={classes}
        id={id}
        onClick={() => {
          if (onClick) {
            onClick()
          }
        }}
        to={to}
      >
        {children}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button
        className={classes}
        disabled={disabled}
        id={id}
        onClick={() => {
          if (onClick) {
            onClick()
          }
        }}
        type="button"
      >
        {children}
      </button>
    )
  }

  return (
    <div className={classes} id={id}>
      {children}
    </div>
  )
}
