'use client'
import React from 'react'
import { useTranslation } from '../../../providers/Translation'

import type { DateField } from 'payload/types'

import { getTranslation } from 'payload/utilities'
import DatePicker from '../../../elements/DatePicker'
import useField from '../../useField'

export type DateTimeInputProps = Omit<DateField, 'admin' | 'name' | 'type'> & {
  datePickerProps?: DateField['admin']['date']
  path: string
  placeholder?: Record<string, string> | string
  readOnly?: boolean
  style?: React.CSSProperties
  width?: string
}

export const DateTimeInput: React.FC<DateTimeInputProps> = (props) => {
  const { path, readOnly, placeholder, datePickerProps, style, width } = props

  const { i18n } = useTranslation()

  // const memoizedValidate = useCallback(
  //   (value, options) => {
  //     return validate(value, { ...options, required })
  //   },
  //   [validate, required],
  // )

  const { errorMessage, setValue, showError, value } = useField<Date>({
    // condition,
    path,
    // validate: memoizedValidate,
  })

  return (
    <DatePicker
      {...datePickerProps}
      onChange={(incomingDate) => {
        if (!readOnly) setValue(incomingDate?.toISOString() || null)
      }}
      style={style}
      width={width}
      placeholder={getTranslation(placeholder, i18n)}
      readOnly={readOnly}
      value={value}
    />
  )
}
