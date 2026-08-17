'use client'

import React, { createContext, use, useId } from 'react'

import './index.css'

const baseClass = 'segmented-control'

type SegmentedControlContextValue = {
  name: string
  onChange: (value: string) => void
  value: string
}

const SegmentedControlContext = createContext<null | SegmentedControlContextValue>(null)

export type SegmentedControlRootProps = {
  readonly children: React.ReactNode
  readonly className?: string
  readonly legend: string
  readonly onChange: (value: string) => void
  readonly value: string
}

/**
 * Root element for SegmentedControl, which uses icons to choose between a set of independent states.
 */
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
        <SegmentedControlContext value={{ name, onChange, value }}>
          {children}
        </SegmentedControlContext>
      </div>
    </div>
  )
}

export type SegmentedControlOptionProps = {
  readonly 'aria-label': string
  readonly icon: React.ReactNode
  readonly value: string
}

/**
 * An option of a SegmentedControl, nested within a `.Root`.
 */
const Option: React.FC<SegmentedControlOptionProps> = ({
  'aria-label': ariaLabel,
  icon,
  value: optionValue,
}) => {
  const context = use(SegmentedControlContext)

  if (!context) {
    throw new Error('SegmentedControl.Option must be rendered within a SegmentedControl.Root')
  }

  const { name, onChange, value } = context
  const id = `${name}-${optionValue}`

  return (
    <div className={`${baseClass}__option`}>
      <input
        checked={value === optionValue}
        className={`${baseClass}__input`}
        id={id}
        name={name}
        onChange={() => onChange(optionValue)}
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

export const SegmentedControl = {
  Option,
  Root,
}
