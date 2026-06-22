'use client'
import React from 'react'

import './index.css'

const baseClass = 'unit-input'

export type UnitInputProps = {
  /** Right-aligned controls slot, e.g. an `InputStepper`. */
  readonly actions?: React.ReactNode
  readonly ariaLabel: string
  readonly className?: string
  readonly max?: number
  readonly min?: number
  readonly name: string
  readonly onChange: (value: string) => void
  /** Short text affix rendered before the value, e.g. `W`, `H`, `X`. */
  readonly prefix: string
  readonly readOnly?: boolean
  readonly step?: number
  /** Short text affix rendered after the value, e.g. `%`. */
  readonly suffix?: string
  readonly value: number
}

export const UnitInput: React.FC<UnitInputProps> = ({
  name,
  actions,
  ariaLabel,
  className,
  max,
  min,
  onChange,
  prefix,
  readOnly,
  step,
  suffix,
  value,
}) => (
  <div className={[baseClass, className].filter(Boolean).join(' ')}>
    <span className={`${baseClass}__prefix`}>{prefix}</span>
    <input
      aria-label={ariaLabel}
      className={`${baseClass}__field`}
      max={max}
      min={min}
      name={name}
      onChange={(e) => onChange(e.target.value)}
      onWheel={(e) => e.currentTarget.blur()}
      readOnly={readOnly}
      step={step}
      type="number"
      value={value}
    />
    {suffix ? <span className={`${baseClass}__suffix`}>{suffix}</span> : null}
    {actions ? <div className={`${baseClass}__actions`}>{actions}</div> : null}
  </div>
)
