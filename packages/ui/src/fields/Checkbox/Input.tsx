'use client'
import type { StaticLabel } from 'payload'

import React, { useEffect, useId, useState } from 'react'

import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { Tooltip } from '../../elements/Tooltip/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { CheckIcon } from '../../icons/Check/index.js'
import { LineIcon } from '../../icons/Line/index.js'

export type CheckboxInputProps = {
  readonly AfterInput?: React.ReactNode
  readonly 'aria-label'?: string
  readonly 'aria-labelledby'?: string
  readonly BeforeInput?: React.ReactNode
  readonly checked?: boolean
  readonly className?: string
  readonly Error?: React.ReactNode
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
  readonly tooltip?: string
  /**
   * Visual variant for the checkbox
   * - 'default': Dark border, transparent background (for form fields)
   * - 'muted': Light gray background and border (for tables)
   */
  readonly variant?: 'default' | 'muted'
}

export const inputBaseClass = 'checkbox-input'

export const CheckboxInput: React.FC<CheckboxInputProps> = ({
  id: idFromProps,
  name,
  AfterInput,
  'aria-label': ariaLabelFromProps,
  'aria-labelledby': ariaLabelledByFromProps,
  BeforeInput,
  checked,
  className,
  Error,
  inputRef,
  Label,
  label,
  localized,
  onToggle,
  partialChecked,
  readOnly: readOnlyFromProps,
  required,
  tooltip,
  variant = 'default',
}) => {
  const [isHydrated, setIsHydrated] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const fallbackID = useId()
  const id = idFromProps || fallbackID
  const ariaLabel = ariaLabelFromProps || undefined
  const ariaLabelledBy = ariaLabel ? undefined : ariaLabelledByFromProps || name

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
        tooltip && `${inputBaseClass}--has-tooltip`,
        variant !== 'default' && `${inputBaseClass}--${variant}`,
      ]
        .filter(Boolean)
        .join(' ')}
      onPointerEnter={tooltip ? () => setShowTooltip(true) : undefined}
      onPointerLeave={tooltip ? () => setShowTooltip(false) : undefined}
    >
      {BeforeInput}
      <div className={`${inputBaseClass}__wrap`}>
        <div className={`${inputBaseClass}__input`}>
          <input
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
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
        </div>
        <RenderCustomComponent
          CustomComponent={Label}
          Fallback={
            <FieldLabel htmlFor={id} label={label} localized={localized} required={required} />
          }
        />
        {Error}
      </div>
      {tooltip && (
        <Tooltip alignCaret="left" className={`${inputBaseClass}__tooltip`} show={showTooltip}>
          {tooltip}
        </Tooltip>
      )}
      {AfterInput}
    </div>
  )
}
