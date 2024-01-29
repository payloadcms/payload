'use client'
import React, { useCallback } from 'react'

import type { Props } from './types'

import { fieldBaseClass } from '../shared'
import DatePickerField from '../../../elements/DatePicker'
import { getTranslation } from '@payloadcms/translations'
import { Validate } from 'payload/types'
import useField from '../../useField'
import { useTranslation } from '../../../providers/Translation'

import './index.scss'

const baseClass = 'date-time-field'

const DateTime: React.FC<Props> = (props) => {
  const {
    name,
    className,
    placeholder,
    readOnly,
    style,
    width,
    path: pathFromProps,
    required,
    Error,
    Label,
    BeforeInput,
    AfterInput,
    Description,
    validate,
  } = props

  const datePickerProps = 'date' in props ? props.date : {}

  const { i18n } = useTranslation()

  const memoizedValidate: Validate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const { setValue, showError, value, path } = useField<Date>({
    path: pathFromProps || name,
    validate: memoizedValidate,
  })

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        showError && `${baseClass}--has-error`,
        readOnly && 'read-only',
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
      <div className={`${baseClass}__input-wrapper`} id={`field-${path.replace(/\./g, '__')}`}>
        {BeforeInput}
        <DatePickerField
          {...datePickerProps}
          onChange={(incomingDate) => {
            if (!readOnly) setValue(incomingDate?.toISOString() || null)
          }}
          placeholder={getTranslation(placeholder, i18n)}
          readOnly={readOnly}
          value={value}
        />
        {AfterInput}
      </div>
      {Description}
    </div>
  )
}

export default DateTime
