'use client'
import React from 'react'

import { XIcon } from '../../icons/X/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.css'

const baseClass = 'chip'

export type ChipProps = {
  'aria-label'?: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
  icon?: React.ReactNode
  id?: string
  onClick?: () => void
  onRemove?: () => void
  size?: 'large' | 'medium'
}

export const Chip: React.FC<ChipProps> = ({
  id,
  'aria-label': ariaLabel,
  children,
  className,
  disabled,
  icon,
  onClick,
  onRemove,
  size = 'medium',
}) => {
  const { t } = useTranslation()

  const classes = [baseClass, `${baseClass}--size-${size}`, className].filter(Boolean).join(' ')

  return (
    <div className={classes} id={id}>
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
          <XIcon />
        </button>
      ) : null}
    </div>
  )
}
