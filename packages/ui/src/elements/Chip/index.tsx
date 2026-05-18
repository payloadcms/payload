'use client'
import type { HTMLAttributes } from 'react'

import React from 'react'

import { XIcon } from '../../icons/X/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.css'

const baseClass = 'chip'

export type ChipVariant = 'danger' | 'default' | 'success' | 'warning'

export type ChipProps = {
  'aria-label'?: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
  elementProps?: {
    ref?: React.RefCallback<HTMLElement>
  } & HTMLAttributes<HTMLElement>
  icon?: React.ReactNode
  id?: string
  onClick?: () => void
  onRemove?: () => void
  selected?: boolean
  size?: 'large' | 'medium'
  variant?: ChipVariant
}

export const Chip: React.FC<ChipProps> = ({
  id,
  'aria-label': ariaLabel,
  children,
  className,
  disabled,
  elementProps,
  icon,
  onClick,
  onRemove,
  selected,
  size = 'medium',
  variant = 'default',
}) => {
  const { t } = useTranslation()

  const classes = [
    baseClass,
    `${baseClass}--size-${size}`,
    `${baseClass}--variant-${variant}`,
    selected && `${baseClass}--selected`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div {...elementProps} className={classes} id={id} ref={elementProps?.ref}>
      {onClick ? (
        <button
          aria-label={ariaLabel}
          className={`${baseClass}__action`}
          disabled={disabled}
          onClick={onClick}
          type="button"
        />
      ) : null}
      {icon ? <span className={`${baseClass}__icon`}>{icon}</span> : null}
      <span className={`${baseClass}__label`}>{children}</span>
      {onRemove ? (
        <button
          aria-label={t('general:remove')}
          className={`${baseClass}__remove`}
          disabled={disabled}
          onClick={onRemove}
          type="button"
        >
          <XIcon size={24} />
        </button>
      ) : null}
    </div>
  )
}
