'use client'
import type { MouseEvent } from 'react'

import React from 'react'

import { InfoIcon } from '../../icons/Info/index.js'
import { Link } from '../Link/index.js'
import './index.css'

const baseClass = 'banner'

type onClick = (event: MouseEvent) => void

export type Props = Readonly<{
  alignIcon?: 'left' | 'right'
  children?: React.ReactNode
  className?: string
  icon?: React.ReactNode
  onClick?: onClick
  to?: string
  type?: 'brand' | 'danger' | 'default' | 'success' | 'warning'
}>

export type RenderedTypeProps = {
  children?: React.ReactNode
  className?: string
  onClick?: onClick
  to: string
}

export const Banner: React.FC<Props> = ({
  type = 'default',
  alignIcon = 'left',
  children,
  className,
  icon: iconFromProps,
  onClick,
  to,
}) => {
  const icon = iconFromProps === undefined ? <InfoIcon /> : iconFromProps

  const classes = [
    baseClass,
    `${baseClass}--type-${type}`,
    className && className,
    to && `${baseClass}--has-link`,
    (to || onClick) && `${baseClass}--has-action`,
    icon && `${baseClass}--has-icon`,
    icon && `${baseClass}--align-icon-${alignIcon}`,
  ]
    .filter(Boolean)
    .join(' ')

  let RenderedType: React.ComponentType<RenderedTypeProps> | React.ElementType = 'div'

  if (onClick && !to) {
    RenderedType = 'button'
  }
  if (to) {
    RenderedType = Link
  }

  return (
    <RenderedType className={classes} href={to || null} onClick={onClick}>
      {icon && alignIcon === 'left' && <React.Fragment>{icon}</React.Fragment>}
      <span className={`${baseClass}__content`}>{children}</span>
      {icon && alignIcon === 'right' && <React.Fragment>{icon}</React.Fragment>}
    </RenderedType>
  )
}
