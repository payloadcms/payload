'use client'
import type { LabelProps, MappedComponent, SanitizedLabelProps } from 'payload'

import React from 'react'

import { CheckIcon } from '../../icons/Check/index.js'
import { LineIcon } from '../../icons/Line/index.js'
import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { FieldLabel } from '../FieldLabel/index.js'

export type CheckboxInputProps = {
  readonly CustomLabel?: MappedComponent
  readonly afterInput?: MappedComponent[]
  readonly beforeInput?: MappedComponent[]
  readonly checked?: boolean
  readonly className?: string
  readonly id?: string
  readonly inputRef?: React.RefObject<HTMLInputElement | null>
  readonly label?: LabelProps<'checkbox'>['label']
  readonly labelProps?: SanitizedLabelProps
  readonly name?: string
  readonly onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void
  readonly partialChecked?: boolean
  readonly readOnly?: boolean
  readonly required?: boolean
}

export const inputBaseClass = 'checkbox-input'

export const CheckboxInput: React.FC<CheckboxInputProps> = ({
  id,
  name,
  CustomLabel,
  afterInput,
  beforeInput,
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
        <RenderComponent mappedComponent={beforeInput} />
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
        <RenderComponent mappedComponent={afterInput} />
      </div>
      <FieldLabel
        Label={CustomLabel}
        htmlFor={id}
        label={label}
        required={required}
        {...(labelProps || {})}
      />
    </div>
  )
}
