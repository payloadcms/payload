/* eslint-disable react/destructuring-assignment */
/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import type { FieldBase, Option } from 'payload/types'

import { optionIsObject } from 'payload/types'
import React, { useCallback } from 'react'

import { useForm } from '../../forms/Form/context.js'
import { Label as LabelComp } from '../../forms/Label/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { fieldBaseClass } from '../shared/index.js'
import { Radio } from './Radio/index.js'
import './index.scss'

const baseClass = 'radio-group'

import type { FormFieldBase } from '../shared/index.js'

export type RadioFieldProps = FormFieldBase & {
  label?: FieldBase['label']
  layout?: 'horizontal' | 'vertical'
  name?: string
  onChange?: OnChange
  options?: Option[]
  path?: string
  value?: string
  width?: string
}

export type OnChange<T = string> = (value: T) => void

const RadioGroupField: React.FC<RadioFieldProps> = (props) => {
  const {
    name,
    Description,
    Error,
    Label: LabelFromProps,
    className,
    label,
    layout = 'horizontal',
    onChange: onChangeFromProps,
    options = [],
    path: pathFromProps,
    readOnly,
    required,
    style,
    validate,
    value: valueFromProps,
    width,
  } = props

  const { uuid } = useForm()

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function')
        return validate(value, { ...validationOptions, options, required })
    },
    [validate, options, required],
  )

  const {
    path,
    setValue,
    showError,
    value: valueFromContext,
  } = useField<string>({
    path: pathFromProps || name,
    validate: memoizedValidate,
  })

  const value = valueFromContext || valueFromProps

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
      <div className={`${baseClass}__error-wrap`}>{Error}</div>
      {Label}
      <ul className={`${baseClass}--group`} id={`field-${path.replace(/\./g, '__')}`}>
        {options.map((option) => {
          let optionValue = ''

          if (optionIsObject(option)) {
            optionValue = option.value
          } else {
            optionValue = option
          }

          const isSelected = String(optionValue) === String(value)

          const id = `field-${path}-${optionValue}${uuid ? `-${uuid}` : ''}`

          return (
            <li key={`${path} - ${optionValue}`}>
              <Radio
                id={id}
                isSelected={isSelected}
                onChange={() => {
                  if (typeof onChangeFromProps === 'function') {
                    onChangeFromProps(optionValue)
                  }

                  if (!readOnly) {
                    setValue(optionValue)
                  }
                }}
                option={optionIsObject(option) ? option : { label: option, value: option }}
                path={path}
                uuid={uuid}
              />
            </li>
          )
        })}
      </ul>
      {Description}
    </div>
  )
}

export const RadioGroup = withCondition(RadioGroupField)
