'use client'
// TODO: abstract the `next/link` dependency out from this component
import type { LinkProps } from 'next/link.js'

import LinkImport from 'next/link.js'
import * as React from 'react' // TODO: abstract this out to support all routers

import './index.scss'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

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
  href?: LinkProps['href']
  id?: string
  onClick?: (e?: React.MouseEvent) => void
}

export const Button: React.FC<MenuButtonProps> = ({
  id,
  active,
  children,
  className,
  href,
  onClick,
}) => {
  const classes = [`${baseClass}__button`, active && `${baseClass}__button--selected`, className]
    .filter(Boolean)
    .join(' ')

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

  return (
    <div className={classes} id={id}>
      {children}
    </div>
  )
}
