'use client'
import type { StaticLabel } from 'payload'

import React, { useEffect, useId, useState } from 'react'

import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { CheckIcon } from '../../icons/Check/index.js'
import { LineIcon } from '../../icons/Line/index.js'

export type CheckboxInputProps = {
  readonly AfterInput?: React.ReactNode
  readonly BeforeInput?: React.ReactNode
  readonly checked?: boolean
  readonly className?: string
  readonly id?: string
  readonly inputRef?: React.RefObject<HTMLInputElement | null>
  readonly Label?: React.ReactNode
  readonly label?: StaticLabel
  readonly localized?: boolean
  readonly name?: string
  readonly onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void
  readonly partialChecked?: boolean
  readonly readOnly?: boolean
  readonly required?: boolean
}

export const inputBaseClass = 'checkbox-input'

export const CheckboxInput: React.FC<CheckboxInputProps> = ({
  id: idFromProps,
  name,
  AfterInput,
  BeforeInput,
  checked,
  className,
  inputRef,
  Label,
  label,
  localized,
  onToggle,
  partialChecked,
  readOnly: readOnlyFromProps,
  required,
}) => {
  const [isHydrated, setIsHydrated] = useState(false)
  const fallbackID = useId()
  const id = idFromProps || fallbackID

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const readOnly = readOnlyFromProps || !isHydrated

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
          aria-labelledby={name}
          checked={Boolean(checked)}
          disabled={readOnly}
          id={id}
          name={name}
          onChange={onToggle}
          ref={inputRef}
          required={required}
          title={name}
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
        {AfterInput}
      </div>
      <RenderCustomComponent
        CustomComponent={Label}
        Fallback={
          <FieldLabel htmlFor={id} label={label} localized={localized} required={required} />
        }
      />
    </div>
  )
}
