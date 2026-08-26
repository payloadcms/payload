'use client'

import React, { useId } from 'react'

import { useTranslation } from '../../providers/Translation/index.js'
import './index.css'

const baseClass = 'switch'

export type SwitchProps = {
  readonly checked?: boolean
  readonly className?: string
  readonly disabled?: boolean
  readonly id?: string
  readonly label?: React.ReactNode
  readonly onChange?: (checked: boolean) => void
}

export const Switch: React.FC<SwitchProps> = ({
  id: idFromProps,
  checked = false,
  className,
  disabled = false,
  label,
  onChange,
}) => {
  const { t } = useTranslation()
  const generatedId = useId()
  const id = idFromProps || generatedId

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && onChange) {
      onChange(e.target.checked)
    }
  }

  return (
    <label
      className={[baseClass, disabled && `${baseClass}--disabled`, className]
        .filter(Boolean)
        .join(' ')}
      htmlFor={id}
    >
      <input
        aria-label={typeof label === 'string' ? label : t('general:toggle')}
        checked={checked}
        className={`${baseClass}__input`}
        disabled={disabled}
        id={id}
        onChange={handleChange}
        type="checkbox"
      />
      <span
        aria-hidden="true"
        className={[`${baseClass}__track`, checked && `${baseClass}__track--checked`]
          .filter(Boolean)
          .join(' ')}
      >
        <span className={`${baseClass}__knob`} />
      </span>
      {label ? <span className={`${baseClass}__label`}>{label}</span> : null}
    </label>
  )
}
