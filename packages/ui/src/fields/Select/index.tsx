/* eslint-disable react/destructuring-assignment */
'use client'
import type { ClientValidate, Option, OptionObject } from 'payload'

import React, { useCallback, useState } from 'react'

import type { FormFieldBase } from '../shared/index.js'
import type { SelectInputProps } from './Input.js'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { SelectInput } from './Input.js'

export type SelectFieldProps = FormFieldBase & {
  hasMany?: boolean
  isClearable?: boolean
  isSortable?: boolean
  name?: string
  onChange?: (e: string) => void
  options?: Option[]
  path?: string
  value?: string
  width?: string
}

const formatOptions = (options: Option[]): OptionObject[] =>
  options.map((option) => {
    if (typeof option === 'object' && (option.value || option.value === '')) {
      return option
    }

    return {
      label: option,
      value: option,
    } as OptionObject
  })

const SelectField: React.FC<SelectFieldProps> = (props) => {
  const {
    name,
    AfterInput,
    BeforeInput,
    CustomDescription,
    CustomError,
    CustomLabel,
    className,
    descriptionProps,
    errorProps,
    hasMany = false,
    isClearable = true,
    isSortable = true,
    label,
    labelProps,
    onChange: onChangeFromProps,
    options: optionsFromProps = [],
    path: pathFromProps,
    readOnly: readOnlyFromProps,
    required,
    style,
    validate,
    width,
  } = props

  const [options] = useState(formatOptions(optionsFromProps))

  const memoizedValidate: ClientValidate = useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function')
        return validate(value, { ...validationOptions, hasMany, options, required })
    },
    [validate, required, hasMany, options],
  )

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()

  const { formInitializing, formProcessing, path, setValue, showError, value } = useField({
    path: pathFromContext || pathFromProps || name,
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || readOnlyFromContext || formProcessing || formInitializing

  const onChange = useCallback(
    (selectedOption) => {
      if (!disabled) {
        let newValue
        if (!selectedOption) {
          newValue = null
        } else if (hasMany) {
          if (Array.isArray(selectedOption)) {
            newValue = selectedOption.map((option) => option.value)
          } else {
            newValue = []
          }
        } else {
          newValue = selectedOption.value
        }

        if (typeof onChangeFromProps === 'function') {
          onChangeFromProps(newValue)
        }

        setValue(newValue)
      }
    },
    [disabled, hasMany, setValue, onChangeFromProps],
  )

  return (
    <SelectInput
      AfterInput={AfterInput}
      BeforeInput={BeforeInput}
      CustomDescription={CustomDescription}
      CustomError={CustomError}
      CustomLabel={CustomLabel}
      className={className}
      descriptionProps={descriptionProps}
      errorProps={errorProps}
      hasMany={hasMany}
      isClearable={isClearable}
      isSortable={isSortable}
      label={label}
      labelProps={labelProps}
      name={name}
      onChange={onChange}
      options={options}
      path={path}
      readOnly={disabled}
      required={required}
      showError={showError}
      style={style}
      value={value as string | string[]}
      width={width}
    />
  )
}

export const Select = withCondition(SelectField)

export { SelectInput, type SelectInputProps }
