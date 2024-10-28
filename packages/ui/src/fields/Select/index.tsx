'use client'
import type {
  Option,
  OptionObject,
  SelectFieldClientComponent,
  SelectFieldClientProps,
} from 'payload'

import React, { useCallback } from 'react'

import type { ReactSelectAdapterProps } from '../../elements/ReactSelect/types.js'
import type { SelectInputProps } from './Input.js'

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

const SelectFieldComponent: SelectFieldClientComponent = (props) => {
  const {
    field: {
      name,
      admin: {
        className,
        isClearable = true,
        isSortable = true,
        readOnly: readOnlyFromAdmin,
        style,
        width,
      } = {} as SelectFieldClientProps['field']['admin'],
      hasMany = false,
      label,
      localized,
      options: optionsFromProps = [],
      required,
    },
    fieldState: {
      customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    } = {},
    onChange: onChangeFromProps,
    path: pathFromProps,
    readOnly: readOnlyFromTopLevelProps,
    validate,
  } = props

  const readOnlyFromProps = readOnlyFromTopLevelProps || readOnlyFromAdmin

  const options = React.useMemo(() => formatOptions(optionsFromProps), [optionsFromProps])

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function') {
        return validate(value, { ...validationOptions, hasMany, options, required })
      }
    },
    [validate, required, hasMany, options],
  )

  const path = pathFromProps ?? name

  const { formInitializing, formProcessing, setValue, showError, value } = useField({
    path,
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || formProcessing || formInitializing

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
      AfterInput={AfterInput}
      BeforeInput={BeforeInput}
      className={className}
      Description={Description}
      Error={Error}
      hasMany={hasMany}
      isClearable={isClearable}
      isSortable={isSortable}
      Label={Label}
      label={label}
      localized={localized}
      name={name}
      onChange={onChange}
      options={options}
      path={path}
      readOnly={disabled}
      showError={showError}
      style={style}
      value={value as string | string[]}
      width={width}
    />
  )
}

export const SelectField = withCondition(SelectFieldComponent)

export { SelectInput, type SelectInputProps }
