import React, { useCallback, useEffect, useState } from 'react'

import type { Option, OptionObject } from '../../../../../fields/config/types'
import type { Props } from './types'

import { select } from '../../../../../fields/validations'
import useField from '../../useField'
import withCondition from '../../withCondition'
import SelectInput from './Input'

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

const Select: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      condition,
      description,
      isClearable,
      isSortable = true,
      readOnly,
      style,
      width,
      components: { Error, Label } = {},
    } = {},
    hasMany,
    label,
    options: optionsFromProps,
    path: pathFromProps,
    required,
    validate = select,
  } = props

  const path = pathFromProps || name

  const [options, setOptions] = useState(formatOptions(optionsFromProps))

  useEffect(() => {
    setOptions(formatOptions(optionsFromProps))
  }, [optionsFromProps])

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      return validate(value, { ...validationOptions, hasMany, options, required })
    },
    [validate, required, hasMany, options],
  )

  const { errorMessage, setValue, showError, value } = useField({
    condition,
    path,
    validate: memoizedValidate,
  })

  const onChange = useCallback(
    (selectedOption) => {
      if (!readOnly) {
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

        setValue(newValue)
      }
    },
    [readOnly, hasMany, setValue],
  )

  return (
    <SelectInput
      className={className}
      description={description}
      errorMessage={errorMessage}
      hasMany={hasMany}
      isClearable={isClearable}
      isSortable={isSortable}
      label={label}
      name={name}
      onChange={onChange}
      options={options}
      path={path}
      readOnly={readOnly}
      required={required}
      showError={showError}
      style={style}
      value={value as string | string[]}
      width={width}
      Error={Error}
      Label={Label}
    />
  )
}

export default withCondition(Select)
