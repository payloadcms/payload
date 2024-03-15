/* eslint-disable react/destructuring-assignment */
'use client'
import type { ClientValidate } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback } from 'react'

import type { Props } from './types.js'

import { DatePickerField } from '../../../elements/DatePicker/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { useField } from '../../useField/index.js'
import { fieldBaseClass } from '../shared.js'
import './index.scss'

const baseClass = 'date-time-field'

const DateTime: React.FC<Props> = (props) => {
  const {
    name,
    AfterInput,
    BeforeInput,
    Description,
    Error,
    Label: LabelComp,
    className,
    label,
    path: pathFromProps,
    placeholder,
    readOnly,
    required,
    style,
    validate,
    width,
  } = props

  const Label = LabelComp || label

  const datePickerProps = 'date' in props ? props.date : {}

  const { i18n } = useTranslation()

  const memoizedValidate: ClientValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const { path, setValue, showError, value } = useField<Date>({
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
