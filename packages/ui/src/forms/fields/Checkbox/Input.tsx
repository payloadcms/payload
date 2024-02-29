'use client'
import React from 'react'

import { Check, Line } from '../../..'

type Props = {
  AfterInput?: React.ReactNode
  BeforeInput?: React.ReactNode
  Label?: React.ReactNode
  checked?: boolean
  className?: string
  id?: string
  inputRef?: React.RefObject<HTMLInputElement>
  name?: string
  onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void
  partialChecked?: boolean
  readOnly?: boolean
  required?: boolean
}

export const inputBaseClass = 'checkbox-input'

export const CheckboxInput: React.FC<Props> = ({
  id,
  name,
  AfterInput,
  BeforeInput,
  Label,
  checked,
  className,
  inputRef,
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
      {Label}
    </div>
  )
}
