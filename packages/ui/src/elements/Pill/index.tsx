'use client'
import type { ElementType } from 'react'

import LinkWithDefault from 'next/link.js'
const Link = LinkWithDefault.default
import React from 'react' // TODO: abstract this out to support all routers

import type { Props, RenderedTypeProps } from './types.js'

import { useDraggableSortable } from '../DraggableSortable/useDraggableSortable/index.js'
import './index.scss'

const baseClass = 'pill'

const DraggablePill: React.FC<Props> = (props) => {
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

const StaticPill: React.FC<Props> = (props) => {
  const {
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
    to,
  } = props

  const classes = [
    baseClass,
    `${baseClass}--style-${pillStyle}`,
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

  if (onClick && !to) Element = 'button'
  if (to) Element = Link

  return (
    <Element
      {...elementProps}
      aria-checked={ariaChecked}
      aria-controls={ariaControls}
      aria-expanded={ariaExpanded}
      aria-label={ariaLabel}
      className={classes}
      href={to || ''}
      onClick={onClick}
      type={Element === 'button' ? 'button' : undefined}
    >
      {icon && alignIcon === 'left' && <span className={`${baseClass}__icon`}>{icon}</span>}
      <span className={`${baseClass}__label`}>{children}</span>
      {icon && alignIcon === 'right' && <span className={`${baseClass}__icon`}>{icon}</span>}
    </Element>
  )
}

export const Pill: React.FC<Props> = (props) => {
  const { draggable } = props

  if (draggable) return <DraggablePill {...props} />
  return <StaticPill {...props} />
}

export default Pill
