'use client'

import React, { createContext, use, useId } from 'react'

import { Tooltip } from '../Tooltip/index.js'
import './index.css'

const baseClass = 'segmented-control'
type ContextValue = { name: string; onChange: (value: string) => void; value: string }
const Context = createContext<ContextValue | null>(null)

export type SegmentedControlRootProps = {
  readonly children: React.ReactNode
  readonly className?: string
  readonly legend: string
  readonly onChange: (value: string) => void
  readonly value: string
}

const Root: React.FC<SegmentedControlRootProps> = ({
  children,
  className,
  legend,
  onChange,
  value,
}) => {
  const name = useId()

  return (
    <div
      aria-label={legend}
      className={[baseClass, className].filter(Boolean).join(' ')}
      role="radiogroup"
    >
      <div className={`${baseClass}__options`}>
        <Context value={{ name, onChange, value }}>{children}</Context>
      </div>
    </div>
  )
}

export type SegmentedControlOptionProps = {
  readonly 'aria-label': string
  readonly icon: React.ReactNode
  readonly tooltip?: string
  readonly value: string
}

const Option: React.FC<SegmentedControlOptionProps> = ({
  'aria-label': ariaLabel,
  icon,
  tooltip = ariaLabel,
  value: optionValue,
}) => {
  const context = use(Context)
  const [showTooltip, setShowTooltip] = React.useState(false)

  if (!context) {
    throw new Error('SegmentedControl.Option must be rendered within a SegmentedControl.Root')
  }
  const { name, onChange, value } = context
  const id = `${name}-${optionValue}`

  return (
    <div className={`${baseClass}__option`}>
      <Tooltip aria-hidden={true} delay={300} position="top" show={showTooltip}>
        {tooltip}
      </Tooltip>
      <input
        aria-label={ariaLabel}
        checked={value === optionValue}
        className={`${baseClass}__input`}
        id={id}
        name={name}
        onBlur={() => setShowTooltip(false)}
        onChange={() => onChange(optionValue)}
        onFocus={() => setShowTooltip(true)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        type="radio"
        value={optionValue}
      />
      <span aria-hidden className={`${baseClass}__icon`}>
        {icon}
      </span>
      <label className="sr-only" htmlFor={id}>
        {ariaLabel}
      </label>
    </div>
  )
}

export const SegmentedControl = { Option, Root }
