import React from 'react'

import type { Props as LabelProps } from '../../Label/types'

import Check from '../../../icons/Check'
import Line from '../../../icons/Line'
import DefaultLabel from '../../Label'
import './index.scss'

const baseClass = 'checkbox-input'

type CheckboxInputProps = {
  AfterInput?: React.ReactElement<any>[]
  BeforeInput?: React.ReactElement<any>[]
  Label?: React.ComponentType<LabelProps>
  'aria-label'?: string
  checked?: boolean
  className?: string
  id?: string
  inputRef?: React.MutableRefObject<HTMLInputElement>
  label?: string
  name?: string
  onToggle: React.FormEventHandler<HTMLInputElement>
  partialChecked?: boolean
  readOnly?: boolean
  required?: boolean
}

export const CheckboxInput: React.FC<CheckboxInputProps> = (props) => {
  const {
    id,
    name,
    AfterInput,
    BeforeInput,
    Label,
    'aria-label': ariaLabel,
    checked,
    className,
    inputRef,
    label,
    onToggle,
    partialChecked,
    readOnly,
    required,
  } = props

  const LabelComp = Label || DefaultLabel

  return (
    <div
      className={[
        baseClass,
        className,
        (checked || partialChecked) && `${baseClass}--checked`,
        readOnly && `${baseClass}--read-only`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={`${baseClass}__input`}>
        {BeforeInput}
        <input
          aria-label={ariaLabel}
          defaultChecked={Boolean(checked)}
          disabled={readOnly}
          id={id}
          name={name}
          onInput={onToggle}
          ref={inputRef}
          type="checkbox"
        />
        {AfterInput}
        <span className={`${baseClass}__icon ${!partialChecked ? 'check' : 'partial'}`}>
          {!partialChecked && <Check />}
          {partialChecked && <Line />}
        </span>
      </div>
      {label && <LabelComp htmlFor={id} label={label} required={required} />}
    </div>
  )
}
