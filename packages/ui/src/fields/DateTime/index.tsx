'use client'
import type { DateFieldClientComponent, DateFieldValidation } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback } from 'react'

import { DatePickerField } from '../../elements/DatePicker/index.js'
import { useField } from '../../forms/useField/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

const baseClass = 'date-time-field'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { withCondition } from '../../forms/withCondition/index.js'

const DateTimeFieldComponent: DateFieldClientComponent = (props) => {
  const {
    AfterInput,
    BeforeInput,
    Description,
    Error,
    field: {
      name,
      _path: pathFromProps,
      admin: {
        className,
        date: datePickerProps,
        placeholder,
        readOnly: readOnlyFromAdmin,
        style,
        width,
      } = {},
      required,
    },
    Label,
    readOnly: readOnlyFromTopLevelProps,
    validate,
  } = props

  const readOnlyFromProps = readOnlyFromTopLevelProps || readOnlyFromAdmin

  const { i18n } = useTranslation()

  const memoizedValidate: DateFieldValidation = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()

  const { formInitializing, formProcessing, path, setValue, showError, value } = useField<Date>({
    path: pathFromContext ?? pathFromProps ?? name,
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || readOnlyFromContext || formProcessing || formInitializing

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        showError && `${baseClass}--has-error`,
        disabled && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      {Label}
      <div className={`${fieldBaseClass}__wrap`} id={`field-${path.replace(/\./g, '__')}`}>
        {Error}
        {BeforeInput}
        <DatePickerField
          {...datePickerProps}
          onChange={(incomingDate) => {
            if (!disabled) {
              setValue(incomingDate?.toISOString() || null)
            }
          }}
          placeholder={getTranslation(placeholder, i18n)}
          readOnly={disabled}
          value={value}
        />
        {AfterInput}
      </div>
      {Description}
    </div>
  )
}

export const DateTimeField = withCondition(DateTimeFieldComponent)
