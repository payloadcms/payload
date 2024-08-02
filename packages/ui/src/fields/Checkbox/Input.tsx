'use client'
import type { LabelProps, MappedComponent, SanitizedLabelProps } from 'payload'

import React from 'react'

import { CheckIcon } from '../../icons/Check/index.js'
import { LineIcon } from '../../icons/Line/index.js'
import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { FieldLabel } from '../FieldLabel/index.js'

export type CheckboxInputProps = {
  AfterInput?: MappedComponent[]
  BeforeInput?: MappedComponent[]
  CustomLabel?: MappedComponent
  checked?: boolean
  className?: string
  id?: string
  inputRef?: React.RefObject<HTMLInputElement | null>
  label?: LabelProps<'checkbox'>['label']
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
        <RenderComponent mappedComponent={BeforeInput} />
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
          {checked && <CheckIcon />}
          {!checked && partialChecked && <LineIcon />}
        </span>
        <RenderComponent mappedComponent={AfterInput} />
      </div>
      <FieldLabel
        CustomLabel={CustomLabel}
        htmlFor={id}
        label={label}
        required={required}
        {...(labelProps || {})}
      />
    </div>
  )
}
