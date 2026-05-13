'use client'
import type { HTMLAttributes } from 'react'

import React from 'react'

export type PillStyle =
  | 'always-white'
  | 'dark'
  | 'error'
  | 'light'
  | 'light-gray'
  | 'success'
  | 'warning'
  | 'white'

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
  /**
   * @default 'light'
   */
  pillStyle?: PillStyle
  rounded?: boolean
  size?: 'medium' | 'small'
}

import { useDraggableSortable } from '../DraggableSortable/useDraggableSortable/index.js'
import './index.css'

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
    pillStyle = 'light',
    rounded,
    size = 'medium',
  } = props

  const classes = [
    baseClass,
    `${baseClass}--style-${pillStyle}`,
    `${baseClass}--size-${size}`,
    className && className,
    icon && `${baseClass}--has-icon`,
    icon && `${baseClass}--align-icon-${alignIcon}`,
    draggable && `${baseClass}--draggable`,
    rounded && `${baseClass}--rounded`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      {...elementProps}
      aria-checked={ariaChecked}
      aria-controls={ariaControls}
      aria-expanded={ariaExpanded}
      aria-label={ariaLabel}
      className={classes}
      id={id}
    >
      <span className={`${baseClass}__label`}>{children}</span>
      {Boolean(icon) && <span className={`${baseClass}__icon`}>{icon}</span>}
    </div>
  )
}

export const Pill: React.FC<PillProps> = (props) => {
  const { draggable } = props

  if (draggable) {
    return <DraggablePill {...props} />
  }
  return <StaticPill {...props} />
}
