'use client'
import React, { useCallback } from 'react'

import type { Props } from './types'

import useField from '../../useField'
import RadioGroupInput from './Input'

const RadioGroup: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Error, Label } = {},
      condition,
      description,
      layout = 'horizontal',
      readOnly,
      style,
      width,
    } = {},
    label,
    options,
    path: pathFromProps,
    required,
    validate,
  } = props

  const path = pathFromProps || name

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function')
        return validate(value, { ...validationOptions, options, required })
    },
    [validate, options, required],
  )

  const { errorMessage, setValue, showError, value } = useField<string>({
    path,
    validate: memoizedValidate,
  })

  return (
    <RadioGroupInput
      Error={Error}
      Label={Label}
      className={className}
      description={description}
      errorMessage={errorMessage}
      label={label}
      layout={layout}
      name={name}
      onChange={readOnly ? undefined : setValue}
      options={options}
      path={path}
      required={required}
      showError={showError}
      style={style}
      value={value}
      width={width}
    />
  )
}

export default RadioGroup
