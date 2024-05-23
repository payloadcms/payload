'use client'
import type { LabelProps, SanitizedLabelProps } from 'payload/types'

import React from 'react'

import { FieldLabel } from '../../forms/FieldLabel/index.js'
import { Check } from '../../icons/Check/index.js'
import { Line } from '../../icons/Line/index.js'

export type CheckboxInputProps = {
  AfterInput?: React.ReactNode
  BeforeInput?: React.ReactNode
  CustomLabel?: React.ReactNode
  checked?: boolean
  className?: string
  id?: string
  inputRef?: React.RefObject<HTMLInputElement>
  label?: LabelProps['label']
  labelProps?: SanitizedLabelProps
  name?: string
  onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void
  partialChecked?: boolean
  readOnly?: boolean
  required?: boolean
}

export const inputBaseClass = 'checkbox-input'

export const CheckboxInput: React.FC<CheckboxInputProps> = ({
  id,
  name,
  AfterInput,
  BeforeInput,
  CustomLabel,
  checked,
  className,
  inputRef,
  label,
  labelProps,
  onToggle,
  partialChecked,
  readOnly,
  required,
}) => {
  return (
    <div
      className={[
        className,
        inputBaseClass,
        checked && `${inputBaseClass}--checked`,
        readOnly && `${inputBaseClass}--read-only`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={`${inputBaseClass}__input`}>
        {BeforeInput}
        <input
          aria-label=""
          defaultChecked={Boolean(checked)}
          disabled={readOnly}
          id={id}
          name={name}
          onInput={onToggle}
          ref={inputRef}
          required={required}
          type="checkbox"
        />
        <span
          className={[`${inputBaseClass}__icon`, !checked && partialChecked ? 'check' : 'partial']
            .filter(Boolean)
            .join(' ')}
        >
          {checked && <Check />}
          {!checked && partialChecked && <Line />}
        </span>
        {AfterInput}
      </div>
      <FieldLabel
        CustomLabel={CustomLabel}
        label={label}
        required={required}
        {...(labelProps || {})}
      />
    </div>
  )
}
