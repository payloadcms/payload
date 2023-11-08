import React, { useCallback } from 'react'

import type { Props } from './types'

import { date as dateValidation } from '../../../../../fields/validations'
import { getTranslation } from '../../../../../utilities/getTranslation'
import DatePicker from '../../../elements/DatePicker'
import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import DefaultLabel from '../../Label'
import useField from '../../useField'
import withCondition from '../../withCondition'
import { DateTimeInput } from './Input'
import './index.scss'

const DateTime: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      condition,
      date,
      description,
      placeholder,
      readOnly,
      style,
      width,
      components: { Error, Label, BeforeInput, AfterInput } = {},
    } = {},
    label,
    path: pathFromProps,
    required,
    validate = dateValidation,
  } = props

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  const { i18n } = useTranslation()

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
