'use client'
import type {
  CheckboxFieldClient,
  FieldLabelClientProps,
  MappedComponent,
  StaticLabel,
} from 'payload'
import type { MarkOptional } from 'ts-essentials'

import React from 'react'

import { CheckIcon } from '../../icons/Check/index.js'
import { LineIcon } from '../../icons/Line/index.js'
import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { FieldLabel } from '../FieldLabel/index.js'

export type CheckboxInputProps = {
  readonly afterInput?: MappedComponent[]
  readonly beforeInput?: MappedComponent[]
  readonly checked?: boolean
  readonly className?: string
  readonly field?: MarkOptional<CheckboxFieldClient, 'type'>
  readonly id?: string
  readonly inputRef?: React.RefObject<HTMLInputElement | null>
  readonly Label?: MappedComponent
  readonly label?: StaticLabel
  readonly labelProps?: FieldLabelClientProps<MarkOptional<CheckboxFieldClient, 'type'>>
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
  afterInput,
  beforeInput,
  checked,
  className,
  field,
  inputRef,
  Label,
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
          className={[`${inputBaseClass}__icon`, !checked && partialChecked ? 'partial' : 'check']
            .filter(Boolean)
            .join(' ')}
        >
          {checked && <CheckIcon />}
          {!checked && partialChecked && <LineIcon />}
        </span>
        <RenderComponent mappedComponent={afterInput} />
      </div>
      <FieldLabel
        field={field}
        htmlFor={id}
        Label={Label}
        label={label}
        required={required}
        {...(labelProps || {})}
      />
    </div>
  )
}
