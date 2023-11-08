import React from 'react'

import Check from '../../../icons/Check'
import Line from '../../../icons/Line'
import DefaultLabel from '../../Label'
import type { Props as LabelProps } from '../../Label/types'
import './index.scss'

const baseClass = 'checkbox-input'

type CheckboxInputProps = {
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
  className?: string
  Label?: React.ComponentType<LabelProps>
  BeforeInput?: React.ReactElement<any>[]
  AfterInput?: React.ReactElement<any>[]
}

export const CheckboxInput: React.FC<CheckboxInputProps> = (props) => {
  const {
    id,
    name,
    'aria-label': ariaLabel,
    checked,
    className,
    inputRef,
    label,
    onToggle,
    partialChecked,
    readOnly,
    required,
    className,
    Label,
    BeforeInput,
    AfterInput,
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
