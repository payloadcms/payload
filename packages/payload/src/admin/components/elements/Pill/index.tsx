import type { ElementType } from 'react'

import React from 'react'
import { Link } from 'react-router-dom'

import type { Props, RenderedTypeProps } from './types.js'

import { useDraggableSortable } from '../DraggableSortable/useDraggableSortable/index.js'
import './index.scss'

const baseClass = 'pill'

const DraggablePill: React.FC<Props> = (props) => {
  const { className, id } = props

  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggableSortable({
    id,
  })

  return (
    <StaticPill
      {...props}
      elementProps={{
        ...listeners,
        ...attributes,
        ref: setNodeRef,
        style: {
          transform,
        },
      }}
      className={[isDragging && `${baseClass}--is-dragging`, className].filter(Boolean).join(' ')}
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
      onClick={onClick}
      to={to || undefined}
      type={Element === 'button' ? 'button' : undefined}
    >
      {icon && alignIcon === 'left' && <React.Fragment>{icon}</React.Fragment>}
      {children}
      {icon && alignIcon === 'right' && <React.Fragment>{icon}</React.Fragment>}
    </Element>
  )
}

const Pill: React.FC<Props> = (props) => {
  const { draggable } = props

  if (draggable) return <DraggablePill {...props} />
  return <StaticPill {...props} />
}

export default Pill
