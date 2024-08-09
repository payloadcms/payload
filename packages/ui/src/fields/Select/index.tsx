'use client'
import type { Option, OptionObject, SelectFieldProps } from 'payload'

import React, { useCallback } from 'react'

import type { ReactSelectAdapterProps } from '../../elements/ReactSelect/types.js'
import type { SelectInputProps } from './Input.js'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { SelectInput } from './Input.js'

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

const SelectFieldComponent: React.FC<SelectFieldProps> = (props) => {
  const {
    field,
    field: {
      name,
      _path: pathFromProps,
      admin: {
        className,
        description,
        isClearable = true,
        isSortable = true,
        readOnly: readOnlyFromProps,
        style,
        width,
      } = {} as SelectFieldProps['field']['admin'],
      hasMany = false,
      label,
      options: optionsFromProps = [],
      required,
    },
    onChange: onChangeFromProps,
    validate,
  } = props

  const options = React.useMemo(() => formatOptions(optionsFromProps), [optionsFromProps])

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function')
        return validate(value, { ...validationOptions, hasMany, options, required })
    },
    [validate, required, hasMany, options],
  )

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()

  const { formInitializing, formProcessing, path, setValue, showError, value } = useField({
    path: pathFromContext ?? pathFromProps ?? name,
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || readOnlyFromContext || formProcessing || formInitializing

  const onChange: ReactSelectAdapterProps['onChange'] = useCallback(
    (selectedOption: OptionObject | OptionObject[]) => {
      if (!disabled) {
        let newValue: string | string[] = null
        if (selectedOption && hasMany) {
          if (Array.isArray(selectedOption)) {
            newValue = selectedOption.map((option) => option.value)
          } else {
            newValue = []
          }
        } else if (selectedOption && !Array.isArray(selectedOption)) {
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
      Description={field?.admin?.components?.Description}
      Error={field?.admin?.components?.Error}
      Label={field?.admin?.components?.Label}
      afterInput={field?.admin?.components?.afterInput}
      beforeInput={field?.admin?.components?.beforeInput}
      className={className}
      description={description}
      hasMany={hasMany}
      isClearable={isClearable}
      isSortable={isSortable}
      label={label}
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

export const SelectField = withCondition(SelectFieldComponent)

export { SelectInput, type SelectInputProps }
