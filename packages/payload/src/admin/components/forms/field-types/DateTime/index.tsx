import React, { useCallback } from 'react'

import type { Props } from './types'

import { date as dateValidation } from '../../../../../fields/validations'
import useField from '../../useField'
import withCondition from '../../withCondition'
import { DateTimeInput } from './Input'
import './index.scss'

const DateTime: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      components,
      condition,
      date,
      description,
      placeholder,
      readOnly,
      style,
      width,
    } = {},
    label,
    path: pathFromProps,
    required,
    validate = dateValidation,
  } = props

  const path = pathFromProps || name

  const memoizedValidate = useCallback(
    (value, options) => {
      return validate(value, { ...options, required })
    },
    [validate, required],
  )

  const { errorMessage, setValue, showError, value } = useField<Date>({
    condition,
    path,
    validate: memoizedValidate,
  })

  return (
    <DateTimeInput
      className={className}
      components={components}
      datePickerProps={date}
      description={description}
      errorMessage={errorMessage}
      label={label}
      onChange={(incomingDate) => {
        if (!readOnly) setValue(incomingDate?.toISOString() || null)
      }}
      path={path}
      placeholder={placeholder}
      readOnly={readOnly}
      required={required}
      showError={showError}
      style={style}
      value={value}
      width={width}
    />
  )
}

export default withCondition(DateTime)
