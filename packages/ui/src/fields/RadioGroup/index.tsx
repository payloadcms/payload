'use client'
import type { RadioFieldClientComponent, RadioFieldClientProps } from 'payload'

import { optionIsObject } from 'payload/shared'
import React, { useCallback } from 'react'

import { useForm } from '../../forms/Form/context.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'
import { Radio } from './Radio/index.js'

const baseClass = 'radio-group'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'

const RadioGroupFieldComponent: RadioFieldClientComponent = (props) => {
  const {
    Description,
    Error,
    field: {
      name,
      _path: pathFromProps,
      admin: {
        className,
        layout = 'horizontal',
        readOnly: readOnlyFromAdmin,
        style,
        width,
      } = {} as RadioFieldClientProps['field']['admin'],
      options = [],
      required,
    } = {} as RadioFieldClientProps['field'],
    Label,
    onChange: onChangeFromProps,
    readOnly: readOnlyFromTopLevelProps,
    validate,
    value: valueFromProps,
  } = props

  const readOnlyFromProps = readOnlyFromTopLevelProps || readOnlyFromAdmin

  const { uuid } = useForm()

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function') {
        return validate(value, { ...validationOptions, options, required })
      }
    },
    [validate, options, required],
  )

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()

  const {
    formInitializing,
    formProcessing,
    path,
    setValue,
    showError,
    value: valueFromContext,
  } = useField<string>({
    path: pathFromContext ?? pathFromProps ?? name,
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || readOnlyFromContext || formProcessing || formInitializing

  const value = valueFromContext || valueFromProps

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        `${baseClass}--layout-${layout}`,
        showError && 'error',
        disabled && `${baseClass}--read-only`,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      {Error}
      {Label}
      <div className={`${fieldBaseClass}__wrap`}>
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

                    if (!disabled) {
                      setValue(optionValue)
                    }
                  }}
                  option={optionIsObject(option) ? option : { label: option, value: option }}
                  path={path}
                  readOnly={disabled}
                  uuid={uuid}
                />
              </li>
            )
          })}
        </ul>
        {Description}
      </div>
    </div>
  )
}

export const RadioGroupField = withCondition(RadioGroupFieldComponent)
