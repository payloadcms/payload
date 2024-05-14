import React from 'react'

import type { RadioField } from '../../../../../fields/config/types'
import type { Description } from '../../FieldDescription/types'
import type { OnChange } from './types'

import { optionIsObject } from '../../../../../fields/config/types'
import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import DefaultLabel from '../../Label'
import { fieldBaseClass } from '../shared'
import RadioInput from './RadioInput'
import './index.scss'

const baseClass = 'radio-group'

export type RadioGroupInputProps = Omit<RadioField, 'type'> & {
  Error?: React.ComponentType<any>
  Label?: React.ComponentType<any>
  className?: string
  description?: Description
  errorMessage?: string
  layout?: 'horizontal' | 'vertical'
  onChange?: OnChange
  path?: string
  placeholder?: string
  readOnly?: boolean
  required?: boolean
  showError?: boolean
  style?: React.CSSProperties
  value?: string
  width?: string
}

const RadioGroupInput: React.FC<RadioGroupInputProps> = (props) => {
  const {
    name,
    Error,
    Label,
    className,
    description,
    errorMessage,
    label,
    layout = 'horizontal',
    onChange,
    options,
    path: pathFromProps,
    readOnly,
    required,
    showError,
    style,
    value,
    width,
  } = props

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  const path = pathFromProps || name

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        `${baseClass}--layout-${layout}`,
        showError && 'error',
        readOnly && `${baseClass}--read-only`,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <div className={`${baseClass}__error-wrap`}>
        <ErrorComp message={errorMessage} showError={showError} />
      </div>
      <LabelComp htmlFor={`field-${path}`} label={label} required={required} />
      <ul className={`${baseClass}--group`} id={`field-${path.replace(/\./g, '__')}`}>
        {options.map((option) => {
          let optionValue = ''

          if (optionIsObject(option)) {
            optionValue = option.value
          } else {
            optionValue = option
          }

          const isSelected = String(optionValue) === String(value)

          return (
            <li key={`${path} - ${optionValue}`}>
              <RadioInput
                isSelected={isSelected}
                onChange={readOnly ? undefined : onChange}
                option={optionIsObject(option) ? option : { label: option, value: option }}
                path={path}
                readOnly={readOnly}
              />
            </li>
          )
        })}
      </ul>
      <FieldDescription description={description} path={path} value={value} />
    </div>
  )
}

export default RadioGroupInput
