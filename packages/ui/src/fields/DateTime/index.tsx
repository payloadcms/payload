'use client'
import type { DateFieldClientComponent, DateFieldValidation } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback } from 'react'

import { DatePickerField } from '../../elements/DatePicker/index.js'
import { FieldDescription } from '../../fields/FieldDescription/index.js'
import { FieldError } from '../../fields/FieldError/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

const baseClass = 'date-time-field'

const DateTimeFieldComponent: DateFieldClientComponent = (props) => {
  const {
    field: {
      name,
      admin: { className, date: datePickerProps, description, placeholder, style, width } = {},
      label,
      localized,
      required,
    },
    fieldState: {
      customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    } = {},
    path: pathFromProps,
    readOnly,
    validate,
  } = props

  const { i18n } = useTranslation()

  const memoizedValidate: DateFieldValidation = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const path = pathFromProps ?? name

  const { setValue, showError, value } = useField<Date>({
    path,
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
      {Label ?? <FieldLabel label={label} localized={localized} required={required} />}
      <div className={`${fieldBaseClass}__wrap`} id={`field-${path.replace(/\./g, '__')}`}>
        {Error ?? <FieldError path={path} showError={showError} />}
        {BeforeInput}
        <DatePickerField
          {...datePickerProps}
          onChange={(incomingDate) => {
            if (!readOnly) {
              setValue(incomingDate?.toISOString() || null)
            }
          }}
          placeholder={getTranslation(placeholder, i18n)}
          readOnly={readOnly}
          value={value}
        />
        {AfterInput}
      </div>
      {Description ?? <FieldDescription description={description} path={path} />}
    </div>
  )
}

export const DateTimeField = withCondition(DateTimeFieldComponent)
