'use client'
import type { LinkProps } from 'react-router-dom'

import * as React from 'react'
import Link from 'next/link' // TODO: abstract this out to support all routers

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
  id?: string
  onClick?: () => void
  to?: LinkProps['to']
}

export const Button: React.FC<MenuButtonProps> = ({
  id,
  active,
  children,
  className,
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
        href={to}
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
