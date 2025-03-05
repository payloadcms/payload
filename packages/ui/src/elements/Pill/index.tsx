'use client'
import type { ElementType, HTMLAttributes } from 'react'

import React from 'react' // TODO: abstract this out to support all routers

import { Link } from '../Link/index.js'

export type PillProps = {
  alignIcon?: 'left' | 'right'
  'aria-checked'?: boolean
  'aria-controls'?: string
  'aria-expanded'?: boolean
  'aria-label'?: string
  children?: React.ReactNode
  className?: string
  draggable?: boolean
  elementProps?: {
    ref: React.RefCallback<HTMLElement>
  } & HTMLAttributes<HTMLElement>
  icon?: React.ReactNode
  id?: string
  onClick?: () => void
  pillStyle?:
    | 'always-white'
    | 'dark'
    | 'error'
    | 'light'
    | 'light-gray'
    | 'success'
    | 'warning'
    | 'white'
  rounded?: boolean
  size?: 'medium' | 'small'
  to?: string
}

export type RenderedTypeProps = {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  to: string
  type?: 'button'
}

import { useDraggableSortable } from '../DraggableSortable/useDraggableSortable/index.js'
import './index.scss'

const baseClass = 'pill'

const DraggablePill: React.FC<PillProps> = (props) => {
  const { id, className } = props

  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggableSortable({
    id,
  })

  return (
    <StaticPill
      {...props}
      className={[isDragging && `${baseClass}--is-dragging`, className].filter(Boolean).join(' ')}
      elementProps={{
        ...listeners,
        ...attributes,
        ref: setNodeRef,
        style: {
          transform,
        },
      }}
    />
  )
}

const StaticPill: React.FC<PillProps> = (props) => {
  const {
    id,
    alignIcon = 'right',
    'aria-checked': ariaChecked,
    'aria-controls': ariaControls,
    'aria-expanded': ariaExpanded,
    'aria-label': ariaLabel,
    children,
    className,
    draggable,
    elementProps,
    icon,
    onClick,
    pillStyle = 'light',
    rounded,
    size = 'medium',
    to,
  } = props

  const classes = [
    baseClass,
    `${baseClass}--style-${pillStyle}`,
    `${baseClass}--size-${size}`,
    className && className,
    to && `${baseClass}--has-link`,
    (to || onClick) && `${baseClass}--has-action`,
    icon && `${baseClass}--has-icon`,
    icon && `${baseClass}--align-icon-${alignIcon}`,
    draggable && `${baseClass}--draggable`,
    rounded && `${baseClass}--rounded`,
  ]
    .filter(Boolean)
    .join(' ')

  let Element: ElementType | React.FC<RenderedTypeProps> = 'div'

  if (onClick && !to) {
    Element = 'button'
  }

  if (to) {
    Element = Link
  }

  return (
    <Element
      {...elementProps}
      aria-checked={ariaChecked}
      aria-controls={ariaControls}
      aria-expanded={ariaExpanded}
      aria-label={ariaLabel}
      className={classes}
      href={to || null}
      id={id}
      onClick={onClick}
      type={Element === 'button' ? 'button' : undefined}
    >
      <span className={`${baseClass}__label`}>{children}</span>
      {Boolean(icon) && <span className={`${baseClass}__icon`}>{icon}</span>}
    </Element>
  )
}

export const Pill: React.FC<PillProps> = (props) => {
  const { draggable } = props

  if (draggable) {
    return <DraggablePill {...props} />
  }
  return <StaticPill {...props} />
}
